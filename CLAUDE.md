# CLAUDE.md — Shared Principles

Agent context for Claude Code and deployed agents working on this project.

## What this is

Shared Principles is a 7-question triage tool that outputs a recommendation — **Standardize**, **Shared Principles**, or **Hybrid** — with reasoning and next steps. An ops leader enters what they're evaluating, answers 7 questions, and gets a clear recommendation. All logic is client-side.

Live: https://decision-framework.coscient.workers.dev
Owner: czhengjuarez / changying@coscient.com

---

## Stack

- **Runtime:** Cloudflare Workers (static SPA serving only — no API routes in v1)
- **Frontend:** React 18 + TypeScript + Vite 6
- **Design system:** Keel `--of-*` tokens (vendored from `github.com/czhengjuarez/Keel`)
- **Storage:** None — fully client-side, no database, no R2

## Key commands

```bash
npm run dev          # Vite on :5173
npm run build        # tsc -b && vite build → ./dist
npm run deploy       # build + wrangler deploy
```

---

## File map

| File | Purpose |
|---|---|
| `src/data/questions.ts` | **Single source of truth.** All 7 questions, option weights, lean labels, output content (why / meaning / next steps), and the `score()` function. |
| `src/pages/Home.tsx` | State machine: step `-1` = intro, `0–6` = questions, `7` = result. No router. |
| `src/components/QuestionScreen.tsx` | Renders one question with 3 radio options and Back/Next nav. |
| `src/components/ResultScreen.tsx` | Renders recommendation hero (`.of-card--brand-elevated`), score badges, and two expandable disclosures. |
| `src/components/Layout.tsx` | App shell + theme toggle. Sets `data-theme` + `colorScheme` on `<html>`, persists to `localStorage`. |
| `frontend-worker.js` | Cloudflare Worker: `getAssetFromKV` for SPA static assets, 404 → `index.html` fallback. No `/api` routes. |
| `src/styles/tokens.css` | Keel `--of-*` design tokens (vendored). Do not edit values. |
| `src/styles/keel.css` | Keel class helpers (vendored: `.of-btn`, `.of-card`, `.of-badge`, `.of-input`, etc.). |
| `src/styles/global.css` | App-level styles built on tokens. All color/space/radius via `--of-*` vars. |
| `wrangler.toml` | Worker config. Account: ChangyingArts (`d6ff2f09…`). Worker name: `decision-framework`. |

---

## Data model

```ts
type Lean = 'standardize' | 'principles' | 'hybrid';

interface Option  { text: string; lean: Lean; weight: number; }
interface Question { id: string; question: string; options: Option[]; }
interface Outcome  { label: string; why: string; meaning: string; steps: string[]; }

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

### 3. Adjust scoring thresholds

The tiebreaker logic is in the `score()` function in `src/data/questions.ts`. The threshold `≤ 1` for both guards is intentionally conservative — adjust and re-validate against the test scenarios before shipping.

### 4. Add a share/permalink feature (v2)

The planned v2 feature stores a scored result as a JSON object in R2, keyed by a short random id. The worker would gain two routes:
- `POST /r` — save result JSON, return `{ id }`
- `GET /r/:id` — retrieve result JSON

The SPA reads `?r=<id>` on load and skips to the result screen. No database required — R2 object store only. Add `[[r2_buckets]]` binding to `wrangler.toml`, create the bucket (`decision-framework-results`), and add the two handlers to `frontend-worker.js`.

### 5. Embed in another tool

The scoring function is a pure function with no side effects. An agent can import it directly:

```ts
import { questions, score } from './src/data/questions';
// answers = array of option indices (0–2) per question
const result = score([1, 0, 0, 0, 0, 0, 0]); // → { recommendation: 'standardize', scores: {...} }
```

---

## Things to be careful about

1. **Apostrophes in question text** — option strings use single and double quotes. Use the existing quoting style; TypeScript will fail to compile with mismatched quotes.

2. **`tokens.css` is read-only** — values come from the Keel repo. If brand colors change, re-export from Keel rather than hand-editing values.

3. **No router** — `main.tsx` renders `<Layout><Home /></Layout>` directly. The worker's SPA fallback (any 404 → `index.html`) handles direct URL access. Do not add `react-router-dom` unless there are genuinely separate routes.

4. **No API routes** — `frontend-worker.js` only serves static assets. Do not add `/api` handlers in v1. Any stateful feature (share links, analytics) belongs in a v2 pass with explicit R2 or D1 planning.

5. **`wrangler.toml` has no bindings in v1** — `[site]` only. Adding any binding (R2, AI, KV) requires a matching `env.*` type declaration if using TypeScript in the worker.
