import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import QuestionScreen from '../components/QuestionScreen';
import ResultScreen from '../components/ResultScreen';
import { questions, score } from '../data/questions';

// step: -1 = intro, 0..6 = questions, questions.length = result
type Step = number;

export default function Home() {
  const [step, setStep] = useState<Step>(-1);
  const [subject, setSubject] = useState('');
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => Array(questions.length).fill(null),
  );

  const startIntro = () => {
    setSubject('');
    setAnswers(Array(questions.length).fill(null));
    setStep(-1);
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(0);
  };

  const selectOption = (optionIndex: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[step] = optionIndex;
      return next;
    });
  };

  const goNext = () => {
    if (answers[step] == null) return;
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setStep((s) => (s <= 0 ? -1 : s - 1));
  };

  // ── Intro ──
  if (step === -1) {
    return (
      <section className="intro">
        <span className="intro__eyebrow">Shared Principles</span>
        <h1 className="intro__title">Should you standardize this?</h1>
        <p className="intro__subhead">Answer 7 questions. Get a recommendation.</p>

        <form className="intro__form" onSubmit={handleStart}>
          <div className="of-field">
            <label className="of-label" htmlFor="subject">
              What are you evaluating?
            </label>
            <input
              id="subject"
              className="of-input"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. our MR review process, AI tool adoption policy"
              autoComplete="off"
            />
          </div>
          <div>
            <button type="submit" className="of-btn of-btn--primary of-btn--lg">
              Start
              <ArrowRight size={20} strokeWidth={1.75} />
            </button>
          </div>
        </form>
      </section>
    );
  }

  // ── Result ──
  if (step >= questions.length) {
    const result = score(answers);
    return <ResultScreen result={result} subject={subject} onRestart={startIntro} />;
  }

  // ── Question ──
  return (
    <QuestionScreen
      question={questions[step]}
      index={step}
      total={questions.length}
      subject={subject}
      selected={answers[step]}
      onSelect={selectOption}
      onBack={goBack}
      onNext={goNext}
    />
  );
}
