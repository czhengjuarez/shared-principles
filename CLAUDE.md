# CLAUDE.md — Shared Principles

Agent context for Claude Code and deployed agents working on this project.

## What this is

Shared Principles is a 7-question triage tool that outputs a recommendation — **Standardize**, **Shared Principles**, or **Hybrid** — with reasoning and next steps. When the recommendation is Shared Principles, it also shows a principle documentation template and an AI-powered crafter to help write the principle.

Live: https://decision-framework.coscient.workers.dev
Owner: czhengjuarez / changying@coscient.com

---

## Stack

- **Runtime:** Cloudflare Workers (edge)
- **Frontend:** React 18 + TypeScript + Vite 6
- **Design system:** Keel `--of-*` tokens (vendored from `github.com/czhengjuarez/Keel`)
- **AI:** Cloudflare Workers AI — `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (principle crafter)
- **Storage:** None — no database, no R2

## Key commands

```bash
npm run dev          # Vite on :5173 (proxies /api → :8787)
npx wrangler dev --remote --port 8787  # Worker with live Workers AI (second terminal)
npm run build        # tsc -b && vite build → ./dist
npm run deploy       # build + wrangler deploy
```

---

## File map

| File | Purpose |
|---|---|
| `src/data/questions.ts` | **Single source of truth.** All 7 questions, option weights, lean labels, `Outcome` content, `AnswerContext` type, and the `score()` function. |
| `src/pages/Home.tsx` | State machine: step `-1` = intro, `0–6` = questions, `7` = result. Builds `AnswerContext[]` and passes to `ResultScreen`. No router. |
| `src/components/QuestionScreen.tsx` | Renders one question with 3 radio options and Back/Next nav. |
| `src/components/ResultScreen.tsx` | Recommendation hero, score badges, "What this means" + "Next steps" disclosures. When `recommendation === 'principles'`, renders `PrincipleTemplate` and `PrincipleCrafter`. |
| `src/components/PrincipleTemplate.tsx` | Six-section principle documentation template, subject-aware. Copy button exports plain text via `navigator.clipboard`. |
| `src/components/PrincipleCrafter.tsx` | AI chat component. Posts to `/api/craft` with `{ subject, answers, history }`. Starter chips, loading state, scrollable message log. |
| `src/components/Layout.tsx` | App shell + theme toggle. Sets `data-theme` + `colorScheme` on `<html>`, persists to `localStorage`. |
| `frontend-worker.js` | Cloudflare Worker: `POST /api/craft` (Workers AI) + static SPA asset serving with 404 → `index.html` fallback. |
| `src/styles/tokens.css` | Keel `--of-*` design tokens (vendored). Do not edit values. |
| `src/styles/keel.css` | Keel class helpers (vendored: `.of-btn`, `.of-card`, `.of-badge`, `.of-input`, etc.). |
| `src/styles/global.css` | App-level styles built on tokens. All color/space/radius via `--of-*` vars. |
| `wrangler.toml` | Worker config. Account: ChangyingArts (`d6ff2f09…`). Worker name: `decision-framework`. AI binding: `AI`. |

---

## Data model

```ts
type Lean = 'standardize' | 'principles' | 'hybrid';

interface Option       { text: string; lean: Lean; weight: number; }
interface Question     { id: string; question: string; options: Option[]; }
interface Outcome      { label: string; why: string; meaning: string; steps: string[]; }
interface AnswerContext { question: string; answer: string; } // serialised for the AI

