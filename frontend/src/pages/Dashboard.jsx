import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { CalendarDays, Flame, ListPlus, Plus, RotateCcw } from "lucide-react";

import { dashboardApi, logApi, routineApi } from "../api";
import { errorMessage } from "../api/axios";
import AnimatedNumber from "../components/AnimatedNumber.jsx";
import Confetti from "../components/Confetti.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Heatmap from "../components/Heatmap.jsx";
import ProgressRing from "../components/ProgressRing.jsx";
import Reveal from "../components/Reveal.jsx";
import RoutineCard from "../components/RoutineCard.jsx";
import RoutineFormModal from "../components/RoutineFormModal.jsx";
import StatusDot from "../components/StatusDot.jsx";
import WeekStrip from "../components/WeekStrip.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { STARTERS, STATUS, TIMES } from "../utils/constants.jsx";
import { formatLong, formatShort, greeting, todayString } from "../utils/date.js";

function DashboardSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-12" aria-hidden="true">
      <div className="space-y-5 xl:col-span-8">
        <div className="h-72 rounded-[24px] bg-panel" />
        <div className="h-64 rounded-[24px] bg-panel" />
      </div>
      <div className="space-y-5 xl:col-span-4">
        <div className="h-72 rounded-[24px] bg-panel" />
        <div className="h-48 rounded-[24px] bg-panel" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = useMemo(() => todayString(), []);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const previousPercent = useRef(null);

  const load = useCallback(
    async (silent = false) => {
      try {
        const { data: res } = await dashboardApi.get(today);
        setData(res);
        setError("");
      } catch (err) {
        if (!silent) setError(errorMessage(err));
      } finally {
        setLoading(false);
      }
    },
    [today]
  );

  useEffect(() => {
    load();
  }, [load]);

  // celebrate the moment every routine for today becomes done
  useEffect(() => {
    if (!data) return;
    const { percent, total } = data.today;
    if (previousPercent.current !== null && previousPercent.current < 100 && percent === 100 && total > 0) {
      setConfetti(true);
      toast.success("Everything done for today");
    }
    previousPercent.current = percent;
  }, [data]);

  // hide the confetti after it has played (separate effect so reloads do not cancel the timer)
  useEffect(() => {
    if (!confetti) return undefined;
    const timer = setTimeout(() => setConfetti(false), 2300);
    return () => clearTimeout(timer);
  }, [confetti]);

  const handleSet = async (routineId, status, note) => {
    // update the screen first, then confirm with the server
    setData((prev) => {
      const items = prev.today.items.map((i) =>
        i.routine._id === routineId
          ? { ...i, status, note: note !== undefined ? note : status === "pending" ? "" : i.note }
          : i
      );
      const total = items.length;
      const done = items.filter((i) => i.status === "done").length;
      const skipped = items.filter((i) => i.status === "skipped").length;
      return {
        ...prev,
        today: { ...prev.today, items, done, skipped, percent: total ? Math.round((done / total) * 100) : 0 },
      };
    });
    try {
      await logApi.set({ routineId, date: today, status, ...(note !== undefined ? { note } : {}) });
    } catch (err) {
      toast.error(errorMessage(err));
    }
    load(true);
  };

  const createRoutine = async (payload) => {
    setSaving(true);
    try {
      await routineApi.create(payload);
      toast.success("Routine added");
      setFormOpen(false);
      await load(true);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const addStarter = async (starter) => {
    try {
      await routineApi.create({ ...starter, startDate: today });
      toast.success("Routine added");
      await load(true);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (loading) return <DashboardSkeleton />;

  if (error || !data) {
    return (
      <EmptyState title="Could not load your dashboard" text={error || "Something went wrong."}>
        <button type="button" className="btn btn-primary" onClick={() => { setLoading(true); load(); }}>
          Try again
        </button>
      </EmptyState>
    );
  }

  const { today: day, streak, stats, history, heatmap } = data;
  const firstName = (user?.name || "").split(" ")[0];
  const week = history.slice(0, 7).reverse();
  const recent = history.slice(0, 8);

  const groups = TIMES.map((t) => ({
    ...t,
    items: day.items.filter((i) => i.routine.timeOfDay === t.value),
  })).filter((g) => g.items.length);

  const recentMisses = history.slice(0, 7).filter((d) => d.status === "missed").length;
  const showComeback = streak.current === 0 && stats.last30Days.activeDays > 0 && recentMisses >= 2;

  const line =
    day.total === 0
      ? "A quiet day. Add a routine when you are ready."
      : day.done === day.total
      ? "Everything done. Rest well."
      : `${day.total - day.done} to go. One at a time.`;

  return (
    <div className="space-y-5">
      <Confetti show={confetti} />

      <Reveal>
        <section className="card dots relative overflow-hidden p-7 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-8">
            <div className="min-w-0 flex-1 basis-72">
              <span className="chip">
                <CalendarDays className="h-3.5 w-3.5" strokeWidth={2} />
                {formatLong(today)}
              </span>
              <h1 className="headline-script mt-5 break-words text-[clamp(3.5rem,7.5vw,6.5rem)]">
                {greeting()}, {firstName}
              </h1>
              <p className="mt-3 max-w-md muted">{line}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
                  <Plus className="h-4 w-4" strokeWidth={2.25} />
                  Add routine
                </button>
                <Link to="/history" className="btn btn-soft">
                  View history
                </Link>
              </div>
            </div>

            <ProgressRing percent={day.percent} size={200}>
              <p className="num text-5xl leading-none">
                <AnimatedNumber value={day.done} />
                <span className="text-2xl muted">/{day.total}</span>
              </p>
              <p className="mt-2 text-xs font-medium muted">done today</p>
            </ProgressRing>
          </div>
        </section>
      </Reveal>

      <div className="grid gap-5 xl:grid-cols-12">
      {/* left column */}
      <div className="space-y-5 xl:col-span-8">
        {showComeback && (
          <Reveal delay={0.05}>
            <div className="card flex items-start gap-4 !border-accent/40 p-5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                <RotateCcw className="h-4 w-4" strokeWidth={2} />
              </span>
              <p className="pt-1.5">
                You missed a few days. That is fine. Tick off one routine today and your streak starts again.
              </p>
            </div>
          </Reveal>
        )}

        <h2 id="today-heading" className="px-1 pt-3 text-xl">
          Today's routines
        </h2>

        {groups.length === 0 ? (
          <Reveal delay={0.1}>
            <EmptyState
              icon={ListPlus}
              title="Nothing scheduled today"
              text="Add a routine, or start with one of these small ones."
            >
              <div className="flex flex-wrap justify-center gap-2">
                {STARTERS.map((s) => (
                  <button key={s.title} type="button" className="btn btn-soft" onClick={() => addStarter(s)}>
                    <Plus className="h-4 w-4" strokeWidth={2.25} />
                    {s.title}
                  </button>
                ))}
              </div>
            </EmptyState>
          </Reveal>
        ) : (
          groups.map((group, gi) => {
            const Icon = group.icon;
            const done = group.items.filter((i) => i.status === "done").length;
            return (
              <Reveal key={group.value} delay={0.1 + gi * 0.06}>
                <section className="card p-3 sm:p-4" aria-labelledby="today-heading">
                  <div className="flex items-center justify-between px-3 pb-2 pt-2">
                    <h3 className="flex items-center gap-3 text-base">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-panel2">
                        <Icon className="h-4 w-4" strokeWidth={1.75} />
                      </span>
                      {group.label}
                    </h3>
                    <span className="chip">
                      {done} of {group.items.length}
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {group.items.map((item) => (
                      <RoutineCard
                        key={item.routine._id}
                        item={item}
                        onSet={(status, note) => handleSet(item.routine._id, status, note)}
                      />
                    ))}
                  </ul>
                </section>
              </Reveal>
            );
          })
        )}

        <Reveal delay={0.2}>
          <section className="card p-4 sm:p-5" aria-labelledby="recent-heading">
            <div className="flex items-baseline justify-between px-3 pb-2 pt-2">
              <h2 id="recent-heading" className="text-lg">
                Recent days
              </h2>
              <Link to="/history" className="text-sm font-medium muted transition-colors hover:text-ink">
                See all
              </Link>
            </div>
            <ul>
              {recent.map((d) => (
                <li key={d.date}>
                  <Link
                    to={`/history?date=${d.date}`}
                    className="flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-sm transition-colors hover:bg-panel2/60"
                  >
                    <span className="font-medium">{formatShort(d.date)}</span>
                    <span className="flex items-center gap-3 muted">
                      {d.total > 0 && (
                        <span className="tabular-nums">
                          {d.done}/{d.total}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        <StatusDot status={d.status} className="h-2 w-2" />
                        {STATUS[d.status].label}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      </div>

      {/* right column */}
      <div className="space-y-5 xl:col-span-4">
        <Reveal delay={0.08}>
          <section className="card p-7">
            <p className="flex items-center gap-2 text-sm font-medium muted">
              <Flame className="h-4 w-4 text-accent" strokeWidth={2.25} />
              Current streak
            </p>
            <p className="mt-5 flex items-end gap-2">
              <span className="num text-[6rem] leading-[.8] text-accent">
                <AnimatedNumber value={streak.current} />
              </span>
              <span className="pb-1 text-lg font-medium muted">days</span>
            </p>
            <p className="mt-4 text-sm muted">
              Best streak <span className="font-semibold text-ink">{streak.best} days</span>
            </p>
            <div className="mt-7 border-t border-line pt-6">
              <WeekStrip days={week} todayDate={today} />
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.14}>
          <section className="card p-7">
            <p className="text-sm font-medium muted">Last 30 days</p>
            <p className="mt-3 flex items-end justify-between gap-4">
              <span className="num text-5xl leading-none">
                {stats.last30Days.completionRate}
                <span className="text-2xl muted">%</span>
              </span>
              <span className="pb-1 text-sm muted">{stats.last30Days.activeDays} active days</span>
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink/10">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out"
                style={{ width: `${stats.last30Days.completionRate}%` }}
              />
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.2}>
          <section className="card p-7" aria-labelledby="grid-heading">
            <h2 id="grid-heading" className="mb-5 text-lg">
              Last 4 months
            </h2>
            <Heatmap data={heatmap} onSelect={(date) => navigate(`/history?date=${date}`)} />
          </section>
        </Reveal>

      </div>

      </div>

      <RoutineFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={createRoutine}
        initial={null}
        busy={saving}
      />
    </div>
  );
}
