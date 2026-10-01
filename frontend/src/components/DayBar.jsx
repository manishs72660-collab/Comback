import { motion } from "framer-motion";

// A rounded progress bar: filled in proportion to routines done.
export default function DayBar({ statuses, tone = "default", className = "" }) {
  const total = statuses.length;
  const done = statuses.filter((s) => s === "done").length;
  const pct = total ? (done / total) * 100 : 0;

  return (
    <div
      className={`h-2 w-full overflow-hidden rounded-full bg-ink/10 ${className}`}
      role="progressbar"
      aria-label="Routines done"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
    >
      <motion.div
        className="h-full rounded-full bg-accent"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}
