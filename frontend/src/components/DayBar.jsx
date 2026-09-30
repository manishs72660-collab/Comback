import { motion } from "framer-motion";

// One segment per routine: filled when done, so a day reads at a glance.
const TONES = {
  onBrand: { done: "bg-hi-400", skipped: "bg-white/45", pending: "bg-white/20" },
  default: {
    done: "bg-brand-600 dark:bg-brand-400",
    skipped: "bg-ink/25 dark:bg-white/30",
    pending: "bg-brand-100 dark:bg-white/10",
  },
};

export default function DayBar({ statuses, tone = "default", className = "" }) {
  const colors = TONES[tone];

  if (!statuses.length) {
    return (
      <div
        className={`h-3 rounded-full border-2 border-dashed ${
          tone === "onBrand" ? "border-white/35" : "border-ink/20 dark:border-white/20"
        } ${className}`}
      />
    );
  }

  const done = statuses.filter((s) => s === "done").length;

  return (
    <div
      className={`flex gap-1.5 ${className}`}
      role="progressbar"
      aria-label="Routines done today"
      aria-valuemin={0}
      aria-valuemax={statuses.length}
      aria-valuenow={done}
    >
      {statuses.map((status, i) => (
        <motion.span
          key={i}
          className={`h-3 flex-1 rounded-full transition-colors duration-300 ${colors[status] || colors.pending}`}
          style={{ originX: 0 }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: i * 0.06, duration: 0.35, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
