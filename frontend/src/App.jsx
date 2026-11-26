import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Atom,
  BookOpen,
  Brain,
  Calculator,
  Check,
  Clock3,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  Plus,
  Search,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import { AuthDialog, ProfileDialog } from "./components/AccountDialogs.jsx";
import QuizBuilderDialog from "./components/QuizBuilderDialog.jsx";
import QuizCard from "./components/QuizCard.jsx";
import {
  QuizModeDialog,
  QuizResultDialog,
  QuizRunnerDialog,
} from "./components/QuizFlowDialogs.jsx";

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
  explanation: "",
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
  const [practiceCheckError, setPracticeCheckError] = useState("");
  const [result, setResult] = useState(null);
  const [quizToStart, setQuizToStart] = useState(null);
  const [authUser, setAuthUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [quizMenuOpenId, setQuizMenuOpenId] = useState(null);
  const activeRunRef = useRef(activeRun);
  const attemptSubmittedRef = useRef(false);

  useEffect(() => {
    activeRunRef.current = activeRun;
  }, [activeRun]);

  useEffect(() => {
    fetch(apiUrl("/api/auth/me"), { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data?.user) setAuthUser(data.user);
      })
      .catch(() => {});
  }, []);

  const loadQuizzes = useCallback(async () => {
    try {
      const data = await readResponse(
        await fetch(apiUrl("/api/quizzes"), { credentials: "include" })
      );
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

    fetch(apiUrl("/api/quizzes"), { credentials: "include" })
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
          credentials: "include",
          body: JSON.stringify({ answers: run.answers }),
        })
      );

      setResult({ quiz: run.quiz, mode: run.mode, ...data });
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

  async function startQuiz(quizSummary, mode) {
    setApiError("");

    try {
      const data = await readResponse(
        await fetch(apiUrl(`/api/quizzes/${quizSummary._id}`), {
          credentials: "include",
        })
      );
      const quiz = data.quiz;
      attemptSubmittedRef.current = false;
      setAttemptError("");
      setPracticeCheckError("");
      setResult(null);
      setRemainingSeconds(quiz.durationMinutes * 60);
      const newRun = {
        quiz,
        mode,
        answers: Array(quiz.questions.length).fill(-1),
        currentIndex: 0,
        feedback: {},
        checkingAnswer: false,
        runKey: Symbol(),
      };
      activeRunRef.current = newRun;
      setActiveRun(newRun);
      setQuizToStart(null);
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function chooseAnswer(answerIndex) {
    const run = activeRunRef.current;
    if (!run || submittingAttempt || run.checkingAnswer) return;

    const questionIndex = run.currentIndex;
    if (run.mode === "practice" && run.feedback[questionIndex]) return;

    const answers = [...run.answers];
    answers[questionIndex] = answerIndex;
    const updatedRun = {
      ...run,
      answers,
      checkingAnswer: run.mode === "practice",
    };
    activeRunRef.current = updatedRun;
    setActiveRun(updatedRun);
    setPracticeCheckError("");

    if (run.mode !== "practice") return;

    try {
      const feedback = await readResponse(
        await fetch(apiUrl(`/api/quizzes/${run.quiz._id}/check-answer`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ questionIndex, answerIndex }),
        })
      );
      setPracticeCheckError("");
      setActiveRun((current) => {
        if (
          !current ||
          current.runKey !== run.runKey ||
          current.quiz._id !== run.quiz._id ||
          current.currentIndex !== questionIndex
        ) {
          return current;
        }
        return {
          ...current,
          checkingAnswer: false,
          feedback: { ...current.feedback, [questionIndex]: feedback },
        };
      });
    } catch (error) {
      const current = activeRunRef.current;
      if (
        current &&
        current.runKey === run.runKey &&
        current.currentIndex === questionIndex
      ) {
        const updated = { ...current, checkingAnswer: false };
        activeRunRef.current = updated;
        setActiveRun(updated);
      }
      setPracticeCheckError(error.message);
    }
  }

  function closeQuiz() {
    setActiveRun(null);
    setAttemptError("");
    setPracticeCheckError("");
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
        await fetch(
          apiUrl(editingQuizId ? `/api/quizzes/${editingQuizId}` : "/api/quizzes"),
          {
          method: editingQuizId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(quizDraft),
          credentials: "include",
          }
        )
      );

      setQuizzes((current) =>
        editingQuizId
          ? current.map((quiz) =>
              quiz._id === editingQuizId ? data.quiz : quiz
            )
          : [data.quiz, ...current]
      );
      setCategory("All Quizzes");
      setSearch("");
      setBuilderOpen(false);
      setQuizDraft(makeQuizDraft());
      setEditingQuizId(null);
      document.getElementById("explore")?.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      setBuilderError(error.message);
    } finally {
      setSavingQuiz(false);
    }
  }

  function openBuilder() {
    if (!authUser) {
      setAuthMode("signup");
      setAuthError("");
      setAuthOpen(true);
      setMenuOpen(false);
      return;
    }
    setBuilderError("");
    setEditingQuizId(null);
    setQuizDraft(makeQuizDraft());
    setBuilderOpen(true);
    setMenuOpen(false);
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const data = await readResponse(
        await fetch(apiUrl(`/api/auth/${authMode}`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(authForm),
        })
      );
      setAuthUser(data.user);
      setAuthOpen(false);
      setAuthForm({ name: "", email: "", password: "" });
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    await fetch(apiUrl("/api/auth/logout"), {
      method: "POST",
      credentials: "include",
    }).catch(() => {});
    setAuthUser(null);
    setProfileOpen(false);
  }

  async function openProfile() {
    setProfileOpen(true);
    setMenuOpen(false);
    try {
      const data = await readResponse(
        await fetch(apiUrl("/api/auth/me"), { credentials: "include" })
      );
      setProfileData(data);
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function editQuiz(quiz) {
    try {
      const data = await readResponse(
        await fetch(apiUrl(`/api/quizzes/${quiz._id}/edit`), {
          credentials: "include",
        })
      );
      setQuizDraft({
        title: data.quiz.title,
        subject: data.quiz.subject,
        description: data.quiz.description,
        durationMinutes: data.quiz.durationMinutes,
        level: data.quiz.level,
        questions: data.quiz.questions,
      });
      setEditingQuizId(quiz._id);
      setBuilderError("");
      setBuilderOpen(true);
    } catch (error) {
      setApiError(error.message);
    }
  }

  async function deleteQuiz(quiz) {
    if (!window.confirm(`Delete "${quiz.title}"? This cannot be undone.`)) return;

    try {
      await readResponse(
        await fetch(apiUrl(`/api/quizzes/${quiz._id}`), {
          method: "DELETE",
          credentials: "include",
        })
      );
      setQuizzes((current) => current.filter((item) => item._id !== quiz._id));
      if (profileOpen) await openProfile();
    } catch (error) {
      setApiError(error.message);
    }
  }

  const currentQuestion = activeRun?.quiz.questions[activeRun.currentIndex];
  const currentFeedback =
    activeRun?.feedback[activeRun.currentIndex] || null;

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

          {authUser ? (
            <div className="hidden items-center gap-2 md:flex">
              <button
                onClick={openProfile}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-50"
              >
                <UserRound size={17} /> {authUser.name}
              </button>
              <button
                onClick={logout}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Log out"
              >
                <LogOut size={19} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
                setAuthOpen(true);
              }}
              className="hidden items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 md:inline-flex"
            >
              <LogIn size={17} /> Log in
            </button>
          )}

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
            {authUser ? (
              <>
                <button
                  onClick={openProfile}
                  className="w-full rounded-lg p-3 text-left font-semibold hover:bg-slate-100"
                >
                  My profile
                </button>
                <button
                  onClick={logout}
                  className="w-full rounded-lg p-3 text-left font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Log out
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                  setAuthOpen(true);
                  setMenuOpen(false);
                }}
                className="w-full rounded-lg border border-slate-200 p-3 text-left font-semibold"
              >
                Log in
              </button>
            )}
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
                  <QuizCard
                    key={quiz._id}
                    quiz={quiz}
                    Icon={Icon}
                    menuOpen={quizMenuOpenId === quiz._id}
                    onToggleMenu={() =>
                      setQuizMenuOpenId((openId) =>
                        openId === quiz._id ? null : quiz._id
                      )
                    }
                    onEdit={() => {
                      setQuizMenuOpenId(null);
                      editQuiz(quiz);
                    }}
                    onDelete={() => {
                      setQuizMenuOpenId(null);
                      deleteQuiz(quiz);
                    }}
                    onStart={() => {
                      setQuizMenuOpenId(null);
                      setQuizToStart(quiz);
                    }}
                  />
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

      <QuizModeDialog
        quiz={quizToStart}
        onClose={() => setQuizToStart(null)}
        onStart={startQuiz}
      />
      <QuizRunnerDialog
        activeRun={activeRun}
        currentQuestion={currentQuestion}
        currentFeedback={currentFeedback}
        remainingSeconds={remainingSeconds}
        submittingAttempt={submittingAttempt}
        attemptError={attemptError}
        practiceCheckError={practiceCheckError}
        onChooseAnswer={chooseAnswer}
        onClose={closeQuiz}
        onNavigate={(currentIndex) =>
          setActiveRun((run) => ({
            ...run,
            currentIndex: Math.min(
              run.quiz.questions.length - 1,
              Math.max(0, currentIndex)
            ),
          }))
        }
        onSubmit={submitAttempt}
      />
      <QuizResultDialog
        result={result}
        onExplore={() => {
          setResult(null);
          document
            .getElementById("explore")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
        onPlayAgain={() => {
          const quiz = result.quiz;
          setResult(null);
          startQuiz(quiz, result.mode);
        }}
      />

      <AuthDialog
        open={authOpen}
        mode={authMode}
        form={authForm}
        setForm={setAuthForm}
        error={authError}
        loading={authLoading}
        onClose={() => setAuthOpen(false)}
        onSubmit={submitAuth}
        onToggleMode={() => {
          setAuthMode(authMode === "login" ? "signup" : "login");
          setAuthError("");
        }}
      />
      <ProfileDialog
        open={profileOpen}
        profileData={profileData}
        authUser={authUser}
        onClose={() => setProfileOpen(false)}
        onDeleteQuiz={deleteQuiz}
      />
      <QuizBuilderDialog
        open={builderOpen}
        editingQuizId={editingQuizId}
        quizDraft={quizDraft}
        setQuizDraft={setQuizDraft}
        builderError={builderError}
        savingQuiz={savingQuiz}
        onClose={() => setBuilderOpen(false)}
        onSubmit={createQuiz}
        onAddQuestion={addQuestion}
        onRemoveQuestion={removeQuestion}
        onUpdateQuestion={updateQuestion}
        onUpdateOption={updateOption}
      />
    </div>
  );
}

export default App;
