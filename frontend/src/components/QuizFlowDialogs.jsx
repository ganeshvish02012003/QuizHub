import {
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  LoaderCircle,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function QuizModeDialog({ quiz, onClose, onStart }) {
  if (!quiz) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="mode-title"
        className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
              Choose your mode
            </p>
            <h2 id="mode-title" className="mt-2 text-2xl font-extrabold">
              {quiz.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close mode selection"
          >
            <X />
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => onStart(quiz, "practice")}
            className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-left transition hover:border-violet-400 hover:shadow-md"
          >
            <BookOpen className="text-violet-600" size={24} />
            <span className="mt-3 block font-bold">Practice mode</span>
            <span className="mt-1 block text-sm leading-5 text-slate-600">
              See whether your answer is right and read the explanation immediately.
            </span>
          </button>
          <button
            onClick={() => onStart(quiz, "test")}
            className="rounded-2xl border border-slate-200 p-5 text-left transition hover:border-violet-300 hover:shadow-md"
          >
            <Clock3 className="text-slate-700" size={24} />
            <span className="mt-3 block font-bold">Test mode</span>
            <span className="mt-1 block text-sm leading-5 text-slate-600">
              Finish the quiz first; see your score and explanations at the end.
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}

export function QuizRunnerDialog({
  activeRun,
  currentQuestion,
  currentFeedback,
  remainingSeconds,
  submittingAttempt,
  attemptError,
  practiceCheckError,
  onChooseAnswer,
  onClose,
  onNavigate,
  onSubmit,
}) {
  if (!activeRun || !currentQuestion) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-violet-600">
              {activeRun.quiz.subject} · Question{" "}
              {activeRun.currentIndex + 1} of {activeRun.quiz.questions.length}
            </p>
            <h2 id="quiz-title" className="mt-2 text-2xl font-extrabold">
              {activeRun.quiz.title}
            </h2>
            <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {activeRun.mode === "practice" ? "Practice mode" : "Test mode"}
            </span>
          </div>
          <div
            className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 font-bold tabular-nums ${
              remainingSeconds <= 30
                ? "bg-rose-100 text-rose-700"
                : "bg-violet-50 text-violet-700"
            }`}
            aria-live="polite"
            aria-label={`${formatTime(remainingSeconds)} remaining`}
          >
            <Clock3 size={18} />
            {formatTime(remainingSeconds)}
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-violet-600 transition-all"
            style={{
              width: `${((activeRun.currentIndex + 1) / activeRun.quiz.questions.length) * 100}%`,
            }}
          />
        </div>

        <h3 className="mt-8 text-xl font-bold leading-8">
          {currentQuestion.text}
        </h3>
        <div className="mt-5 space-y-3">
          {currentQuestion.options.map((option, index) => {
            const selected = activeRun.answers[activeRun.currentIndex] === index;
            const isCorrectOption = currentFeedback?.correctIndex === index;
            const isWrongSelection =
              currentFeedback && selected && !currentFeedback.isCorrect;

            return (
              <button
                key={`${index}-${option}`}
                onClick={() => onChooseAnswer(index)}
                disabled={
                  submittingAttempt ||
                  activeRun.checkingAnswer ||
                  Boolean(currentFeedback)
                }
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                  isCorrectOption
                    ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                    : isWrongSelection
                      ? "border-rose-400 bg-rose-50 text-rose-900"
                      : selected
                        ? "border-violet-500 bg-violet-50 text-violet-900"
                        : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                    isCorrectOption
                      ? "bg-emerald-600 text-white"
                      : isWrongSelection
                        ? "bg-rose-500 text-white"
                        : selected
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="font-medium">{option}</span>
                {isCorrectOption && <CircleCheck className="ml-auto" size={19} />}
                {isWrongSelection && <CircleX className="ml-auto" size={19} />}
                {selected && !currentFeedback && (
                  <Check className="ml-auto" size={18} />
                )}
              </button>
            );
          })}
        </div>

        {activeRun.checkingAnswer && (
          <p
            className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500"
            aria-live="polite"
          >
            <LoaderCircle className="animate-spin" size={17} />
            Checking your answer...
          </p>
        )}
        {practiceCheckError && (
          <p role="alert" className="mt-4 text-sm font-medium text-rose-700">
            {practiceCheckError} Choose an option again to retry.
          </p>
        )}
        {currentFeedback && (
          <div
            role="status"
            className={`mt-4 rounded-xl border p-4 ${
              currentFeedback.isCorrect
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-rose-200 bg-rose-50 text-rose-900"
            }`}
          >
            <p className="font-bold">
              {currentFeedback.isCorrect
                ? "Correct!"
                : `Not quite. Correct answer: ${currentFeedback.correctAnswer}`}
            </p>
            {currentFeedback.explanation && (
              <p className="mt-2 text-sm leading-6">
                <span className="font-semibold">Explanation:</span>{" "}
                {currentFeedback.explanation}
              </p>
            )}
          </div>
        )}

        {attemptError && (
          <div
            role="alert"
            className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-rose-700"
          >
            <span>{attemptError}</span>
            <button
              onClick={onSubmit}
              className="rounded-lg border border-rose-200 px-3 py-2 hover:bg-rose-50"
            >
              Retry submission
            </button>
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-3 font-semibold text-slate-600 hover:bg-slate-100"
          >
            Exit quiz
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate(activeRun.currentIndex - 1)}
              disabled={activeRun.currentIndex === 0 || submittingAttempt}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={18} /> Back
            </button>
            {activeRun.currentIndex < activeRun.quiz.questions.length - 1 ? (
              <button
                onClick={() => onNavigate(activeRun.currentIndex + 1)}
                disabled={submittingAttempt}
                className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={submittingAttempt}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {submittingAttempt && (
                  <LoaderCircle className="animate-spin" size={18} />
                )}
                Submit quiz
              </button>
            )}
          </div>
        </div>
        {remainingSeconds === 0 && (
          <p className="mt-3 text-right text-sm text-slate-500">
            Time is up. Your answers are being submitted.
          </p>
        )}
      </section>
    </div>
  );
}

export function QuizResultDialog({ result, onExplore, onPlayAgain }) {
  if (!result) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="result-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Trophy size={32} />
          </span>
          <h2 id="result-title" className="mt-4 text-3xl font-extrabold">
            Quiz complete!
          </h2>
          <p className="mt-2 text-slate-500">{result.quiz.title}</p>
          <p className="mt-4 text-5xl font-extrabold text-violet-600">
            {result.percentage}%
          </p>
          <p className="mt-2 font-semibold text-slate-700">
            {result.score} out of {result.total} correct
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-bold">Answer review</h3>
          {result.results.map((question, index) => {
            const correct = question.selectedIndex === question.correctIndex;

            return (
              <article
                key={`${index}-${question.text}`}
                className="rounded-2xl border border-slate-200 p-4"
              >
                <div className="flex items-start gap-3">
                  {correct ? (
                    <CircleCheck className="mt-0.5 shrink-0 text-emerald-600" />
                  ) : (
                    <CircleX className="mt-0.5 shrink-0 text-rose-600" />
                  )}
                  <div>
                    <p className="font-semibold">
                      {index + 1}. {question.text}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      Your answer:{" "}
                      {question.selectedIndex < 0
                        ? "Not answered"
                        : question.options[question.selectedIndex]}
                    </p>
                    {!correct && (
                      <p className="mt-1 text-sm font-medium text-emerald-700">
                        Correct answer: {question.options[question.correctIndex]}
                      </p>
                    )}
                    {question.explanation && (
                      <p className="mt-3 rounded-xl bg-violet-50 px-3 py-2.5 text-sm leading-6 text-violet-900">
                        <span className="font-bold">Explanation:</span>{" "}
                        {question.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <button
            onClick={onExplore}
            className="rounded-xl border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-50"
          >
            Explore quizzes
          </button>
          <button
            onClick={onPlayAgain}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
          >
            <RotateCcw size={17} /> Play again
          </button>
        </div>
      </section>
    </div>
  );
}
