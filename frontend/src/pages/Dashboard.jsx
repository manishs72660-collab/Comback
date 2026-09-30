import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Flame, ListPlus, Plus, RotateCcw } from "lucide-react";

import { dashboardApi, logApi, routineApi } from "../api";
import { errorMessage } from "../api/axios";
import AnimatedNumber from "../components/AnimatedNumber.jsx";
import Confetti from "../components/Confetti.jsx";
import DayBar from "../components/DayBar.jsx";
import EmptyState from "../components/EmptyState.jsx";
import Heatmap from "../components/Heatmap.jsx";
import RoutineCard from "../components/RoutineCard.jsx";
import RoutineFormModal from "../components/RoutineFormModal.jsx";
import WeekStrip from "../components/WeekStrip.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { STARTERS, STATUS, TIMES } from "../utils/constants.jsx";
import { formatLong, formatShort, greeting, todayString } from "../utils/date.js";

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-hidden="true">
      <div className="h-56 rounded-[28px] bg-ink/10 dark:bg-white/10" />
      <div className="h-20 rounded-2xl bg-ink/5 dark:bg-white/5" />
      <div className="h-64 rounded-2xl bg-ink/5 dark:bg-white/5" />
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

  return (
    <div className="space-y-8">
      <Confetti show={confetti} />

      <section className="rounded-[28px] bg-brand-600 p-6 text-white sm:p-8 dark:bg-brand-700">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white/75">{formatLong(today)}</p>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              {greeting()}, {firstName}
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-hi-400 px-4 py-2 text-sm font-bold text-ink">
            <Flame className="h-4 w-4" />
            {streak.current} day streak
          </div>
        </div>

        <div className="mt-8 flex items-end gap-3">
          <span className="font-display text-6xl font-bold leading-none sm:text-7xl">
            <AnimatedNumber value={day.done} />
          </span>
          <span className="pb-1 text-lg text-white/75">
            {day.total === 0 ? "routines scheduled today" : `of ${day.total} routines done`}
          </span>
        </div>

        <DayBar statuses={day.items.map((i) => i.status)} tone="onBrand" className="mt-5" />
      </section>

      {showComeback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 rounded-2xl border border-hi-500/40 bg-hi-400/25 p-4"
        >
          <RotateCcw className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            You missed a few days. That is fine. Tick off one routine today and your streak starts again.
          </p>
        </motion.div>
      )}

      <section className="flex flex-wrap items-center justify-between gap-6 border-b border-ink/10 pb-8 dark:border-white/10">
        <WeekStrip days={week} todayDate={today} />
        <dl className="flex gap-10">
          <div>
            <dt className="text-sm muted">Best streak</dt>
            <dd className="font-display text-xl font-semibold">{streak.best} days</dd>
          </div>
          <div>
            <dt className="text-sm muted">Last 30 days</dt>
            <dd className="font-display text-xl font-semibold">{stats.last30Days.completionRate}%</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section aria-labelledby="today-heading">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 id="today-heading" className="text-xl font-semibold">
              Today's routines
            </h2>
            <button type="button" className="btn btn-primary" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Add routine
            </button>
          </div>

          {groups.length === 0 ? (
            <EmptyState
              icon={ListPlus}
              title="Nothing scheduled today"
              text="Add a routine, or start with one of these small ones."
            >
              <div className="flex flex-wrap justify-center gap-2">
                {STARTERS.map((s) => (
                  <button key={s.title} type="button" className="btn btn-soft" onClick={() => addStarter(s)}>
                    <Plus className="h-4 w-4" />
                    {s.title}
                  </button>
                ))}
              </div>
            </EmptyState>
          ) : (
            <div className="space-y-7">
              {groups.map((group) => {
                const Icon = group.icon;
                const done = group.items.filter((i) => i.status === "done").length;
                return (
                  <div key={group.value}>
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                      <Icon className="h-4 w-4 text-brand-600 dark:text-brand-300" />
                      {group.label}
                      <span className="font-medium muted">
                        {done} of {group.items.length}
                      </span>
                    </div>
                    <ul className="space-y-2.5">
                      {group.items.map((item) => (
                        <RoutineCard
                          key={item.routine._id}
                          item={item}
                          onSet={(status, note) => handleSet(item.routine._id, status, note)}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-9">
          <section aria-labelledby="grid-heading">
            <h2 id="grid-heading" className="mb-4 text-lg font-semibold">
              Last 4 months
            </h2>
            <Heatmap data={heatmap} onSelect={(date) => navigate(`/history?date=${date}`)} />
          </section>

          <section aria-labelledby="recent-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="recent-heading" className="text-lg font-semibold">
                Recent days
              </h2>
              <Link to="/history" className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300">
                See all
              </Link>
            </div>
            <ul className="divide-y divide-ink/10 dark:divide-white/10">
              {recent.map((d) => (
                <li key={d.date}>
                  <Link
                    to={`/history?date=${d.date}`}
                    className="flex items-center justify-between gap-3 py-3 text-sm transition-colors hover:text-brand-700 dark:hover:text-brand-300"
                  >
                    <span className="font-medium">{formatShort(d.date)}</span>
                    <span className="flex items-center gap-3">
                      {d.total > 0 && (
                        <span className="muted">
                          {d.done}/{d.total}
                        </span>
                      )}
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[d.status].pill}`}>
                        {STATUS[d.status].label}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </aside>
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
