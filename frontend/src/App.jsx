import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Atom,
  BookOpen,
  Brain,
  Calculator,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleX,
  Clock3,
  LoaderCircle,
  Menu,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  X,
} from "lucide-react";

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const apiUrl = (path) => `${API_BASE_URL}${path}`;

const categoryIcons = {
  Physics: Atom,
  Mathematics: Calculator,
  "General Knowledge": Brain,
};

const makeQuestion = () => ({
  text: "",
  options: ["", "", "", ""],
  correctIndex: 0,
});

const makeQuizDraft = () => ({
  title: "",
  subject: "",
  description: "",
  durationMinutes: 10,
  level: "Beginner",
  questions: [makeQuestion()],
});

async function readResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "The request could not be completed.");
  }

  return data;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function App() {
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [apiError, setApiError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Quizzes");
  const [menuOpen, setMenuOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [quizDraft, setQuizDraft] = useState(makeQuizDraft);
  const [savingQuiz, setSavingQuiz] = useState(false);
  const [builderError, setBuilderError] = useState("");
  const [activeRun, setActiveRun] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [submittingAttempt, setSubmittingAttempt] = useState(false);
  const [attemptError, setAttemptError] = useState("");
  const [result, setResult] = useState(null);
  const activeRunRef = useRef(activeRun);
  const attemptSubmittedRef = useRef(false);

  useEffect(() => {
    activeRunRef.current = activeRun;
  }, [activeRun]);

  const loadQuizzes = useCallback(async () => {
    try {
      const data = await readResponse(await fetch(apiUrl("/api/quizzes")));
      setQuizzes(data.quizzes);
      setApiError("");
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoadingQuizzes(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(apiUrl("/api/quizzes"))
      .then(readResponse)
      .then((data) => {
        if (!cancelled) {
          setQuizzes(data.quizzes);
          setApiError("");
        }
      })
      .catch((error) => {
        if (!cancelled) setApiError(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingQuizzes(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!activeRun || remainingSeconds === 0) return undefined;

    const timerId = window.setTimeout(() => {
      setRemainingSeconds((seconds) => Math.max(0, seconds - 1));
    }, 1000);

    return () => window.clearTimeout(timerId);
  }, [activeRun, remainingSeconds]);

  const submitAttempt = useCallback(async () => {
    const run = activeRunRef.current;
    if (!run || attemptSubmittedRef.current) return;

    attemptSubmittedRef.current = true;
    setSubmittingAttempt(true);
    setAttemptError("");

    try {
      const data = await readResponse(
        await fetch(apiUrl(`/api/quizzes/${run.quiz._id}/attempts`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: run.answers }),
        })
      );

      setResult({ quiz: run.quiz, ...data });
      setActiveRun(null);
    } catch (error) {
      setAttemptError(error.message);
      attemptSubmittedRef.current = false;
    } finally {
      setSubmittingAttempt(false);
    }
  }, []);

  useEffect(() => {
    if (activeRun && remainingSeconds === 0) {
      submitAttempt();
    }
  }, [activeRun, remainingSeconds, submitAttempt]);

  const filteredQuizzes = quizzes.filter((quiz) => {
    const query = search.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [quiz.title, quiz.subject, quiz.description].some((value) =>
        value.toLowerCase().includes(query)
      );
    const matchesCategory =
      category === "All Quizzes" || quiz.subject === category;

    return matchesSearch && matchesCategory;
  });

  const categories = [
    "All Quizzes",
    ...new Set(quizzes.map((quiz) => quiz.subject)),
  ];

  async function startQuiz(quizSummary) {
    setApiError("");

    try {
      const data = await readResponse(
        await fetch(apiUrl(`/api/quizzes/${quizSummary._id}`))
      );
      const quiz = data.quiz;
      attemptSubmittedRef.current = false;
      setAttemptError("");
      setResult(null);
      setRemainingSeconds(quiz.durationMinutes * 60);
      setActiveRun({
        quiz,
        answers: Array(quiz.questions.length).fill(-1),
        currentIndex: 0,
      });
    } catch (error) {
      setApiError(error.message);
    }
  }

  function chooseAnswer(answerIndex) {
    setActiveRun((run) => {
      if (!run || submittingAttempt) return run;

      const answers = [...run.answers];
      answers[run.currentIndex] = answerIndex;
      return { ...run, answers };
    });
  }

  function closeQuiz() {
    setActiveRun(null);
    setAttemptError("");
  }

  function updateQuestion(questionIndex, update) {
    setQuizDraft((draft) => ({
      ...draft,
      questions: draft.questions.map((question, index) =>
        index === questionIndex ? { ...question, ...update } : question
      ),
    }));
  }

  function updateOption(questionIndex, optionIndex, value) {
    const question = quizDraft.questions[questionIndex];
    updateQuestion(questionIndex, {
      options: question.options.map((option, index) =>
        index === optionIndex ? value : option
      ),
    });
  }

  function addQuestion() {
    setQuizDraft((draft) => ({
      ...draft,
      questions: [...draft.questions, makeQuestion()],
    }));
  }

  function removeQuestion(questionIndex) {
    setQuizDraft((draft) => ({
      ...draft,
      questions: draft.questions.filter((_, index) => index !== questionIndex),
    }));
  }

  async function createQuiz(event) {
    event.preventDefault();
    setSavingQuiz(true);
    setBuilderError("");

    try {
      const data = await readResponse(
        await fetch(apiUrl("/api/quizzes"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quizDraft),
        })
      );

      setQuizzes((current) => [data.quiz, ...current]);
      setCategory("All Quizzes");
      setSearch("");
      setBuilderOpen(false);
      setQuizDraft(makeQuizDraft());
      document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      setBuilderError(error.message);
    } finally {
      setSavingQuiz(false);
    }
  }

  function openBuilder() {
    setBuilderError("");
    setBuilderOpen(true);
    setMenuOpen(false);
  }

  const currentQuestion = activeRun?.quiz.questions[activeRun.currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#" className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Brain size={25} />
            </span>
            <span className="text-2xl font-extrabold tracking-tight">
              Quiz<span className="text-violet-600">Hub</span>
            </span>
          </a>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#explore" className="text-sm font-medium hover:text-violet-600">
              Explore
            </a>
            <a
              href="#categories"
              className="text-sm font-medium hover:text-violet-600"
            >
              Categories
            </a>
            <button
              onClick={openBuilder}
              className="text-sm font-medium hover:text-violet-600"
            >
              Create quiz
            </button>
          </div>

          <button
            onClick={openBuilder}
            className="hidden items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 md:inline-flex"
          >
            <Plus size={17} /> Create quiz
          </button>

          <button
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-2 hover:bg-slate-100 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </nav>

        {menuOpen && (
          <div className="space-y-1 border-t border-slate-200 bg-white p-4 md:hidden">
            <a
              onClick={() => setMenuOpen(false)}
              href="#explore"
              className="block rounded-lg p-3 hover:bg-slate-100"
            >
              Explore quizzes
            </a>
            <a
              onClick={() => setMenuOpen(false)}
              href="#categories"
              className="block rounded-lg p-3 hover:bg-slate-100"
            >
              Categories
            </a>
            <button
              onClick={openBuilder}
              className="w-full rounded-lg bg-violet-600 p-3 text-left font-semibold text-white"
            >
              Create a quiz
            </button>
          </div>
        )}
      </header>

      <main>
        <section className="relative overflow-hidden bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 md:grid-cols-2 md:py-24 lg:px-8">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
                <Sparkles size={16} />
                Your learning, your way
              </span>

              <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Learn more.
                <br />
                Play smarter.
                <br />
                <span className="text-violet-600">Quiz together.</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600">
                Discover quizzes, challenge yourself, and create questions for
                other learners to solve.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="#explore"
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-violet-200 hover:bg-violet-700"
                >
                  Explore quizzes <ArrowRight size={18} />
                </a>
                <button
                  onClick={openBuilder}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3.5 font-semibold hover:bg-slate-50"
                >
                  <Plus size={18} /> Create a quiz
                </button>
              </div>

              <div className="mt-10 flex flex-wrap gap-6 text-sm text-slate-600">
                <span className="flex items-center gap-2">
                  <BookOpen size={18} className="text-violet-600" />
                  Interactive learning
                </span>
                <span className="flex items-center gap-2">
                  <Trophy size={18} className="text-amber-500" />
                  Score and answer review
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-5 rounded-4xl bg-violet-100/70 blur-2xl" />
              <div className="relative rounded-3xl bg-slate-900 p-6 text-white shadow-2xl sm:p-9">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-white/10 p-3">
                    <Atom size={28} className="text-violet-300" />
                  </span>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                    READY TO PLAY
                  </span>
                </div>

                <p className="mt-7 text-sm text-slate-400">
                  PHYSICS · QUESTION 01
                </p>
                <h2 className="mt-3 text-xl font-bold leading-8 sm:text-2xl">
                  What is the SI unit of electric charge?
                </h2>

                <div className="mt-6 space-y-3">
                  {["Ampere", "Coulomb", "Volt", "Ohm"].map((option, index) => (
                    <div
                      key={option}
                      className={`flex items-center gap-3 rounded-xl border p-3.5 ${
                        index === 1
                          ? "border-violet-400 bg-violet-500/20"
                          : "border-white/10 bg-white/5"
                      }`}
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-sm">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="font-medium">{option}</span>
                      {index === 1 && (
                        <Check className="ml-auto text-violet-200" size={18} />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-slate-400">
                  <span className="flex items-center gap-2">
                    <Clock3 size={16} /> Timed quizzes
                  </span>
                  <span>Instant results</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="categories" className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
              Browse topics
            </p>
            <h2 className="mt-2 text-3xl font-extrabold">Explore categories</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {categories.map((name) => {
              const Icon =
                name === "All Quizzes"
                  ? BookOpen
                  : categoryIcons[name] || Brain;

              return (
                <button
                  key={name}
                  onClick={() => {
                    setCategory(name);
                    document
                      .getElementById("explore")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition hover:-translate-y-1 hover:border-violet-300 hover:shadow-md ${
                    category === name
                      ? "border-violet-400 bg-violet-50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <span className="rounded-xl bg-violet-100 p-3 text-violet-700">
                    <Icon size={23} />
                  </span>
                  <span className="text-sm font-bold sm:text-base">{name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section id="explore" className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-violet-600">
                Find your next challenge
              </p>
              <h2 className="mt-2 text-3xl font-extrabold">Explore quizzes</h2>
              <p className="mt-2 text-slate-500">
                Choose a quiz and see how you score.
              </p>
            </div>

            <label className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:max-w-sm">
              <Search size={20} className="shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search quizzes..."
                className="w-full bg-transparent text-sm outline-none"
                aria-label="Search quizzes"
              />
            </label>
          </div>

          {apiError && (
            <div
              role="alert"
              className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
            >
              <span className="flex items-center gap-2">
                <AlertCircle size={18} /> {apiError}
              </span>
              <button
                onClick={() => {
                  setLoadingQuizzes(true);
                  loadQuizzes();
                }}
                className="font-bold underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}

          {loadingQuizzes ? (
            <div className="mt-10 flex items-center justify-center gap-3 py-10 text-slate-500">
              <LoaderCircle className="animate-spin" size={20} />
              Loading quizzes...
            </div>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map((quiz) => {
                const Icon = categoryIcons[quiz.subject] || Brain;

                return (
                  <article
                    key={quiz._id}
                    className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-200/60"
                  >
                    <div className="flex items-start justify-between">
                      <span className="rounded-xl bg-violet-100 p-3 text-violet-700">
                        <Icon size={26} />
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {quiz.level}
                      </span>
                    </div>

                    <p className="mt-5 text-sm font-semibold text-violet-600">
                      {quiz.subject}
                    </p>
                    <h3 className="mt-2 text-xl font-bold">{quiz.title}</h3>
                    <p className="mt-3 min-h-12 text-sm leading-6 text-slate-500">
                      {quiz.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-4 border-t border-slate-100 pt-5 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <BookOpen size={16} /> {quiz.questionCount} questions
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock3 size={16} /> {quiz.durationMinutes} min
                      </span>
                    </div>

                    <button
                      onClick={() => startQuiz(quiz)}
                      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition group-hover:bg-violet-600"
                    >
                      Start quiz <ArrowRight size={17} />
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {!loadingQuizzes && filteredQuizzes.length === 0 && !apiError && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
              <Search className="mx-auto text-slate-400" size={32} />
              <h3 className="mt-4 text-lg font-bold">No quizzes found</h3>
              <p className="mt-2 text-slate-500">
                Try another search or choose a different category.
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setCategory("All Quizzes");
                }}
                className="mt-4 font-semibold text-violet-600"
              >
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section id="create" className="mx-auto max-w-7xl px-5 py-12 lg:px-8">
          <div className="flex flex-col justify-between gap-6 rounded-3xl bg-violet-600 p-8 text-white sm:p-12 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-sm">
                <Sparkles size={16} /> Become a quiz creator
              </span>
              <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
                Your questions.
                <br className="sm:hidden" /> Your community.
              </h2>
              <p className="mt-3 max-w-xl text-violet-100">
                Create multiple-choice quizzes and share them with other
                learners.
              </p>
            </div>

            <button
              onClick={openBuilder}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-6 py-4 font-bold text-violet-700 hover:bg-violet-50"
            >
              <Plus size={20} /> Create your first quiz
            </button>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-5 py-7 text-sm text-slate-500 sm:flex-row lg:px-8">
          <p className="font-bold text-slate-800">
            Quiz<span className="text-violet-600">Hub</span>
          </p>
          <p>Learn something new, one question at a time.</p>
        </div>
      </footer>

      {activeRun && currentQuestion && (
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

                return (
                  <button
                    key={`${index}-${option}`}
                    onClick={() => chooseAnswer(index)}
                    disabled={submittingAttempt}
                    className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-violet-500 bg-violet-50 text-violet-900"
                        : "border-slate-200 hover:border-violet-300 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        selected
                          ? "bg-violet-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="font-medium">{option}</span>
                    {selected && <Check className="ml-auto" size={18} />}
                  </button>
                );
              })}
            </div>

            {attemptError && (
              <div
                role="alert"
                className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-medium text-rose-700"
              >
                <span>{attemptError}</span>
                <button
                  onClick={submitAttempt}
                  className="rounded-lg border border-rose-200 px-3 py-2 hover:bg-rose-50"
                >
                  Retry submission
                </button>
              </div>
            )}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <button
                onClick={closeQuiz}
                className="rounded-xl px-4 py-3 font-semibold text-slate-600 hover:bg-slate-100"
              >
                Exit quiz
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() =>
                    setActiveRun((run) => ({
                      ...run,
                      currentIndex: Math.max(0, run.currentIndex - 1),
                    }))
                  }
                  disabled={activeRun.currentIndex === 0 || submittingAttempt}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={18} /> Back
                </button>
                {activeRun.currentIndex < activeRun.quiz.questions.length - 1 ? (
                  <button
                    onClick={() =>
                      setActiveRun((run) => ({
                        ...run,
                        currentIndex: Math.min(
                          run.quiz.questions.length - 1,
                          run.currentIndex + 1
                        ),
                      }))
                    }
                    disabled={submittingAttempt}
                    className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    Next <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    onClick={submitAttempt}
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
      )}

      {result && (
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
                const correct =
                  question.selectedIndex === question.correctIndex;

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
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button
                onClick={() => {
                  setResult(null);
                  document
                    .getElementById("explore")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
                className="rounded-xl border border-slate-200 px-5 py-3 font-semibold hover:bg-slate-50"
              >
                Explore quizzes
              </button>
              <button
                onClick={() => {
                  const quiz = result.quiz;
                  setResult(null);
                  startQuiz(quiz);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-700"
              >
                <RotateCcw size={17} /> Play again
              </button>
            </div>
          </section>
        </div>
      )}

      {builderOpen && (
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
                  Build a quiz
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add four choices to each question and select the correct one.
                </p>
              </div>
              <button
                onClick={() => setBuilderOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close quiz creator"
              >
                <X />
              </button>
            </div>

            <form onSubmit={createQuiz} className="mt-6 space-y-6">
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
                          onClick={() => removeQuestion(questionIndex)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={16} /> Remove
                        </button>
                      )}
                    </div>

                    <label className="sr-only" htmlFor={`question-${questionIndex}`}>
                      Question text
                    </label>
                    <input
                      id={`question-${questionIndex}`}
                      required
                      maxLength={500}
                      value={question.text}
                      onChange={(event) =>
                        updateQuestion(questionIndex, {
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
                              updateQuestion(questionIndex, {
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
                              updateOption(
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
                  onClick={addQuestion}
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
                  Save quiz
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
