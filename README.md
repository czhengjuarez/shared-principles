# Shared Principles — Should you standardize this?

An interactive triage tool for ops leaders. You answer 7 questions about something you're considering standardizing. The app outputs one of three recommendations — **Standardize**, **Shared Principles**, or **Hybrid** — with reasoning, a plain-language explanation, and next steps.

When the recommendation is **Shared Principles**, the app also surfaces a principle documentation template and an AI crafter to help you write the principle.

**Live:** https://decision-framework.coscient.workers.dev

---

## The problem it solves

When an ops leader wants to standardize something across teams, the instinct to mandate a process is often premature — and the instinct to leave it fully decentralized is often too loose. This tool helps you figure out which of three responses fits:

| Recommendation | When it applies |
|---|---|
| **Standardize** | Customer impact, compliance requirement, or foundational system layer where variation creates real risk |
| **Shared Principles** | Uneven adoption, meaningfully different team constraints, or a fast-changing domain where one process creates friction |
| **Hybrid** | A foundational layer that needs standardization, with execution above it that should stay local |

---

## How it works

7 questions, each with 3 weighted options. Each option carries a lean (Standardize / Principles / Hybrid) and a weight. After all 7 answers, the scoring tallies weighted votes per category. The winner is the recommendation, with a tiebreaker rule: if Standardize and Principles are within 1 point of each other, the tool outputs Hybrid.

The questions cover:
1. Customer impact
2. Security, compliance, or legal requirements
3. Adoption timing across the org
4. Variation in team constraints
5. Foundational layer vs. built-on-top practice
6. Pace of change in the domain
7. Whether multiple good implementations already exist

---

## Shared Principles result — extra features

When the recommendation is Shared Principles, two additional sections appear below Next Steps:

**Principle documentation template** — a structured card showing the six-section anatomy of a well-written principle: the statement, why it matters, examples of good implementation, what would violate it, how to measure it, and when to review it. The user's subject is injected at the top. A Copy button exports the template as plain text for pasting into Notion or a doc.

**Craft with AI** — a chat interface backed by Cloudflare Workers AI. The AI receives the user's subject and all 7 question-and-answer pairs as grounding context. It guides the user through the template using the Socratic method: asking one specific question at a time, pushing back if a draft statement describes a process instead of a truth, and never writing the principle for them. Three starter prompts remove the blank-page problem.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6 |
| Styling | **Keel** `--of-*` design tokens (vendored from `github.com/czhengjuarez/Keel`) |
| Worker | Single Cloudflare Worker (`frontend-worker.js`) — static SPA serving + `POST /api/craft` |
| AI | Cloudflare Workers AI — `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| Storage | None — no database, no R2 |
| Deployment | Cloudflare Workers (account: ChangyingArts) |

---

## Project structure

```
shared-principles/
├── frontend-worker.js      # Edge Worker: SPA serving + POST /api/craft (AI)
├── src/
│   ├── data/
│   │   └── questions.ts    # Questions, weights, output text, score(), AnswerContext
│   ├── components/
│   │   ├── Layout.tsx             # App shell + theme toggle
│   │   ├── QuestionScreen.tsx     # Single question + 3 radio options + nav
│   │   ├── ResultScreen.tsx       # Recommendation + expandable sections + principle tools
│   │   ├── PrincipleTemplate.tsx  # Pre-filled template card + copy button
│   │   └── PrincipleCrafter.tsx   # AI chat grounded in user's context
│   ├── pages/
│   │   └── Home.tsx        # State machine: intro → questions → result
│   └── styles/
│       ├── tokens.css      # Keel --of-* tokens (vendored)
│       ├── keel.css        # Keel class helpers (vendored)
│       └── global.css      # App styles built on tokens
├── public/
│   └── favicon.svg
└── wrangler.toml
```

---

## Develop and deploy

```bash
npm install
npm run dev          # Vite dev server on :5173 (proxies /api → :8787)

# To test the AI crafter locally, run the Worker in a second terminal:
npx wrangler dev --remote --port 8787

npm run build        # tsc -b && vite build
npm run deploy       # build + wrangler deploy
```

---

## Content

All question content, weights, output text, and scoring logic live in [`src/data/questions.ts`](src/data/questions.ts). Edit there to change questions, recommendation text, or scoring thresholds; redeploy.

---

## Design system

Built on **Keel** (`github.com/czhengjuarez/Keel`) — the same `--of-*` token system used across Coscient projects. Tokens cover color (magenta brand + gray ramp + semantic surfaces), type (Space Grotesk display, Inter body), spacing, radius, shadow, and motion.

`tokens.css` and `keel.css` are vendored copies. When Keel is published as a shared package, the import becomes a one-liner swap — both files are marked with a comment indicating the future replacement.

Light/dark is driven by `color-scheme` + `light-dark()` CSS. The toggle writes `data-theme` to `<html>` and persists to `localStorage`.
