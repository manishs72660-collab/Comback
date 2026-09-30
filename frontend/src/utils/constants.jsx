import { Sunrise, Sun, Sunset, Clock } from "lucide-react";

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const TIMES = [
  { value: "morning", label: "Morning", icon: Sunrise },
  { value: "afternoon", label: "Afternoon", icon: Sun },
  { value: "evening", label: "Evening", icon: Sunset },
  { value: "anytime", label: "Anytime", icon: Clock },
];

export const CATEGORIES = [
  { value: "health", label: "Health", dot: "bg-emerald-500", chip: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" },
  { value: "study", label: "Study", dot: "bg-sky-500", chip: "bg-sky-500/10 text-sky-700 dark:text-sky-300" },
  { value: "work", label: "Work", dot: "bg-violet-500", chip: "bg-violet-500/10 text-violet-700 dark:text-violet-300" },
  { value: "personal", label: "Personal", dot: "bg-amber-500", chip: "bg-amber-500/15 text-amber-800 dark:text-amber-300" },
  { value: "other", label: "Other", dot: "bg-stone-400", chip: "bg-stone-500/10 text-stone-600 dark:text-stone-300" },
];

export const categoryOf = (value) => CATEGORIES.find((c) => c.value === value) || CATEGORIES[4];

export const describeSchedule = (r) => {
  if (r.repeatType === "weekdays") return "Weekdays";
  if (r.repeatType === "custom") {
    return [...(r.repeatDays || [])].sort((a, b) => a - b).map((d) => DAYS[d]).join(", ");
  }
  return "Every day";
};

// Colours for each day status, used by the calendar, the grid and the pills.
export const STATUS = {
  completed: {
    label: "Completed",
    pill: "bg-brand-600/10 text-brand-700 dark:bg-brand-400/15 dark:text-brand-200",
    cell: "bg-brand-600 text-white dark:bg-brand-400 dark:text-night-900",
  },
  partial: {
    label: "Partly done",
    pill: "bg-hi-400/30 text-hi-700 dark:bg-hi-400/20 dark:text-hi-300",
    cell: "bg-hi-400 text-ink",
  },
  missed: {
    label: "Missed",
    pill: "bg-rose-500/10 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300",
    cell: "bg-rose-200 text-rose-800 dark:bg-rose-500/40 dark:text-rose-100",
  },
  pending: {
    label: "In progress",
    pill: "bg-brand-100 text-brand-700 dark:bg-white/10 dark:text-white/70",
    cell: "bg-brand-100 text-brand-700 dark:bg-brand-500/30 dark:text-brand-100",
  },
  none: {
    label: "Rest day",
    pill: "bg-ink/5 text-ink/60 dark:bg-white/10 dark:text-white/55",
    cell: "bg-paper-200 text-ink/50 dark:bg-white/5 dark:text-white/40",
  },
  upcoming: {
    label: "Upcoming",
    pill: "bg-ink/5 text-ink/60 dark:bg-white/10 dark:text-white/55",
    cell: "bg-paper-200 text-ink/50 dark:bg-white/5 dark:text-white/40",
  },
};

export const STARTERS = [
  { title: "Drink a glass of water", category: "health", timeOfDay: "morning" },
  { title: "Walk for 20 minutes", category: "health", timeOfDay: "afternoon" },
  { title: "Read for 15 minutes", category: "study", timeOfDay: "evening" },
  { title: "Plan tomorrow", category: "personal", timeOfDay: "evening" },
];
