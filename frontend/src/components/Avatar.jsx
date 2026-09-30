export default function Avatar({ name = "", className = "h-10 w-10 text-base" }) {
  const initial = (name.trim()[0] || "?").toUpperCase();
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-full bg-hi-400 font-display font-semibold text-ink ${className}`}
      aria-hidden="true"
    >
      {initial}
    </span>
  );
}
