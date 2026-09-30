export default function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-ink/15 px-6 py-12 text-center dark:border-white/15">
      {Icon && (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-white/10 dark:text-brand-200">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-2 max-w-sm text-sm muted">{text}</p>}
      {children && <div className="mt-6 w-full max-w-md">{children}</div>}
    </div>
  );
}
