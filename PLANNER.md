# shared-principles — Build Planner

> Decision-framework triage app. An ops leader answers 7 questions → gets a
> recommendation (**Standardize**, **Shared Principles**, or **Hybrid**) with
> reasoning and next steps. All logic is client-side. No database.

---

## 1. Goal & Scope

| | |
|---|---|
| **Product** | Interactive 7-question triage that outputs a recommendation + reasoning + next steps |
| **v1 scope** | Fully client-side SPA. No API routes, no database. |
| **Storage** | None required for v1. R2 is *optional* for later (see §9 Future). |
| **Reference repo** | `github.com/czhengjuarez/design101` — mirror layout, worker pattern, styling, deploy exactly |
| **Design system** | Keel (`github.com/czhengjuarez/Keel`) `--of-*` tokens. **No Tailwind.** |

---

## 2. Stack

- React 18 + TypeScript + Vite 6
- Keel design system — `import '@ops-forward/keel/styles.css'`, use class helpers + token vars
- Lucide icons — stroke-width `1.75`, size `20px`
- Cloudflare Worker (edge) serves the SPA — no API routes in v1
- Deploy: `tsc -b && vite build && wrangler deploy`

### Brand / Theming
- Gradient: `linear-gradient(180deg, #FB41AA 0%, #8F1F57 100%)`
- Type: **Space Grotesk** (display/headings), **Inter** (body), **JetBrains Mono** (code)
- Light/dark via `color-scheme` + `light-dark()` CSS — **no JS class toggling**
- Theme toggle writes `data-theme` to `<html>`, persists to `localStorage`
- `src/styles/tokens.css` — copy from design101 as starting point

---

## 3. Project Structure (mirror design101)

```
shared-principles/
├── frontend-worker.js       # Edge Worker: serves SPA (no API routes for v1)
├── src/
│   ├── data/
│   │   └── questions.ts     # All question + output content, fully typed
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── QuestionScreen.tsx
│   │   └── ResultScreen.tsx
│   ├── pages/
│   │   └── Home.tsx
│   └── styles/
│       ├── tokens.css       # Keel --of-* tokens
│       └── global.css
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── wrangler.toml
```

---

## 4. App Flow

| Screen | Content |
|--------|---------|
| **1 — Intro** | H: "Should you standardize this?" · Sub: "Answer 7 questions. Get a recommendation." · Text input: "What are you evaluating?" · CTA: "Start" |
| **2–8 — Questions** | "Question N of 7" · question + 3 radio options · each option shows a subtle lean label (→ Standardize / → Principles / → Hybrid) · Back / Next |
| **9 — Results** | Large recommendation · one-line "why" tied to answers · expandable "What this means" (3–4 sentences) · expandable "Next steps" (4–5 items) · "Start over" |

State is held in `Home.tsx` (or a small reducer): `subject`, `answers[]`, `step`.

---

## 5. Data Model (`src/data/questions.ts`)

```ts
type Lean = "standardize" | "principles" | "hybrid";

interface Option { text: string; lean: Lean; weight: number; }
interface Question { id: string; question: string; options: Option[]; }
```

7 questions, each with 3 weighted options. Weights per the briefing:

- **q1** Customer impact — yes→standardize(2), no→principles(2), indirect→hybrid(1)
- **q2** Security/compliance/legal — yes→standardize(3), no→principles(2), edge→hybrid(1)
- **q3** Adoption timing — same-time→standardize(2), varied→principles(2), mixed→hybrid(1)
- **q4** Team constraints — same→standardize(2), differ→principles(2), shared-core→hybrid(2)
- **q5** Foundational vs built-on-top — foundational→standardize(2), on-top→principles(2), both→hybrid(2)
- **q6** Pace of change — stable→standardize(1), rapid→principles(2), stable-principles→hybrid(2)
- **q7** Existing varied success — one-way→standardize(1), multiple→principles(2), same-problem→hybrid(2)

Output content (Why + Next steps) for each of the 3 recommendations also lives here, typed.

---

## 6. Scoring Logic

```
1. Tally weighted votes per category across all 7 answers.
2. Winner = category with highest total weight.
3. If |standardize − principles| <= 1  → recommend HYBRID.
4. If all three are close            → recommend HYBRID.
```

Keep this in a small pure function (e.g. `src/data/score.ts` or inline in
ResultScreen) so it's unit-testable against the scenarios in §7.

---

## 7. Test Scenarios (validate BEFORE shipping)

| Scenario | Answers | Expected |
|----------|---------|----------|
| Production code review process | customer:no, compliance:yes, adoption:uniform, constraints:same, foundational:yes | **STANDARDIZE** |
| AI tool adoption across design teams | customer:no, compliance:no, adoption:uneven, constraints:differ, on-top:yes, rapid:yes | **SHARED PRINCIPLES** |
| Pull request workflow | customer:no, compliance:edge, adoption:mixed, constraints:shared-core, both | **HYBRID** |

---

## 8. Build Order (checklist)

- [ ] **Scaffold** — copy design101 layout: `package.json`, `tsconfig.json`, `vite.config.ts`, `wrangler.toml`, `index.html`, `frontend-worker.js`
- [ ] **Tokens & styles** — `src/styles/tokens.css` (from design101), `global.css`, Keel import, fonts, theme toggle (`data-theme` + localStorage)
- [ ] **Data** — `src/data/questions.ts` (questions + weights + output content), scoring function
- [ ] **Components** — `Layout.tsx`, `QuestionScreen.tsx`, `ResultScreen.tsx`
- [ ] **Page** — `pages/Home.tsx` wiring intro → questions → results state machine
- [ ] **Validate** — run the 3 test scenarios, confirm correct output
- [ ] **Build** — `tsc -b && vite build` clean
- [ ] **Deploy** — `wrangler deploy` to ChangyingArts / worker `decision-framework`

