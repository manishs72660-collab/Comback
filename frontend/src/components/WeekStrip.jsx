import { Check, Minus, X } from "lucide-react";
import { STATUS } from "../utils/constants.jsx";
import { formatShort, weekdayNarrow } from "../utils/date.js";

const MARK = {
  completed: { cls: "bg-brand-600 text-white dark:bg-brand-400 dark:text-night-900", icon: Check },
  partial: { cls: "bg-hi-400 text-ink", icon: Minus },
  missed: { cls: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300", icon: X },
  pending: { cls: "border-2 border-brand-500" },
  none: { cls: "border border-dashed border-ink/25 dark:border-white/25" },
  upcoming: { cls: "border border-dashed border-ink/25 dark:border-white/25" },
};

export default function WeekStrip({ days, todayDate }) {
  return (
    <ol className="flex gap-3" aria-label="Last 7 days">
      {days.map((day) => {
        const mark = MARK[day.status] || MARK.none;
        const Icon = mark.icon;
        const label = `${formatShort(day.date)}: ${STATUS[day.status]?.label || ""}`;
        return (
          <li key={day.date} className="flex flex-col items-center gap-1.5" title={label}>
            <span className={`grid h-9 w-9 place-items-center rounded-full ${mark.cls}`}>
              {Icon && <Icon className="h-4 w-4" strokeWidth={3} />}
              <span className="sr-only">{label}</span>
            </span>
            <span className={`text-xs ${day.date === todayDate ? "font-bold" : "muted"}`}>
              {weekdayNarrow(day.date)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
