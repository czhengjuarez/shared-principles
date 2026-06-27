import { getAssetFromKV } from '@cloudflare/kv-asset-handler';
import manifestJSON from '__STATIC_CONTENT_MANIFEST';

const assetManifest = JSON.parse(manifestJSON);

const AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ── POST /api/craft — principle writing assistant ─────────
// Body: { subject, answers: [{question, answer}], history: [{role, content}] }
// Grounded in the user's subject + their 7 answers. Socratically guides them
// through filling in the principle documentation template.
async function handleCraft(request, env) {
  if (!env.AI) return json({ error: 'Workers AI binding (AI) not configured.' }, 503);

  const body = await request.json().catch(() => ({}));
  const { subject, answers, history } = body;

  const subjectLabel = subject?.trim() || 'their topic';

  const answerSummary = Array.isArray(answers)
    ? answers
        .map((a, i) => `Q${i + 1}: ${a.question}\nTheir answer: ${a.answer}`)
        .join('\n\n')
    : 'No answers provided.';

  const systemPrompt = `You are helping an ops leader write a principle document for: "${subjectLabel}".

Based on their answers to a 7-question triage, this situation calls for SHARED PRINCIPLES — not a standard. A standard defines the exact process. A principle states what must be true. Teams implement it differently; the principle stays constant.

Their 7 answers:
${answerSummary}

Your job is to help them fill in this template through conversation:

---
PRINCIPLE FOR: ${subjectLabel}

THE STATEMENT
One sentence — what must be true, not how to do it.

WHY THIS MATTERS
The problem this principle solves, and why variation here creates flexibility rather than risk.

WHAT GOOD LOOKS LIKE — EXAMPLES
2–3 examples of teams applying this differently but correctly.

WHAT WOULD VIOLATE IT
What clearly breaks this principle regardless of implementation method.

HOW TO KNOW IT'S WORKING
Outcome-based measures, not conformity checks.

WHEN TO REVIEW
Quarterly, or after a specific adoption milestone.
---

Rules for how you work:
- Ask one specific question at a time. Build on their answers before moving on.
- Be direct and concise. No preamble or pleasantries.
- Stay grounded in their subject — do not give generic advice.
- If they draft a principle statement, push back if it describes a process instead of a truth. A good test: can 3 teams implement it 3 different ways and all be correct?
- One sentence max for the statement. If it has "and," it's two principles.
- Never write the template for them. Help them think so they can write it themselves.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(Array.isArray(history) ? history.slice(-10) : []).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 2000),
    })),
  ];

  try {
    const out = await env.AI.run(AI_MODEL, { messages, max_tokens: 500, temperature: 0.45 });
    const reply = (out && (out.response ?? out.result?.response)) || 'No reply.';
    return json({ reply: String(reply).trim() });
  } catch (err) {
    return json({ error: 'AI request failed', detail: String(err) }, 502);
  }
}

// ── Entry ────────────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/')) {
      try {
        if (path === '/api/craft' && request.method === 'POST') return handleCraft(request, env);
        return json({ error: 'Not found' }, 404);
      } catch (err) {
        return json({ error: 'Internal server error', detail: String(err) }, 500);
      }
    }

    // ── Static assets (SPA) ──
    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest },
      );
    } catch (e) {
      if (e.status === 404) {
        try {
          return await getAssetFromKV(
            { request: new Request(`${url.origin}/index.html`, request), waitUntil: ctx.waitUntil.bind(ctx) },
            { ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest },
          );
        } catch {
          return new Response('Not Found', { status: 404 });
        }
      }
      return new Response(`Internal Error: ${e.message}`, { status: 500 });
    }
  },
};
