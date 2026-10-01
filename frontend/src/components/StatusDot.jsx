// One mark language for day status: completed = solid accent, partly done = half,
// missed = hollow, anything else = faint.
export default function StatusDot({ status, className = "h-2.5 w-2.5" }) {
  if (status === "completed") {
    return <span aria-hidden="true" className={`block rounded-full bg-accent ${className}`} />;
  }
  if (status === "partial") {
    return (
      <span aria-hidden="true" className={`relative block overflow-hidden rounded-full border border-accent ${className}`}>
        <span className="absolute inset-x-0 bottom-0 h-1/2 bg-accent" />
      </span>
    );
  }
  if (status === "missed") {
    return <span aria-hidden="true" className={`block rounded-full border border-muted ${className}`} />;
  }
  if (status === "pending") {
    return <span aria-hidden="true" className={`block rounded-full bg-ink/30 ${className}`} />;
  }
  return <span aria-hidden="true" className={`block rounded-full bg-ink/15 ${className}`} />;
}
