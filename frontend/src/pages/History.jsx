import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";

import { logApi } from "../api";
import { errorMessage } from "../api/axios";
import DayBar from "../components/DayBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Reveal from "../components/Reveal.jsx";
import RoutineCard from "../components/RoutineCard.jsx";
import { Spinner } from "../components/Spinner.jsx";
import StatusDot from "../components/StatusDot.jsx";
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

  const marked = ["completed", "partial", "missed", "pending"];

  // tile style per day status
  const TILE = {
    completed: "bg-accent font-semibold text-[#0c0c0d]",
    partial: "bg-accent/30",
    missed: "border border-dashed border-ink/25 text-muted",
    pending: "bg-ink/10",
    none: "text-muted",
    upcoming: "text-muted",
  };

  const stats = [
    { key: "completed", label: "Completed", value: monthStats.completed },
    { key: "partial", label: "Partly done", value: monthStats.partial },
    { key: "missed", label: "Missed", value: monthStats.missed },
  ];

  return (
    <div className="space-y-6">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="page-title">{monthLabel(cursor.year, cursor.month)}</h1>
            <p className="mt-3 muted">Pick any day to see what you did, or fix what you forgot to tick.</p>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-line bg-panel p-1 shadow-card">
            <button type="button" className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="Previous month">
              <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
            </button>
            <button type="button" className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors hover:bg-panel2" onClick={goToday}>
              Today
            </button>
            <button type="button" className="icon-btn" onClick={() => shiftMonth(1)} aria-label="Next month">
              <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
            </button>
          </div>
        </header>
      </Reveal>

      <Reveal delay={0.05}>
        <dl className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((st) => (
            <div key={st.key} className="card p-5 sm:p-6">
              <dt className="flex items-center gap-2 text-sm font-medium muted">
                <StatusDot status={st.key} className="h-2.5 w-2.5" />
                {st.label}
              </dt>
              <dd className="num mt-3 text-5xl leading-none sm:text-6xl">{st.value}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <Reveal delay={0.1}>
          <section aria-label="Calendar" className="card p-5 sm:p-7">
            <div className="mb-3 grid grid-cols-7 gap-2 text-center text-xs font-medium muted">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className={`grid grid-cols-7 gap-2 transition-opacity ${monthLoading ? "opacity-60" : ""}`}>
              {grid.map((date) => {
                const inMonth = parseDate(date).getMonth() === cursor.month;
                const s = summaries[date];
                const status = date > today ? "upcoming" : s?.status || "none";
                const isSelected = date === selected;
                const isToday = date === today;
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => selectDate(date)}
                    aria-pressed={isSelected}
                    aria-label={`${formatLong(date)}: ${STATUS[status].label}`}
                    className={`relative aspect-square rounded-2xl text-sm transition duration-150 hover:scale-[1.06] ${
                      TILE[status] || TILE.none
                    } ${inMonth ? "" : "opacity-30"} ${
                      isSelected ? "ring-2 ring-ink ring-offset-2 ring-offset-panel" : ""
                    }`}
                  >
                    {parseDate(date).getDate()}
                    {isToday && <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-current" />}
                  </button>
                );
              })}
            </div>

            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-5 text-xs muted">
              {marked.map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <StatusDot status={key} className="h-2.5 w-2.5" />
                  {STATUS[key].label}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>

        <Reveal delay={0.16}>
          <section aria-label="Selected day" className="card p-5 sm:p-7">
            <h2 className="text-2xl">{formatLong(selected)}</h2>

            {dayLoading || !dayView ? (
              <div className="grid place-items-center py-16">
                <Spinner className="h-6 w-6 text-muted" />
              </div>
            ) : dayView.total === 0 ? (
              <div className="mt-6">
                <EmptyState
                  icon={CalendarClock}
                  title="Nothing scheduled"
                  text="No routines were set for this day. Routines only show from the day they start."
                />
              </div>
            ) : (
              <>
                <div className="mt-5">
                  {!future && <DayBar statuses={dayView.items.map((i) => i.status)} />}
                  <p className="mt-3 text-sm muted">
                    {future ? `${dayView.total} routines planned` : `${dayView.done} of ${dayView.total} done`}
                  </p>
                </div>
                <ul className="mt-4 space-y-0.5">
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
        </Reveal>
      </div>
    </div>
  );
}
