import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import type { AnswerContext } from '../data/questions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  subject: string;
  answers: AnswerContext[];
}

const STARTER_PROMPTS = [
  'Help me write the principle statement',
  'What would violate this principle?',
  'What are good examples of teams applying this differently?',
];

export default function PrincipleCrafter({ subject, answers }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || loading) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/craft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, answers, history }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply ?? 'No reply.' }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'The AI crafter is unavailable right now. For local development, run the Worker with `npx wrangler dev --remote --port 8787`.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="crafter">
      <div className="crafter-head">
        <span className="crafter-dot" aria-hidden="true" />
        <strong>Craft with AI</strong>
        {subject && <span className="crafter-head__context">· {subject}</span>}
      </div>

      <div className="crafter-log" ref={logRef} aria-live="polite" aria-label="Conversation">
        {messages.length === 0 && (
          <div className="crafter-empty">
            <p>
              Answer a few questions to fill in your principle template. The AI is grounded in
              your 7 answers.
            </p>
            <div className="crafter-chips">
              {STARTER_PROMPTS.map((s) => (
                <button key={s} type="button" className="crafter-chip" onClick={() => send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`crafter-msg crafter-msg--${m.role}`}>
            <div className="crafter-bubble">{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="crafter-msg crafter-msg--assistant">
            <div className="crafter-bubble crafter-bubble--thinking">Thinking…</div>
          </div>
        )}
      </div>

      <form
        className="crafter-form"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          className="of-input crafter-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question or share a draft…"
          aria-label="Message the principle crafter"
          disabled={loading}
        />
        <button
          type="submit"
          className="of-btn of-btn--primary of-btn--md"
          disabled={loading || !input.trim()}
          aria-label="Send"
        >
          <Send size={20} strokeWidth={1.75} />
        </button>
      </form>
    </div>
  );
}
