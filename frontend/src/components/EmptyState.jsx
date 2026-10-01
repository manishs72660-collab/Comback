export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="rounded-[24px] border border-dashed border-ink/20 bg-panel/50 px-6 py-14 text-center">
      {Icon && (
        <span className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-full bg-panel2 text-muted">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </span>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mx-auto mt-2 max-w-sm muted">{text}</p>}
      {children && <div className="mx-auto mt-6 w-full max-w-md">{children}</div>}
    </div>
  );
}
