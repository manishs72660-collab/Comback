import { Loader2 } from "lucide-react";

export const Spinner = ({ className = "h-5 w-5" }) => (
  <Loader2 className={`animate-spin ${className}`} aria-hidden="true" />
);

export const PageLoader = () => (
  <div className="grid min-h-screen place-items-center">
    <div className="flex flex-col items-center gap-3" role="status">
      <Spinner className="h-7 w-7 text-brand-600 dark:text-brand-300" />
      <p className="text-sm muted">Loading your routines</p>
    </div>
  </div>
);
