import { LoaderCircle, Plus, Trash2, X } from "lucide-react";

function QuizBuilderDialog({
  open,
  editingQuizId,
  quizDraft,
  setQuizDraft,
  builderError,
  savingQuiz,
  onClose,
  onSubmit,
  onAddQuestion,
  onRemoveQuestion,
  onUpdateQuestion,
  onUpdateOption,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="builder-title"
        className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
              Quiz creator
            </p>
            <h2 id="builder-title" className="mt-2 text-2xl font-extrabold">
              {editingQuizId ? "Edit quiz" : "Build a quiz"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Add four choices to each question and select the correct one.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close quiz creator"
          >
            <X />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">
              Quiz title
              <input
                required
                maxLength={100}
                value={quizDraft.title}
                onChange={(event) =>
                  setQuizDraft((draft) => ({
                    ...draft,
                    title: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500"
                placeholder="e.g. Space and astronomy"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Subject
              <input
                required
                maxLength={60}
                value={quizDraft.subject}
                onChange={(event) =>
                  setQuizDraft((draft) => ({
                    ...draft,
                    subject: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500"
                placeholder="e.g. Science"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold sm:col-span-2">
              Description
              <textarea
                required
                maxLength={500}
                rows={2}
                value={quizDraft.description}
                onChange={(event) =>
                  setQuizDraft((draft) => ({
                    ...draft,
                    description: event.target.value,
                  }))
                }
                className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500"
                placeholder="What will learners practice?"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Time limit (minutes)
              <input
                required
                type="number"
                min="1"
                max="180"
                value={quizDraft.durationMinutes}
                onChange={(event) =>
                  setQuizDraft((draft) => ({
                    ...draft,
                    durationMinutes: Number(event.target.value),
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500"
              />
            </label>
            <label className="space-y-2 text-sm font-semibold">
              Difficulty
              <select
                value={quizDraft.level}
                onChange={(event) =>
                  setQuizDraft((draft) => ({
                    ...draft,
                    level: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal outline-none focus:border-violet-500"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>
          </div>

          <div className="space-y-5">
            {quizDraft.questions.map((question, questionIndex) => (
              <fieldset
                key={questionIndex}
                className="rounded-2xl border border-slate-200 p-4 sm:p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <legend className="font-bold">
                    Question {questionIndex + 1}
                  </legend>
                  {quizDraft.questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onRemoveQuestion(questionIndex)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  )}
                </div>

                <label
                  className="sr-only"
                  htmlFor={`question-${questionIndex}`}
                >
                  Question text
                </label>
                <input
                  id={`question-${questionIndex}`}
                  required
                  maxLength={500}
                  value={question.text}
                  onChange={(event) =>
                    onUpdateQuestion(questionIndex, {
                      text: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-violet-500"
                  placeholder="Write your question"
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={optionIndex}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${
                        question.correctIndex === optionIndex
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-slate-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`correct-answer-${questionIndex}`}
                        value={optionIndex}
                        checked={question.correctIndex === optionIndex}
                        onChange={() =>
                          onUpdateQuestion(questionIndex, {
                            correctIndex: optionIndex,
                          })
                        }
                        aria-label={`Set option ${optionIndex + 1} as correct`}
                        className="accent-emerald-600"
                      />
                      <input
                        required
                        maxLength={200}
                        value={option}
                        onChange={(event) =>
                          onUpdateOption(
                            questionIndex,
                            optionIndex,
                            event.target.value
                          )
                        }
                        className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                        placeholder={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      />
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">
                  Select the circle beside the correct answer.
                </p>
                <label className="mt-4 block space-y-2 text-sm font-semibold">
                  Explanation (optional)
                  <textarea
                    maxLength={1000}
                    rows={2}
                    value={question.explanation}
                    onChange={(event) =>
                      onUpdateQuestion(questionIndex, {
                        explanation: event.target.value,
                      })
                    }
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500"
                    placeholder="Add an explanation for learners (optional)"
                  />
                </label>
              </fieldset>
            ))}
          </div>

          {builderError && (
            <p role="alert" className="text-sm font-medium text-rose-700">
              {builderError}
            </p>
          )}

          <div className="flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onAddQuestion}
              disabled={quizDraft.questions.length >= 50}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              <Plus size={17} /> Add question
            </button>
            <button
              type="submit"
              disabled={savingQuiz}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {savingQuiz && (
                <LoaderCircle className="animate-spin" size={18} />
              )}
              {editingQuizId ? "Update quiz" : "Save quiz"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default QuizBuilderDialog;
