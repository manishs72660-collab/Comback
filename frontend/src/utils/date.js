// Dates travel between the app and the API as local "YYYY-MM-DD" strings.
const pad = (n) => String(n).padStart(2, "0");

export const toDateString = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayString = () => toDateString(new Date());

export const isDateString = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export const parseDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (s, n) => {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateString(d);
};

export const formatLong = (s) =>
  parseDate(s).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });

export const formatShort = (s) =>
  parseDate(s).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });

export const weekdayNarrow = (s) =>
  parseDate(s).toLocaleDateString(undefined, { weekday: "narrow" });

export const monthLabel = (year, month) =>
  new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

export const greeting = () => {
  const h = new Date().getHours();
  if (h < 5) return "Still up";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
};
