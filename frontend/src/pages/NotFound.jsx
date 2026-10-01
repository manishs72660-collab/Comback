import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <p className="headline-script text-[clamp(6rem,18vw,11rem)] leading-[.85] text-accent">404</p>
        <h1 className="mt-6 text-3xl">This page does not exist</h1>
        <p className="mt-3 muted">The link may be broken, or the page may have moved.</p>
        <Link to="/" className="btn btn-primary mt-8">
          Go to today
        </Link>
      </div>
    </div>
  );
}
