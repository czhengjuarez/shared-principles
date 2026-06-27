// ===========================================================
// shared-principles — all question + output content + scoring.
// Fully typed. This is the single source of truth for the app's
// decision logic; the UI renders straight from here.
// ===========================================================

export type Lean = 'standardize' | 'principles' | 'hybrid';

export interface Option {
  text: string;
  lean: Lean;
  weight: number;
}

export interface Question {
  id: string;
  question: string;
  options: Option[];
}

export const questions: Question[] = [
  {
    id: 'q1',
    question: 'Does this directly affect customers or what they experience?',
    options: [
      { text: 'Yes — customers notice or interact with it', lean: 'standardize', weight: 2 },
      { text: "No — it's internal only", lean: 'principles', weight: 2 },
      { text: 'Indirectly — internal with external ripple effects', lean: 'hybrid', weight: 1 },
    ],
  },
  {
    id: 'q2',
    question: 'Does this touch security, compliance, or legal requirements?',
    options: [
      { text: "Yes — there's a hard compliance or legal constraint", lean: 'standardize', weight: 3 },
      { text: 'No — not a compliance issue', lean: 'principles', weight: 2 },
      { text: 'Some edge cases, but not core', lean: 'hybrid', weight: 1 },
    ],
  },
  {
    id: 'q3',
    question: 'How is adoption currently happening across your org?',
    options: [
      { text: 'Everyone needs it at the same time', lean: 'standardize', weight: 2 },
      { text: 'Different teams have different timelines and readiness', lean: 'principles', weight: 2 },
      { text: 'Some teams urgently need it, others can wait', lean: 'hybrid', weight: 1 },
    ],
  },
  {
    id: 'q4',
    question: 'Do different teams face meaningfully different constraints?',
    options: [
      { text: 'No — the problem and context are basically the same everywhere', lean: 'standardize', weight: 2 },
      { text: 'Yes — significant differences in team structure, tools, or environment', lean: 'principles', weight: 2 },
      { text: "Yes, but there's a shared core underneath the differences", lean: 'hybrid', weight: 2 },
    ],
  },
  {
    id: 'q5',
    question: 'Is this part of the foundational system, or something built on top of it?',
    options: [
      {
        text: "It's foundational — the system layer everything else runs on (like a code review standard or security protocol)",
        lean: 'standardize',
        weight: 2,
      },
      {
        text: "It's built on top — a practice, skill, or workflow that teams adapt to their context",
        lean: 'principles',
        weight: 2,
      },
      { text: "Both — there's a foundational layer with variable execution above it", lean: 'hybrid', weight: 2 },
    ],
  },
  {
    id: 'q6',
    question: 'How quickly is this domain or technology changing?',
    options: [
      { text: 'Stable — unlikely to change significantly', lean: 'standardize', weight: 1 },
      { text: 'Rapidly changing — AI tools, new frameworks, evolving practices', lean: 'principles', weight: 2 },
      { text: 'Changing, but the underlying principles are stable', lean: 'hybrid', weight: 2 },
    ],
  },
  {
    id: 'q7',
    question: 'Are there already examples of this working well in different ways across teams?',
    options: [
      { text: 'No — one clear best way', lean: 'standardize', weight: 1 },
      { text: 'Yes — multiple good implementations, different approaches', lean: 'principles', weight: 2 },
      { text: 'Yes — different implementations, same underlying problem', lean: 'hybrid', weight: 2 },
    ],
  },
];

// ── Output content per recommendation ─────────────────────

export interface Outcome {
  label: string; // headline shown large on the result screen
  why: string; // one-line "why" framing
  meaning: string; // "What this means" — 3–4 sentences
  steps: string[]; // "Next steps" — 4–5 action items
}

export const outcomes: Record<Lean, Outcome> = {
  standardize: {
    label: 'Standardize',
    why: 'Your answers signal a consistent constraint — customer impact, compliance, or a foundational system layer — where variation creates risk, not flexibility.',
    meaning:
      'This is the kind of thing that should look the same everywhere. The cost of teams doing it differently is higher than the cost of asking them to follow one defined process. When the constraint is real — customers feel it, compliance requires it, or the whole system depends on it — variation is a liability, not local autonomy. Write the standard and hold teams to it.',
    steps: [
      'Write a standard, not a principle. Define the exact process.',
      'Document it clearly — one source of truth.',
      'Create onboarding so new teams ramp without guessing.',
      "Define what's allowed to vary within the standard.",
      'Measure compliance, not just awareness.',
    ],
  },
  principles: {
    label: 'Shared Principles',
    why: 'Your answers signal uneven adoption, different team constraints, or a fast-changing domain — where forcing one process creates friction instead of consistency.',
    meaning:
      "This is the kind of thing where one mandated process would fight reality. Teams face different constraints, move at different speeds, or the ground is shifting too fast to lock in a method. What you want is alignment on what must be true — not uniformity in how it's done. State the principle, let teams own the implementation, and spread good approaches by connection rather than mandate.",
    steps: [
      'Write the principle, not the process. One sentence: what must be true, not how to do it.',
      'Document implementations across teams — not as the standard, but as examples.',
      'Use pairing: connect teams solving the same problem differently so the principle spreads without mandating the method.',
      'Track outcomes, not conformity.',
      'Review quarterly — principles can become standards when adoption stabilizes.',
    ],
  },
  hybrid: {
    label: 'Hybrid',
    why: 'Your answers show a shared foundational layer that needs to be standardized, with execution above it that needs to stay local. Standardize the constraint. Let teams own the implementation.',
    meaning:
      "This has two layers and they need different treatment. Underneath there's a foundation that must be true everywhere — standardize that. On top of it sits execution that varies legitimately by team — let that stay local. The hard part is naming the boundary precisely: be explicit about what is the standard and what is the principle, because the line will move as adoption matures.",
    steps: [
      'Name the boundary: what is the standard, what is the principle. Be explicit.',
      'Standardize the foundational layer — the thing that must be true everywhere.',
      'Write the principle for everything built on top of that layer.',
      'Create a pairing program: teams that implement it well become the resource for teams building their own version.',
      'Review the boundary quarterly — the line between standard and principle shifts as adoption matures.',
    ],
  },
};

// ── Scoring ───────────────────────────────────────────────
// answers[i] is the chosen option index (0–2) for questions[i],
// or null if unanswered.

export interface ScoreResult {
  recommendation: Lean;
  scores: Record<Lean, number>;
}

export function score(answers: (number | null)[]): ScoreResult {
  const scores: Record<Lean, number> = { standardize: 0, principles: 0, hybrid: 0 };

  questions.forEach((q, i) => {
    const choice = answers[i];
    if (choice == null) return;
    const opt = q.options[choice];
    if (!opt) return;
    scores[opt.lean] += opt.weight;
  });

  const { standardize, principles, hybrid } = scores;
  const max = Math.max(standardize, principles, hybrid);
  const min = Math.min(standardize, principles, hybrid);

  let recommendation: Lean;

  if (max - min <= 1) {
    // All three are close → the signal is genuinely mixed.
    recommendation = 'hybrid';
  } else if (Math.abs(standardize - principles) <= 1) {
    // The two poles are tied/near-tied → split the difference.
    recommendation = 'hybrid';
  } else if (standardize === max) {
    recommendation = 'standardize';
  } else if (principles === max) {
    recommendation = 'principles';
  } else {
    recommendation = 'hybrid';
  }

  return { recommendation, scores };
}

// Short label used for the subtle per-option lean tag.
export const leanLabel: Record<Lean, string> = {
  standardize: 'Standardize',
  principles: 'Principles',
  hybrid: 'Hybrid',
};
