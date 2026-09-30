import { useMemo } from "react";
import { motion } from "framer-motion";
import { STATUS } from "../utils/constants.jsx";
import { formatShort, parseDate } from "../utils/date.js";

const LEGEND = ["completed", "partial", "missed", "none"];

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
        <div className="flex gap-[3px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[3px]">
              {week.map((cell, ci) =>
                cell ? (
                  <motion.button
                    key={cell.date}
                    type="button"
                    onClick={() => onSelect?.(cell.date)}
                    title={`${formatShort(cell.date)}: ${STATUS[cell.status].label}`}
                    aria-label={`${formatShort(cell.date)}: ${STATUS[cell.status].label}`}
                    className={`h-3.5 w-3.5 rounded-[4px] ${STATUS[cell.status].cell}`}
                    initial={{ opacity: 0, scale: 0.4 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: wi * 0.012, duration: 0.25 }}
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
            <span className={`h-3 w-3 rounded-[4px] ${STATUS[key].cell}`} />
            {STATUS[key].label}
          </li>
        ))}
      </ul>
    </div>
  );
}