---

## 9. Deployment

- Cloudflare account: **ChangyingArts**
- Worker name: **decision-framework**
- Live URL: **https://decision-framework.coscient.workers.dev**
- Command: `tsc -b && vite build && wrangler deploy`

---

## 10. Design Constraints

- Clean, minimal, single-column, centered
- All color/type/spacing/radius via Keel `--of-*` tokens — **no hardcoded values**
- Progress = "Question N of 7" text, **not** a bar
- No animations in v1 — keep it fast

---

## 11. Future (out of v1 scope)

- **R2 (optional):** persist/share results via a short link (save scored result as
  JSON object keyed by a generated id; worker adds `GET /r/:id` + `POST /r`). Still
  **no database** — R2 object store only. Not needed for v1.
- Analytics on recommendation distribution.
- Editable/weighted question set.

---

## 12. Reference Findings (from local clones — RESOLVED)

Both repos are cloned locally and inspected:
- **design101:** `/Users/z/Repo/design101`
- **Keel:** `/Users/z/Repo/Keel/packages/keel` (package `@ops-forward/keel@0.1.0`, **not on npm**)

### How design101 actually wires it (patterns to mirror)
- **Build/deploy** identical to briefing: `tsc -b && vite build` then `wrangler deploy`.
  Deps: `react@18.3`, `react-dom@18.3`, `@cloudflare/kv-asset-handler`. Dev deps:
  `vite@6`, `typescript@5.6`, `wrangler@4`, `@vitejs/plugin-react`, `@types/*`.
- **Worker** (`frontend-worker.js`): serves the SPA via `getAssetFromKV` with
  `[site] bucket = "./dist"`, `compatibility_flags = ["nodejs_compat"]`, and a 404→
  `index.html` SPA fallback. → **For v1 strip ALL `/api/*` handlers**; keep only the
  static-asset serving + SPA fallback. Drop the `[ai]` and `[[r2_buckets]]` bindings.
- **Tokens are vendored, not imported.** design101 copies Keel's `--of-*` tokens into
  `src/styles/tokens.css` (153 lines: palette, semantic surfaces, fg, borders,
  gradients, type scale, radius, shadows, spacing) and `@import`s Google Fonts at the
  top (Space Grotesk / Inter / JetBrains Mono). → **Copy this file verbatim.**
- **Keel class helpers** (`.of-btn`, `.of-badge`, `.of-card`, …) live in the package's
  `src/styles.css` (147 lines). The briefing wants these. → Install Keel locally via
  `"@ops-forward/keel": "file:../Keel/packages/keel"` and
  `import '@ops-forward/keel/styles.css'` in `main.tsx` (after tokens, since the
  helpers reference the `--of-*` vars). tokens.css supplies the vars; styles.css the
  classes.
- **Theme toggle** pattern (from `Layout.tsx`): `useState<Theme>` seeded from
  `localStorage('of-theme')` → falls back to `prefers-color-scheme`. `useEffect` sets
  `documentElement.style.colorScheme`, `setAttribute('data-theme', theme)`, and
  persists to `localStorage`. Reuse the inline Sun/Moon SVG toggle. → **Mirror exactly.**
- **Routing:** design101 uses `react-router-dom`. Our app is a **single-screen state
  machine** (intro → 7 questions → result), so **no router needed** — `main.tsx`
  renders `<Home />` directly, no `BrowserRouter`. (Keeps the worker's SPA fallback
  trivial.) Drop `react-router-dom` from deps.

### Deltas / decisions to apply
- **Brand gradient:** tokens.css ships `--of-gradient-brand` at `135deg`. The briefing
  wants `linear-gradient(180deg, #FB41AA 0%, #8F1F57 100%)`. → Add an app-level token
  `--of-gradient-app` with the 180deg value in `global.css`; use it for the hero/result
  accent. Don't edit the vendored token values.
- **`wrangler.toml`:** `name = "decision-framework"`, `workers_dev = true`,
  `[site] bucket = "./dist"`, `compatibility_flags = ["nodejs_compat"]`. **Confirm the
  `account_id`** for ChangyingArts (design101 uses `d6ff2f09…`; the live URL subdomain
  `*.coscient.workers.dev` suggests the same account — verify before deploy).

---

## 13. Resolved Decisions (locked)

1. **Keel = vendored for now.** Copy Keel's `styles.css` into `src/styles/keel.css`
   (alongside the vendored `tokens.css`). Do **not** depend on the sibling folder path.
   > **Future goal:** the user wants Keel to become a shared, consistently-referenced
   > dependency (npm package or similar) across all their apps. Keep the vendored copy
   > clearly marked "vendored from `@ops-forward/keel` — replace with package import
   > when published" so the swap is a one-liner later. Same applies to `tokens.css`.
   - Bonus: Keel's `styles.css` already ships `.of-card--brand-elevated` using the exact
     briefing gradient `linear-gradient(180deg, #FB41AA 0%, #8F1F57 100%)` →
     **use it for the result hero** (no custom gradient token needed).
2. **`account_id` = `d6ff2f0914adb1d9faae77870fadb7cc`** (reuse design101's / ChangyingArts).
3. **R2 out of v1.** Purely static SPA; R2 reserved for the optional share-link feature.
