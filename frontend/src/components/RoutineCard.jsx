import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, SkipForward, StickyNote, Undo2 } from "lucide-react";

// One row in a checklist. onSet(status, note?) is called with
// "done", "skipped" or "pending" (pending = undo).
export default function RoutineCard({ item, onSet, readOnly = false }) {
  const { routine, status } = item;
  const done = status === "done";
  const skipped = status === "skipped";

  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState(item.note || "");

  useEffect(() => setNote(item.note || ""), [item.note]);

  const saveNote = () => {
    if (note.trim() !== (item.note || "")) onSet(status, note.trim());
  };

  const showMeta = routine.reminderTime || skipped || (item.note && !noteOpen);

  return (
    <li className="group rounded-2xl px-3 py-3 transition-colors duration-150 hover:bg-panel2/60">
      <div className="flex items-center gap-4">
        <motion.button
          type="button"
          whileTap={{ scale: 0.86 }}
          disabled={readOnly}
          onClick={() => onSet(done ? "pending" : "done")}
          aria-pressed={done}
          aria-label={done ? `Mark "${routine.title}" as not done` : `Mark "${routine.title}" as done`}
          className={`relative grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors duration-200 before:absolute before:-inset-2 before:content-[''] disabled:cursor-not-allowed ${
            done ? "border-accent bg-accent text-[#0c0c0d]" : "border-muted/60 hover:border-ink"
          }`}
        >
          <AnimatePresence initial={false}>
            {done && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 24 }}
              >
                <Check className="h-4 w-4" strokeWidth={3.25} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <div className="min-w-0 flex-1">
          <p className={`truncate font-medium ${done ? "muted line-through" : skipped ? "muted" : ""}`}>
            {routine.title}
          </p>
          {showMeta && (
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-[13px] muted">
              {routine.reminderTime && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" strokeWidth={2} />
                  {routine.reminderTime}
                </span>
              )}
              {skipped && <span>Skipped</span>}
              {item.note && !noteOpen && <span className="truncate italic">{item.note}</span>}
            </p>
          )}
        </div>

        {!readOnly && (
          <div className="row-actions flex items-center gap-0.5">
            {status !== "pending" && (
              <button
                type="button"
                className="icon-btn"
                onClick={() => setNoteOpen((v) => !v)}
                aria-label="Add a note"
                aria-expanded={noteOpen}
              >
                <StickyNote className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
            <button
              type="button"
              className="icon-btn"
              onClick={() => onSet(skipped ? "pending" : "skipped")}
              aria-label={skipped ? "Undo skip" : "Skip today"}
              title={skipped ? "Undo skip" : "Skip today"}
            >
              {skipped ? <Undo2 className="h-4 w-4" strokeWidth={1.75} /> : <SkipForward className="h-4 w-4" strokeWidth={1.75} />}
            </button>
          </div>
        )}
      </div>

      {noteOpen && status !== "pending" && !readOnly && (
        <div className="pl-11 pt-3">
          <input
            className="input !py-2.5"
            value={note}
            maxLength={300}
            placeholder="How did it go?"
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          />
        </div>
      )}
    </li>
  );
}
