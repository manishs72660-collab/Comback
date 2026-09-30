import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";

import { logApi } from "../api";
import { errorMessage } from "../api/axios";
import DayBar from "../components/DayBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import RoutineCard from "../components/RoutineCard.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { STATUS } from "../utils/constants.jsx";
import { addDays, formatLong, isDateString, monthLabel, parseDate, toDateString, todayString } from "../utils/date.js";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// All dates shown in a month calendar, padded to whole weeks.
const buildGrid = (year, month) => {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const start = addDays(toDateString(first), -first.getDay());
  const end = addDays(toDateString(last), 6 - last.getDay());
  const out = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
};

export default function History() {
  const [params, setParams] = useSearchParams();
  const today = useMemo(() => todayString(), []);
  const requested = params.get("date");
  const selected = isDateString(requested) ? requested : today;

  const [cursor, setCursor] = useState(() => {
    const d = parseDate(selected);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [summaries, setSummaries] = useState({});
  const [monthLoading, setMonthLoading] = useState(true);
  const [dayView, setDayView] = useState(null);
  const [dayLoading, setDayLoading] = useState(true);

  const grid = useMemo(() => buildGrid(cursor.year, cursor.month), [cursor]);

  const loadMonth = useCallback(async () => {
    try {
      const { data } = await logApi.history(grid[0], grid[grid.length - 1], today);
      setSummaries(Object.fromEntries(data.days.map((d) => [d.date, d])));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setMonthLoading(false);
    }
  }, [grid, today]);

  const loadDay = useCallback(async () => {
    try {
      const { data } = await logApi.day(selected);
      setDayView(data);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDayLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    setDayLoading(true);
    loadDay();
  }, [loadDay]);

  const selectDate = (date) => {
    setParams({ date }, { replace: true });
    const d = parseDate(date);
    if (d.getMonth() !== cursor.month || d.getFullYear() !== cursor.year) {
      setCursor({ year: d.getFullYear(), month: d.getMonth() });
    }
  };

  const shiftMonth = (delta) => {
    const d = new Date(cursor.year, cursor.month + delta, 1);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const goToday = () => {
    const d = parseDate(today);
    setCursor({ year: d.getFullYear(), month: d.getMonth() });
    setParams({}, { replace: true });
  };

  const handleSet = async (routineId, status, note) => {
    setDayView((prev) => {
      const items = prev.items.map((i) =>
        i.routine._id === routineId
          ? { ...i, status, note: note !== undefined ? note : status === "pending" ? "" : i.note }
          : i
      );
      const total = items.length;
      const done = items.filter((i) => i.status === "done").length;
      return { ...prev, items, done, total, percent: total ? Math.round((done / total) * 100) : 0 };
    });
    try {
      await logApi.set({ routineId, date: selected, status, ...(note !== undefined ? { note } : {}) });
    } catch (err) {
      toast.error(errorMessage(err));
    }
    loadDay();
    loadMonth();
  };

  const monthStats = useMemo(() => {
    const counts = { completed: 0, partial: 0, missed: 0 };
    grid.forEach((date) => {
      const d = parseDate(date);
      if (d.getMonth() !== cursor.month) return;
      const s = summaries[date];
      if (s && counts[s.status] !== undefined) counts[s.status] += 1;
    });
    return counts;
  }, [grid, summaries, cursor.month]);

  const future = selected > today;

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">History</h1>
          <p className="mt-2 muted">Pick any day to see what you did, or fix what you forgot to tick.</p>
        </div>
        <dl className="flex gap-8 text-sm">
          <div>
            <dt className="muted">Completed</dt>
            <dd className="font-display text-xl font-semibold">{monthStats.completed}</dd>
          </div>
          <div>
            <dt className="muted">Partly done</dt>
            <dd className="font-display text-xl font-semibold">{monthStats.partial}</dd>
          </div>
          <div>
            <dt className="muted">Missed</dt>
            <dd className="font-display text-xl font-semibold">{monthStats.missed}</dd>
          </div>
        </dl>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section aria-label="Calendar" className="surface p-4 sm:p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{monthLabel(cursor.year, cursor.month)}</h2>
            <div className="flex items-center gap-1">
              <button type="button" className="btn btn-soft !px-3 !py-1.5" onClick={goToday}>
                Today
              </button>
              <button type="button" className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button type="button" className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold muted">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className={`grid grid-cols-7 gap-1.5 transition-opacity ${monthLoading ? "opacity-60" : ""}`}>
            {grid.map((date) => {
              const inMonth = parseDate(date).getMonth() === cursor.month;
              const s = summaries[date];
              const status = date > today ? "upcoming" : s?.status || "none";
              const isSelected = date === selected;
              const isToday = date === today;
              return (
                <motion.button
                  key={date}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => selectDate(date)}
                  aria-pressed={isSelected}
                  aria-label={`${formatLong(date)}: ${STATUS[status].label}`}
                  className={`relative aspect-square rounded-xl text-sm font-semibold transition-opacity ${
                    STATUS[status].cell
                  } ${inMonth ? "" : "opacity-35"} ${
                    isSelected ? "ring-2 ring-ink ring-offset-2 ring-offset-white dark:ring-white dark:ring-offset-night-800" : ""
                  }`}
                >
                  {parseDate(date).getDate()}
                  {isToday && <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />}
                </motion.button>
              );
            })}
          </div>

          <ul className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs muted">
            {["completed", "partial", "missed", "pending", "none"].map((key) => (
              <li key={key} className="flex items-center gap-1.5">
                <span className={`h-3 w-3 rounded ${STATUS[key].cell}`} />
                {STATUS[key].label}
              </li>
            ))}
          </ul>
        </section>

        <section aria-label="Selected day">
          <h2 className="text-xl font-semibold">{formatLong(selected)}</h2>

          {dayLoading || !dayView ? (
            <div className="grid place-items-center py-16">
              <Spinner className="h-6 w-6 text-brand-600" />
            </div>
          ) : dayView.total === 0 ? (
            <div className="mt-5">
              <EmptyState
                icon={CalendarClock}
                title="Nothing scheduled"
                text="No routines were set for this day. Routines only show from the day they start."
              />
            </div>
          ) : (
            <>
              <p className="mt-2 text-sm muted">
                {future ? `${dayView.total} routines planned` : `${dayView.done} of ${dayView.total} done`}
              </p>
              {!future && <DayBar statuses={dayView.items.map((i) => i.status)} className="mt-4" />}
              <ul className="mt-5 space-y-2.5">
                {dayView.items.map((item) => (
                  <RoutineCard
                    key={item.routine._id}
                    item={item}
                    readOnly={future}
                    onSet={(status, note) => handleSet(item.routine._id, status, note)}
                  />
                ))}
              </ul>
              {future && <p className="mt-4 text-sm muted">You can log this day once it arrives.</p>}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
