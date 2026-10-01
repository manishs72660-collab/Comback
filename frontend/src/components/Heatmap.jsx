import { useMemo } from "react";
import { STATUS } from "../utils/constants.jsx";
import { formatShort, parseDate } from "../utils/date.js";

// Amber for days you showed up, neutral for everything else.
const LEVEL = {
  completed: "bg-accent",
  partial: "bg-accent/45",
  pending: "bg-ink/20",
  missed: "bg-ink/10 ring-1 ring-inset ring-ink/20",
  none: "bg-ink/[.06]",
  upcoming: "bg-ink/[.06]",
};
const LEGEND = ["completed", "partial", "missed", "none"];
const levelOf = (status) => LEVEL[status] || LEVEL.none;

export default function Heatmap({ data, onSelect }) {
  // columns are weeks (Sunday to Saturday)
  const weeks = useMemo(() => {
    if (!data.length) return [];
    const offset = parseDate(data[0].date).getDay();
    const cells = [...Array(offset).fill(null), ...data];
    const out = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [data]);

  return (
    <div>
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((cell, ci) =>
                cell ? (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => onSelect?.(cell.date)}
                    title={`${formatShort(cell.date)}: ${STATUS[cell.status].label}`}
                    aria-label={`${formatShort(cell.date)}: ${STATUS[cell.status].label}`}
                    className={`h-3.5 w-3.5 rounded-[5px] transition-transform duration-150 hover:scale-125 ${levelOf(cell.status)}`}
                  />
                ) : (
                  <span key={`empty-${ci}`} className="h-3.5 w-3.5" />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs muted">
        {LEGEND.map((key) => (
          <li key={key} className="flex items-center gap-1.5">
            <span className={`h-3 w-3 rounded-[4px] ${levelOf(key)}`} />
            {STATUS[key].label}
          </li>
        ))}
      </ul>
    </div>
  );
}
