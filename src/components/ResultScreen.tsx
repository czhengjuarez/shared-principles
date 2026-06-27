import { useState } from 'react';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { leanLabel, outcomes, type Lean, type ScoreResult } from '../data/questions';

interface Props {
  result: ScoreResult;
  subject: string;
  onRestart: () => void;
}

function Disclosure({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="disclosure">
      <button
        type="button"
        className="disclosure__summary"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        {title}
        <ChevronDown
          size={20}
          strokeWidth={1.75}
          className={`disclosure__icon${open ? ' disclosure__icon--open' : ''}`}
        />
      </button>
      {open && <div className="disclosure__body">{children}</div>}
    </div>
  );
}

const scoreBadgeClass: Record<Lean, string> = {
  standardize: 'of-badge of-badge--blue',
  principles: 'of-badge of-badge--green',
  hybrid: 'of-badge of-badge--purple',
};

export default function ResultScreen({ result, subject, onRestart }: Props) {
  const outcome = outcomes[result.recommendation];

  return (
    <section aria-labelledby="result-title">
      <div className="of-card of-card--brand-elevated result__hero">
        <span className="of-card__kicker">Recommendation</span>
        <h1 id="result-title" className="result__recommendation">
          {outcome.label}
        </h1>
        {subject && <p className="result__subject">for {subject}</p>}
        <div className="of-card__rule" />
        <p className="result__why">{outcome.why}</p>
      </div>

      <div className="result__scores" aria-label="Weighted scores">
        {(Object.keys(result.scores) as Lean[]).map((lean) => (
          <span key={lean} className={scoreBadgeClass[lean]}>
            {leanLabel[lean]} {result.scores[lean]}
          </span>
        ))}
      </div>

      <Disclosure title="What this means" defaultOpen>
        <p>{outcome.meaning}</p>
      </Disclosure>

      <Disclosure title="Next steps">
        <ol>
          {outcome.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </Disclosure>

      <div className="result__actions">
        <button type="button" className="of-btn of-btn--secondary of-btn--lg" onClick={onRestart}>
          <RotateCcw size={20} strokeWidth={1.75} />
          Start over
        </button>
      </div>
    </section>
  );
}
