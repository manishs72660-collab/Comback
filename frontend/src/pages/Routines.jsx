import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Clock, ListChecks, Pause, Pencil, Play, Plus, Repeat, Trash2 } from "lucide-react";

import { routineApi } from "../api";
import { errorMessage } from "../api/axios";
import EmptyState from "../components/EmptyState.jsx";
import Modal from "../components/Modal.jsx";
import Reveal from "../components/Reveal.jsx";
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

  const activeCount = routines.filter((r) => r.isActive).length;
  const pill = (active) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200 ${
      active ? "bg-ink text-bg" : "text-muted hover:text-ink"
    }`;
  const catPill = (active) =>
    `inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-200 ${
      active ? "border-ink bg-ink text-bg" : "border-line bg-panel text-muted hover:border-muted hover:text-ink"
    }`;

  return (
    <div className="space-y-8">
      <Reveal>
        <header className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <h1 className="page-title">Routines</h1>
            <p className="mt-3 muted">
              {routines.length} in total, {activeCount} active. Everything you repeat, and the days it repeats on.
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            New routine
          </button>
        </header>
      </Reveal>

      {routines.length > 0 && (
        <Reveal delay={0.05}>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
            <div
              className="inline-flex gap-1 rounded-full border border-line bg-panel p-1 shadow-card"
              role="group"
              aria-label="Filter by status"
            >
              {FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFilter(f.value)}
                  aria-pressed={filter === f.value}
                  className={pill(filter === f.value)}
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
                className={catPill(category === "all")}
              >
                All categories
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  aria-pressed={category === c.value}
                  className={catPill(category === c.value)}
                >
                  <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </Reveal>
      )}

      {loading ? (
        <div className="grid place-items-center py-24">
          <Spinner className="h-6 w-6 text-muted" />
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
                <Plus className="h-4 w-4" strokeWidth={2.25} />
                {s.title}
              </button>
            ))}
          </div>
        </EmptyState>
      ) : visible.length === 0 ? (
        <EmptyState title="No routines match these filters" text="Change the status or category filter to see more." />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r, i) => {
            const cat = categoryOf(r.category);
            const time = TIMES.find((t) => t.value === r.timeOfDay);
            const TimeIcon = time?.icon || Clock;
            return (
              <Reveal
                as="li"
                key={r._id}
                delay={Math.min(i * 0.04, 0.3)}
                className="card group flex h-full flex-col p-6 transition-colors duration-200 hover:border-ink/25"
              >
                  <div className="flex items-center justify-between gap-3">
                    <span className="chip">
                      <span className={`h-2 w-2 rounded-full ${cat.dot}`} />
                      {cat.label}
                    </span>
                    {!r.isActive && <span className="text-xs font-medium muted">Paused</span>}
                  </div>

                  <div className={`mt-5 flex-1 ${r.isActive ? "" : "opacity-55"}`}>
                    <h3 className="text-lg leading-snug">{r.title}</h3>
                    {r.description && <p className="mt-1.5 line-clamp-2 text-sm muted">{r.description}</p>}
                    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm muted">
                      <span className="inline-flex items-center gap-1.5">
                        <Repeat className="h-4 w-4" strokeWidth={1.75} />
                        {describeSchedule(r)}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <TimeIcon className="h-4 w-4" strokeWidth={1.75} />
                        {time?.label}
                        {r.reminderTime ? ` at ${r.reminderTime}` : ""}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
                    <button
                      type="button"
                      onClick={() => toggle(r)}
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors hover:bg-panel2"
                    >
                      {r.isActive ? <Pause className="h-4 w-4" strokeWidth={1.75} /> : <Play className="h-4 w-4" strokeWidth={1.75} />}
                      {r.isActive ? "Pause" : "Resume"}
                    </button>
                    <div className="flex gap-0.5">
                      <button type="button" className="icon-btn" onClick={() => openEdit(r)} aria-label={`Edit ${r.title}`}>
                        <Pencil className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn hover:!text-danger"
                        onClick={() => setDeleting(r)}
                        aria-label={`Delete ${r.title}`}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                      </button>
                    </div>
                  </div>
              </Reveal>
            );
          })}

          <Reveal as="li" delay={0.3} className="h-full">
            <button
                type="button"
                onClick={openNew}
                className="grid h-full min-h-[200px] w-full place-items-center rounded-[24px] border border-dashed border-ink/20 text-muted transition-colors duration-200 hover:border-ink/50 hover:bg-panel hover:text-ink"
              >
                <span className="flex flex-col items-center gap-3 text-sm font-medium">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-panel2">
                    <Plus className="h-5 w-5" strokeWidth={2} />
                  </span>
                  Add a routine
                </span>
            </button>
          </Reveal>
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
        <p className="muted">
          "{deleting?.title}" and all of its history will be removed. Pause it instead if you may want it back.
        </p>
        <div className="mt-8 flex justify-end gap-2">
          <button type="button" className="btn btn-soft" onClick={() => setDeleting(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger min-w-32" onClick={confirmDelete} disabled={deleteBusy}>
            {deleteBusy ? <Spinner className="h-4 w-4" /> : "Delete routine"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
