import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import toast from "react-hot-toast";
import { Clock, ListChecks, Pause, Pencil, Play, Plus, Repeat, Trash2 } from "lucide-react";

import { routineApi } from "../api";
import { errorMessage } from "../api/axios";
import EmptyState from "../components/EmptyState.jsx";
import Modal from "../components/Modal.jsx";
import RoutineFormModal from "../components/RoutineFormModal.jsx";
import { Spinner } from "../components/Spinner.jsx";
import { CATEGORIES, STARTERS, TIMES, categoryOf, describeSchedule } from "../utils/constants.jsx";
import { todayString } from "../utils/date.js";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
];

export default function Routines() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [category, setCategory] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await routineApi.list();
      setRoutines(data.routines);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(
    () =>
      routines.filter((r) => {
        if (filter === "active" && !r.isActive) return false;
        if (filter === "paused" && r.isActive) return false;
        if (category !== "all" && r.category !== category) return false;
        return true;
      }),
    [routines, filter, category]
  );

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (routine) => {
    setEditing(routine);
    setFormOpen(true);
  };

  const submit = async (payload) => {
    setSaving(true);
    try {
      if (editing) {
        const { data } = await routineApi.update(editing._id, payload);
        setRoutines((list) => list.map((r) => (r._id === editing._id ? data.routine : r)));
        toast.success("Changes saved");
      } else {
        const { data } = await routineApi.create(payload);
        setRoutines((list) => [...list, data.routine]);
        toast.success("Routine added");
      }
      setFormOpen(false);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (routine) => {
    try {
      const { data } = await routineApi.toggle(routine._id);
      setRoutines((list) => list.map((r) => (r._id === routine._id ? data.routine : r)));
      toast.success(data.routine.isActive ? "Routine resumed" : "Routine paused");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    try {
      await routineApi.remove(deleting._id);
      setRoutines((list) => list.filter((r) => r._id !== deleting._id));
      toast.success("Routine deleted");
      setDeleting(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const addStarter = async (starter) => {
    try {
      const { data } = await routineApi.create({ ...starter, startDate: todayString() });
      setRoutines((list) => [...list, data.routine]);
      toast.success("Routine added");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Routines</h1>
          <p className="mt-2 muted">Everything you repeat, and the days it repeats on.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Add routine
        </button>
      </header>

      {routines.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex gap-1 rounded-xl bg-ink/5 p-1 dark:bg-white/5" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                aria-pressed={filter === f.value}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  filter === f.value ? "bg-white shadow-lift dark:bg-night-600" : "muted"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => setCategory("all")}
              aria-pressed={category === "all"}
              className={`rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                category === "all" ? "bg-ink text-white dark:bg-white dark:text-ink" : "bg-ink/5 muted dark:bg-white/5"
              }`}
            >
              All categories
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategory(c.value)}
                aria-pressed={category === c.value}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold transition-colors ${
                  category === c.value ? "bg-ink text-white dark:bg-white dark:text-ink" : "bg-ink/5 muted dark:bg-white/5"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-24">
          <Spinner className="h-7 w-7 text-brand-600" />
        </div>
      ) : error ? (
        <EmptyState title="Could not load your routines" text={error}>
          <button type="button" className="btn btn-primary" onClick={() => { setLoading(true); load(); }}>
            Try again
          </button>
        </EmptyState>
      ) : routines.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No routines yet"
          text="Start small. One or two routines you can do every day is enough."
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
      ) : visible.length === 0 ? (
        <EmptyState title="No routines match these filters" text="Change the status or category filter to see more." />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {visible.map((r) => {
              const cat = categoryOf(r.category);
              const time = TIMES.find((t) => t.value === r.timeOfDay);
              const TimeIcon = time?.icon || Clock;
              return (
                <motion.li
                  key={r._id}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: r.isActive ? 1 : 0.6, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  className="surface flex flex-col p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-sans text-base font-bold tracking-normal">{r.title}</h3>
                      {r.description && <p className="mt-1 line-clamp-2 text-sm muted">{r.description}</p>}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cat.chip}`}>
                      {cat.label}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-sm muted">
                    <span className="inline-flex items-center gap-1.5">
                      <Repeat className="h-4 w-4" />
                      {describeSchedule(r)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <TimeIcon className="h-4 w-4" />
                      {time?.label}
                      {r.reminderTime ? ` at ${r.reminderTime}` : ""}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-ink/10 pt-3 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => toggle(r)}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 dark:text-brand-300"
                    >
                      {r.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {r.isActive ? "Pause" : "Resume"}
                    </button>
                    <div className="flex gap-1">
                      <button type="button" className="icon-btn" onClick={() => openEdit(r)} aria-label={`Edit ${r.title}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="icon-btn hover:!text-rose-600"
                        onClick={() => setDeleting(r)}
                        aria-label={`Delete ${r.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      <RoutineFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={submit}
        initial={editing}
        busy={saving}
      />

      <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete this routine?" maxWidth="max-w-md">
        <p className="text-sm muted">
          "{deleting?.title}" and all of its history will be removed. Pause it instead if you may want it back.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className="btn btn-soft" onClick={() => setDeleting(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger min-w-28" onClick={confirmDelete} disabled={deleteBusy}>
            {deleteBusy ? <Spinner className="h-4 w-4" /> : "Delete routine"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
