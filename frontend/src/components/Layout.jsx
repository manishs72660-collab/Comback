import { NavLink, useOutlet } from "react-router-dom";
import { CalendarDays, LayoutDashboard, ListChecks, LogOut, User } from "lucide-react";

import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";
import Logo from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const NAV = [
  { to: "/", label: "Today", icon: LayoutDashboard, end: true },
  { to: "/routines", label: "Routines", icon: ListChecks },
  { to: "/history", label: "History", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: User },
];

// Floating pill nav (desktop).
function PillLink({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `rounded-full px-5 py-2 text-sm font-medium transition-colors duration-200 ${
          isActive ? "bg-ink text-bg" : "text-muted hover:text-ink"
        }`
      }
    >
      {item.label}
    </NavLink>
  );
}

// Floating dock (mobile).
function DockLink({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors duration-200 ${
          isActive ? "bg-ink text-bg" : "text-muted"
        }`
      }
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
      {item.label}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const outlet = useOutlet();

  return (
    <div className="min-h-screen">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-5 nav:px-8">
          <Logo />

          <nav
            className="hidden items-center gap-1 rounded-full border border-line bg-panel p-1 shadow-card nav:flex"
            aria-label="Main"
          >
            {NAV.map((item) => (
              <PillLink key={item.to} item={item} />
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            <span className="mx-1 hidden h-5 w-px bg-line nav:block" />
            <Avatar name={user?.name} />
            <button
              type="button"
              onClick={logout}
              className="icon-btn hover:!text-danger"
              aria-label="Log out"
              title={user?.email ? `Log out (${user.email})` : "Log out"}
            >
              <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 pb-32 pt-8 nav:px-8 nav:pb-16 nav:pt-10">{outlet}</main>

      {/* mobile dock */}
      <nav
        className="fixed inset-x-4 bottom-4 z-30 grid grid-cols-4 gap-1 rounded-[26px] border border-line bg-panel/90 p-1.5 shadow-card backdrop-blur-xl nav:hidden"
        aria-label="Main"
      >
        {NAV.map((item) => (
          <DockLink key={item.to} item={item} />
        ))}
      </nav>
    </div>
  );
}
