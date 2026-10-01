export default function Field({ label, icon: Icon, error, right, ...props }) {
  return (
    <div>
      <label className="field-label" htmlFor={props.id}>
        {label}
      </label>
      <div className="relative mt-2">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" strokeWidth={1.75} />
        )}
        <input
          {...props}
          aria-invalid={error ? "true" : undefined}
          className={`input ${Icon ? "pl-11" : ""} ${right ? "pr-12" : ""} ${error ? "!border-danger" : ""}`}
        />
        {right && <div className="absolute right-2 top-1/2 -translate-y-1/2">{right}</div>}
      </div>
      {error && <p className="mt-1.5 text-[13px] text-danger">{error}</p>}
    </div>
  );
}
