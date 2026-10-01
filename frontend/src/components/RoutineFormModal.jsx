import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import { Spinner } from "./Spinner.jsx";
import { CATEGORIES, DAYS, TIMES } from "../utils/constants.jsx";
import { todayString } from "../utils/date.js";

const emptyForm = () => ({
  title: "",
  description: "",
  category: "personal",
  timeOfDay: "anytime",
  reminderTime: "",
  repeatType: "daily",
  repeatDays: [1, 2, 3, 4, 5],
  startDate: todayString(),
});

const fromRoutine = (r) => ({
  title: r.title,
  description: r.description || "",
  category: r.category,
  timeOfDay: r.timeOfDay,
  reminderTime: r.reminderTime || "",
  repeatType: r.repeatType,
  repeatDays: r.repeatDays?.length ? r.repeatDays : [1, 2, 3, 4, 5],
  startDate: r.startDate,
});

const REPEATS = [
  { value: "daily", label: "Every day" },
  { value: "weekdays", label: "Weekdays" },
  { value: "custom", label: "Custom" },
];

function Choice({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-150 ${
        active ? "border-ink bg-ink text-bg" : "border-line bg-panel hover:border-muted"
      }`}
    >
      {children}
    </button>
  );
}

export default function RoutineFormModal({ open, onClose, onSubmit, initial, busy }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(initial ? fromRoutine(initial) : emptyForm());
  }, [open, initial]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleDay = (day) =>
    set(
      "repeatDays",
      form.repeatDays.includes(day) ? form.repeatDays.filter((d) => d !== day) : [...form.repeatDays, day]
    );

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (!form.title.trim()) next.title = "Give your routine a name";
    if (form.title.length > 100) next.title = "Keep the name under 100 characters";
    if (form.repeatType === "custom" && form.repeatDays.length === 0) {
      next.repeatDays = "Pick at least one day";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      timeOfDay: form.timeOfDay,
      reminderTime: form.reminderTime,
      repeatType: form.repeatType,
      repeatDays: form.repeatType === "custom" ? [...form.repeatDays].sort((a, b) => a - b) : [],
      startDate: form.startDate || todayString(),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? "Edit routine" : "New routine"} side="right">
      <form onSubmit={submit} className="space-y-7" noValidate>
        <div>
          <label className="field-label" htmlFor="routine-title">
            Name
          </label>
          <input
            id="routine-title"
            className={`input ${errors.title ? "!border-danger" : ""}`}
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Morning walk"
            maxLength={120}
            autoFocus
          />
          {errors.title && <p className="mt-1.5 text-[13px] text-danger">{errors.title}</p>}
        </div>

        <div>
          <label className="field-label" htmlFor="routine-desc">
            Details (optional)
          </label>
          <textarea
            id="routine-desc"
            rows={2}
            className="input resize-none"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="20 minutes, no phone"
            maxLength={500}
          />
        </div>

        <div>
          <p className="field-label">Category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Choice key={c.value} active={form.category === c.value} onClick={() => set("category", c.value)}>
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                {c.label}
              </Choice>
            ))}
          </div>
        </div>

        <div>
          <p className="field-label">When in the day</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {TIMES.map((t) => {
              const Icon = t.icon;
              return (
                <Choice key={t.value} active={form.timeOfDay === t.value} onClick={() => set("timeOfDay", t.value)}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {t.label}
                </Choice>
              );
            })}
          </div>
        </div>

        <div>
          <p className="field-label">Repeats</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {REPEATS.map((r) => (
              <Choice key={r.value} active={form.repeatType === r.value} onClick={() => set("repeatType", r.value)}>
                {r.label}
              </Choice>
            ))}
          </div>

          {form.repeatType === "custom" && (
            <div className="mt-3">
              <div className="flex gap-1.5">
                {DAYS.map((label, day) => {
                  const on = form.repeatDays.includes(day);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => toggleDay(day)}
                      aria-pressed={on}
                      aria-label={label}
                      className={`grid h-10 flex-1 place-items-center rounded-xl border text-xs font-medium transition-colors duration-150 ${
                        on ? "border-ink bg-ink text-bg" : "border-line bg-panel text-muted hover:border-muted"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {errors.repeatDays && <p className="mt-1.5 text-[13px] text-danger">{errors.repeatDays}</p>}
            </div>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="routine-time">
              Reminder time (optional)
            </label>
            <input
              id="routine-time"
              type="time"
              className="input"
              value={form.reminderTime}
              onChange={(e) => set("reminderTime", e.target.value)}
            />
          </div>
          <div>
            <label className="field-label" htmlFor="routine-start">
              Starts on
            </label>
            <input
              id="routine-start"
              type="date"
              className="input"
              value={form.startDate}
              onChange={(e) => set("startDate", e.target.value)}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-6">
          <button type="button" className="btn btn-soft" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary min-w-32" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : initial ? "Save changes" : "Add routine"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
