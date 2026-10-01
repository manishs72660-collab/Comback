import { Link } from "react-router-dom";

// Script wordmark. `light` is for the fixed dark panel on the auth screens.
export default function Logo({ light = false, className = "" }) {
  return (
    <Link
      to="/"
      className={`headline-script text-[32px] leading-none ${light ? "text-[#f4f4f2]" : "text-ink"} ${className}`}
    >
      Comeback
    </Link>
  );
}
