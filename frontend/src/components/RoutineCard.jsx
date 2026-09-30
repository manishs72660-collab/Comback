import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, SkipForward, StickyNote, Undo2 } from "lucide-react";
import { categoryOf } from "../utils/constants.jsx";

// A single row in the checklist. onSet(status, note?) is called with
// "done", "skipped" or "pending" (pending = undo).
export default function RoutineCard({ item, onSet, readOnly = false }) {
  const { routine, status } = item;
  const done = status === "done";
  const skipped = status === "skipped";
  const category = categoryOf(routine.category);

  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(item.note || "");

  useEffect(() => setNote(item.note || ""), [item.note]);

  const saveNote = () => {
    if (note.trim() !== (item.note || "")) onSet(status, note.trim());
  };

  return (
    <motion.li
      layout
      transition={{ layout: { type: "spring", stiffness: 420, damping: 36 } }}
      className={`rounded-2xl border px-4 py-3.5 transition-colors ${
        done
          ? "border-brand-600/25 bg-brand-50 dark:border-brand-400/25 dark:bg-brand-500/10"
          : skipped
          ? "border-ink/10 bg-ink/[.03] dark:border-white/10 dark:bg-white/[.03]"
          : "border-ink/10 bg-white dark:border-white/10 dark:bg-night-800"
      }`}
    >
      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          whileTap={{ scale: 0.85 }}
          disabled={readOnly}
          onClick={() => onSet(done ? "pending" : "done")}
          aria-pressed={done}
          aria-label={done ? `Mark "${routine.title}" as not done` : `Mark "${routine.title}" as done`}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 transition-colors disabled:cursor-not-allowed ${
            done
              ? "border-brand-600 bg-brand-600 text-white dark:border-brand-400 dark:bg-brand-400 dark:text-night-900"
              : "border-ink/25 hover:border-brand-500 dark:border-white/25"
          }`}
        >
          <AnimatePresence>
            {done && (
              <motion.span
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
              >
                <Check className="h-5 w-5" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <div className="min-w-0 flex-1">
          <p className={`truncate font-semibold ${done || skipped ? "muted" : ""} ${done ? "line-through" : ""}`}>
            {routine.title}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-2 py-0.5 font-semibold ${category.chip}`}>{category.label}</span>
            {routine.reminderTime && (
              <span className="inline-flex items-center gap-1 muted">
                <Clock className="h-3 w-3" />
                {routine.reminderTime}
              </span>
            )}
            {skipped && <span className="font-semibold muted">Skipped</span>}
          </div>
          {item.note && !noteOpen && <p className="mt-1.5 truncate text-xs italic muted">{item.note}</p>}
        </div>

        {!readOnly && (
          <div className="flex items-center gap-0.5">
            {status !== "pending" && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => setNoteOpen((v) => !v)}
                aria-label="Add a note"
                aria-expanded={noteOpen}
              >
                <StickyNote className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={() => onSet(skipped ? "pending" : "skipped")}
              aria-label={skipped ? "Undo skip" : "Skip today"}
              title={skipped ? "Undo skip" : "Skip today"}
            >
              {skipped ? <Undo2 className="h-4 w-4" /> : <SkipForward className="h-4 w-4" />}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {noteOpen && status !== "pending" && !readOnly && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <input
              className="input mt-3 !py-2"
              value={note}
              maxLength={300}
              placeholder="How did it go?"
              onChange={(e) => setNote(e.target.value)}
              onBlur={saveNote}
              onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
