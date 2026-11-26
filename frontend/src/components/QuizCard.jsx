import {
  ArrowRight,
  BookOpen,
  Clock3,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";

function QuizCard({
  quiz,
  Icon,
  menuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
  onStart,
}) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-200/60">
      <div className="flex items-start justify-between">
        <span className="rounded-xl bg-violet-100 p-3 text-violet-700">
          <Icon size={26} />
        </span>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {quiz.level}
          </span>
          {quiz.isOwner && (
            <div className="relative">
              <button
                type="button"
                onClick={onToggleMenu}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-violet-500"
                aria-label={`Manage ${quiz.title}`}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <MoreVertical size={19} />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-10 mt-2 w-36 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onEdit}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium hover:bg-slate-50"
                  >
                    <Pencil size={15} /> Edit
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={onDelete}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 size={15} /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <p className="mt-5 text-sm font-semibold text-violet-600">{quiz.subject}</p>
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
        onClick={onStart}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white transition group-hover:bg-violet-600"
      >
        Start quiz <ArrowRight size={17} />
      </button>
    </article>
  );
}

export default QuizCard;
