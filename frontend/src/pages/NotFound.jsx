import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="font-display text-7xl font-bold text-brand-600 dark:text-brand-300">404</p>
        <h1 className="mt-4 text-2xl font-semibold">This page does not exist</h1>
        <p className="mt-2 muted">The link may be broken, or the page may have moved.</p>
        <Link to="/" className="btn btn-primary mt-8">
          Go to today
        </Link>
      </div>
    </div>
  );
}