// outcomes: Record<Lean, Outcome>  — full output text per recommendation
// score(answers: (number | null)[]): ScoreResult
```

### Scoring logic

```
1. Tally weighted votes per Lean category across all 7 answered questions.
2. If (max − min) ≤ 1 → hybrid (all three close).
3. If |standardize − principles| ≤ 1 → hybrid (the two poles tied).
4. Otherwise the highest total wins.
```

### Validated test scenarios

| Scenario | Answers (option indices 0/1/2) | Expected |
|----------|-------------------------------|----------|
| Production code review | q1:1, q2:0, q3:0, q4:0, q5:0, q6:0, q7:0 | STANDARDIZE |
| AI tool adoption (design teams) | all → option 1 (principles) | PRINCIPLES |
| Pull request workflow | q1:1, q2:2, q3:2, q4:2, q5:2, q6:2, q7:2 | HYBRID |

---

## API route

```
POST /api/craft
Body:  { subject: string, answers: AnswerContext[], history: {role, content}[] }
Reply: { reply: string }
```

The worker builds a system prompt grounding the AI in the user's subject, their 7 answers, and the target principle template structure. History is capped at the last 10 turns. No state is persisted — every request reconstructs context from what the frontend sends.

The AI model constant is at the top of `frontend-worker.js`:
```js
const AI_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
```
Update it there if the model is deprecated or you want to swap to a cheaper/faster model.

---

## Design system rules

- **Use `--of-*` tokens for everything** — no hardcoded color, spacing, radius, or shadow values in `global.css` or components.
- `tokens.css` and `keel.css` are vendored. When `@ops-forward/keel` is published as a package, replace both files with a single import.
- The result hero uses `.of-card.of-card--brand-elevated` (from `keel.css`) — this class already carries `linear-gradient(180deg, #FB41AA 0%, #8F1F57 100%)`.
- Light/dark: `color-scheme` + `light-dark()` CSS only. Never toggle a class for theme.
- Icons: Lucide, `size={20}`, `strokeWidth={1.75}`.
- No Tailwind.

---

## Agent use cases

### 1. Add or edit a question

Edit `src/data/questions.ts`. The structure is fully typed — add to `questions[]`, set option weights, update `outcomes` if changing output text. Run `npm run deploy`. Re-validate the 3 test scenarios with the scoring function before deploying.

### 2. Change recommendation output text

All output text (why, meaning, next steps) is in `outcomes` in `src/data/questions.ts`. Edit the relevant `Lean` key and redeploy. No component changes needed.

### 3. Adjust the principle template sections

The template sections array is at the top of `src/components/PrincipleTemplate.tsx` (`SECTIONS`). Each entry has a `label` and a `placeholder`. Editing this changes both the displayed template and the plain-text copy output — no other files need changing.

### 4. Tune the AI crafter system prompt

The system prompt is built inside `handleCraft()` in `frontend-worker.js`. It is injected with the user's subject, their 7 answers, and the principle template structure. The current instruction is to ask one question at a time and never write the principle for the user. Adjust tone, scope, or template structure there.

### 5. Adjust scoring thresholds

The tiebreaker logic is in the `score()` function in `src/data/questions.ts`. The threshold `≤ 1` for both guards is intentionally conservative — adjust and re-validate against the test scenarios before shipping.

### 6. Add a share/permalink feature (future)

Store a scored result as a JSON object in R2, keyed by a short random id. The worker gains two routes:
- `POST /r` — save result JSON, return `{ id }`
- `GET /r/:id` — retrieve result JSON

The SPA reads `?r=<id>` on load and skips to the result screen. No database required — R2 object store only. Add `[[r2_buckets]]` binding to `wrangler.toml`, create the bucket (`decision-framework-results`), and add the two handlers to `frontend-worker.js`.

### 7. Embed the scoring function in another tool

`score()` is a pure function with no side effects:

```ts
import { questions, score } from './src/data/questions';
// answers = array of option indices (0–2) per question
const result = score([1, 0, 0, 0, 0, 0, 0]); // → { recommendation: 'standardize', scores: {...} }
```

---

## Things to be careful about

1. **Apostrophes in string literals** — option and template strings mix single and double quotes. Curly/smart quotes break TypeScript compilation. Use straight quotes only; double-quote any string that contains an apostrophe.

2. **`tokens.css` is read-only** — values come from the Keel repo. If brand colors change, re-export from Keel rather than hand-editing values.

3. **No router** — `main.tsx` renders `<Layout><Home /></Layout>` directly. The worker's SPA fallback (any 404 → `index.html`) handles direct URL access. Do not add `react-router-dom` unless there are genuinely separate routes.

4. **Workers AI requires `--remote` locally** — `npm run dev` alone will fail `/api/craft` calls with a 503. Run `npx wrangler dev --remote --port 8787` in a second terminal for local AI testing.

5. **AI is stateless** — `PrincipleCrafter` sends the full conversation history on every request. The worker never writes to storage. If the component unmounts (e.g., user hits Start over), the conversation is gone.
