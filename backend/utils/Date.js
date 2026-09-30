// All dates are plain "YYYY-MM-DD" strings so they compare and sort correctly.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const isValidDateString = (s) => {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const d = new Date(`${s}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
};

const todayString = () => new Date().toISOString().slice(0, 10);

const addDays = (s, n) => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// 0 = Sunday ... 6 = Saturday
const dayOfWeek = (s) => new Date(`${s}T00:00:00Z`).getUTCDay();

// Inclusive list of dates from -> to
const dateRange = (from, to) => {
  const out = [];
  for (let d = from; d <= to; d = addDays(d, 1)) out.push(d);
  return out;
};

const diffDays = (from, to) =>
  Math.round(
    (new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`)) / 86400000
  );

module.exports = {
  isValidDateString,
  todayString,
  addDays,
  dayOfWeek,
  dateRange,
  diffDays,
};