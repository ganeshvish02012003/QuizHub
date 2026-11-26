import { LoaderCircle, Trash2, X } from "lucide-react";

export function AuthDialog({
  open,
  mode,
  form,
  setForm,
  error,
  loading,
  onClose,
  onSubmit,
  onToggleMode,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
              Quiz creator
            </p>
            <h2 id="auth-title" className="mt-2 text-2xl font-extrabold">
              {mode === "login" ? "Welcome back" : "Create your account"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close login"
          >
            <X />
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {mode === "signup" && (
            <label className="block space-y-2 text-sm font-semibold">
              Name
              <input
                required
                maxLength={60}
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500"
              />
            </label>
          )}
          <label className="block space-y-2 text-sm font-semibold">
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500"
            />
          </label>
          <label className="block space-y-2 text-sm font-semibold">
            Password
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className="w-full rounded-xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-violet-500"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm font-medium text-rose-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading && <LoaderCircle className="animate-spin" size={18} />}
            {mode === "login" ? "Log in" : "Sign up"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {mode === "login" ? "New creator?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={onToggleMode}
            className="font-bold text-violet-600"
          >
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </section>
    </div>
  );
}

export function ProfileDialog({
  open,
  profileData,
  authUser,
  onClose,
  onDeleteQuiz,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
              My profile
            </p>
            <h2 id="profile-title" className="mt-2 text-2xl font-extrabold">
              {profileData?.user.name || authUser?.name}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {profileData?.user.email || authUser?.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close profile"
          >
            <X />
          </button>
        </div>

        <div className="mt-7">
          <h3 className="text-lg font-bold">My quizzes</h3>
          <div className="mt-3 space-y-3">
            {profileData?.createdQuizzes?.length ? (
              profileData.createdQuizzes.map((quiz) => (
                <article
                  key={quiz._id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-bold">{quiz.title}</p>
                    <p className="text-sm text-slate-500">
                      {quiz.subject} · {quiz.questionCount} questions
                    </p>
                  </div>
                  <button
                    onClick={() => onDeleteQuiz(quiz)}
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                    aria-label={`Delete ${quiz.title}`}
                  >
                    <Trash2 size={18} />
                  </button>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                You have not created any quizzes yet.
              </p>
            )}
          </div>
        </div>

        <div className="mt-7">
          <h3 className="text-lg font-bold">My quiz history</h3>
          <div className="mt-3 space-y-3">
            {profileData?.attempts?.length ? (
              profileData.attempts.map((attempt) => (
                <article
                  key={attempt._id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <p className="font-bold">
                      {attempt.quiz?.title || "Deleted quiz"}
                    </p>
                    <p className="text-sm text-slate-500">
                      {new Date(attempt.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="rounded-full bg-violet-50 px-3 py-1.5 font-bold text-violet-700">
                    {attempt.score}/{attempt.total}
                  </span>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-500">
                Play a quiz to start your history.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
