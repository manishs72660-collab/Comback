import { Check, Minus, X } from "lucide-react";
import { STATUS } from "../utils/constants.jsx";
import { formatShort, weekdayNarrow } from "../utils/date.js";

const MARK = {
  completed: { cls: "bg-accent text-[#0c0c0d]", icon: Check },
  partial: { cls: "bg-accent/35 text-ink", icon: Minus },
  missed: { cls: "border border-muted/50 text-muted", icon: X },
  pending: { cls: "border-2 border-ink/35" },
  none: { cls: "bg-ink/[.06]" },
  upcoming: { cls: "bg-ink/[.06]" },
};

export default function WeekStrip({ days, todayDate }) {
  return (
    <ol className="flex justify-between gap-1.5" aria-label="Last 7 days">
      {days.map((day) => {
        const mark = MARK[day.status] || MARK.none;
        const Icon = mark.icon;
        const isToday = day.date === todayDate;
        const label = `${formatShort(day.date)}: ${STATUS[day.status]?.label || ""}`;
        return (
          <li key={day.date} className="flex flex-col items-center gap-2" title={label}>
            <span
              className={`grid h-9 w-9 place-items-center rounded-full ${mark.cls} ${
                isToday ? "ring-2 ring-ink ring-offset-2 ring-offset-panel" : ""
              }`}
            >
              {Icon && <Icon className="h-4 w-4" strokeWidth={2.75} />}
              <span className="sr-only">{label}</span>
            </span>
            <span className={`text-xs ${isToday ? "font-semibold text-ink" : "muted"}`}>
              {weekdayNarrow(day.date)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
