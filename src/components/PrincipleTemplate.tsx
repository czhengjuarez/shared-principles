import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  subject: string;
}

const SECTIONS = [
  {
    label: 'The statement',
    placeholder: 'One sentence — what must be true, not how to do it.',
  },
  {
    label: 'Why this matters',
    placeholder:
      'The problem this principle solves, and why variation here creates flexibility rather than risk.',
  },
  {
    label: 'What good looks like — examples',
    placeholder:
      "2–3 examples of teams applying this differently but correctly.\n• [Team A's implementation]\n• [Team B's different approach — same principle met, different method]\n• [A third variation]",
  },
  {
    label: 'What would violate it',
    placeholder: 'What clearly breaks this principle regardless of implementation method.',
  },
  {
    label: "How to know it's working",
    placeholder: 'Outcome-based measures, not conformity checks.',
  },
  {
    label: 'When to review',
    placeholder: 'Quarterly, or after a specific adoption milestone.',
  },
];

function buildCopyText(subject: string): string {
  const header = subject ? `PRINCIPLE FOR: ${subject}` : 'PRINCIPLE FOR: [your topic]';
  const rule = '─'.repeat(Math.min(header.length, 52));
  const sections = SECTIONS.map((s) => `${s.label.toUpperCase()}\n${s.placeholder}`).join(
    '\n\n',
  );
  return `${header}\n${rule}\n\n${sections}`;
}

export default function PrincipleTemplate({ subject }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(buildCopyText(subject)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="principle-template">
      <div className="principle-template__header">
        <div>
          <span className="principle-template__label">Principle template</span>
          {subject && (
            <span className="principle-template__subject">for {subject}</span>
          )}
        </div>
        <button
          type="button"
          className={`of-btn of-btn--secondary of-btn--sm principle-template__copy${copied ? ' principle-template__copy--done' : ''}`}
          onClick={handleCopy}
          aria-label="Copy template to clipboard"
        >
          {copied ? (
            <>
              <Check size={20} strokeWidth={1.75} />
              Copied
            </>
          ) : (
            <>
              <Copy size={20} strokeWidth={1.75} />
              Copy
            </>
          )}
        </button>
      </div>

      <div className="principle-template__sections">
        {SECTIONS.map((section) => (
          <div key={section.label} className="principle-template__section">
            <span className="principle-template__section-label">{section.label}</span>
            <span className="principle-template__section-placeholder">{section.placeholder}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
