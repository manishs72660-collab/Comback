import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";

export default function Logo({ light = false, className = "" }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl ${light ? "bg-white/15" : "bg-brand-600"}`}
      >
        <TrendingUp className="h-5 w-5 text-hi-400" strokeWidth={3} />
      </span>
      <span className={`font-display text-lg font-semibold tracking-tight ${light ? "text-white" : ""}`}>
        comeback
      </span>
    </Link>
  );
}
