import { ArrowLeft, ArrowRight } from 'lucide-react';
import { leanLabel, type Question } from '../data/questions';

const leanBadgeClass: Record<string, string> = {
  standardize: 'of-badge of-badge--blue',
  principles: 'of-badge of-badge--green',
  hybrid: 'of-badge of-badge--purple',
};

interface Props {
  question: Question;
  index: number; // 0-based
  total: number;
  subject: string;
  selected: number | null;
  onSelect: (optionIndex: number) => void;
  onBack: () => void;
  onNext: () => void;
}

export default function QuestionScreen({
  question,
  index,
  total,
  subject,
  selected,
  onSelect,
  onBack,
  onNext,
}: Props) {
  const isLast = index === total - 1;

  return (
    <section aria-labelledby="question-title">
      <p className="progress">
        Question {index + 1} of {total}
        {subject && (
          <>
            {' · '}
            <span className="progress__subject">{subject}</span>
          </>
        )}
      </p>

      <h2 id="question-title" className="question__title">
        {question.question}
      </h2>

      <div className="options" role="radiogroup" aria-label={question.question}>
        {question.options.map((opt, i) => {
          const isSelected = selected === i;
          return (
            <label key={i} className={`option${isSelected ? ' option--selected' : ''}`}>
              <input
                type="radio"
                className="option__radio"
                name={question.id}
                checked={isSelected}
                onChange={() => onSelect(i)}
              />
              <span className="option__body">
                <span className="option__text">{opt.text}</span>
                <span className={`option__lean ${leanBadgeClass[opt.lean]}`}>
                  → {leanLabel[opt.lean]}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="nav-row">
        <button type="button" className="of-btn of-btn--secondary of-btn--md" onClick={onBack}>
          <ArrowLeft size={20} strokeWidth={1.75} />
          Back
        </button>
        <span className="nav-row__spacer" />
        <button
          type="button"
          className="of-btn of-btn--primary of-btn--md"
          onClick={onNext}
          disabled={selected == null}
          aria-disabled={selected == null}
        >
          {isLast ? 'See result' : 'Next'}
          <ArrowRight size={20} strokeWidth={1.75} />
        </button>
      </div>
    </section>
  );
}
