export default function Avatar({ name = "", className = "h-9 w-9 text-sm" }) {
  const initial = (name.trim()[0] || "?").toUpperCase();
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-ink font-semibold text-bg ${className}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
