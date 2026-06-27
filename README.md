# Shared Principles — Should you standardize this?

An interactive triage tool for ops leaders. You answer 7 questions about something you're considering standardizing. The app outputs one of three recommendations — **Standardize**, **Shared Principles**, or **Hybrid** — with reasoning, a plain-language explanation, and next steps.

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

All logic is client-side. No backend, no database.

---

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + TypeScript + Vite 6 |
| Styling | **Keel** `--of-*` design tokens (vendored from `github.com/czhengjuarez/Keel`) |
| Backend | Single Cloudflare Worker (`frontend-worker.js`) — static SPA serving only, no API routes |
| Storage | None (v1 is fully static) |
| Deployment | Cloudflare Workers (account: ChangyingArts) |

---

## Project structure

```
shared-principles/
├── frontend-worker.js      # Edge Worker: serves SPA, no API routes
├── src/
│   ├── data/
│   │   └── questions.ts    # All question content, weights, output text, and score()
│   ├── components/
│   │   ├── Layout.tsx           # App shell + theme toggle
│   │   ├── QuestionScreen.tsx   # Single question + 3 radio options + nav
│   │   └── ResultScreen.tsx     # Recommendation + why + expandable sections
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
npm run dev          # Vite dev server on :5173

npm run build        # tsc -b && vite build
npm run deploy       # build + wrangler deploy
```

---

## Content

Everything lives in [`src/data/questions.ts`](src/data/questions.ts) — questions, option weights, lean labels, and the full output text for each recommendation (why, what this means, next steps). Edit there to change the logic or content; redeploy.

---

## Design system

Built on **Keel** (`github.com/czhengjuarez/Keel`) — the same `--of-*` token system used across Coscient projects. Tokens cover color (magenta brand + gray ramp + semantic surfaces), type (Space Grotesk display, Inter body), spacing, radius, shadow, and motion.

`tokens.css` and `keel.css` are vendored copies. When Keel is published as a shared package, the import becomes a one-liner swap — both files are marked with a comment indicating the future replacement.

Light/dark is driven by `color-scheme` + `light-dark()` CSS. The toggle writes `data-theme` to `<html>` and persists to `localStorage`.
