import { NavLink, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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

function SideLink({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `relative flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
          isActive ? "text-white" : "text-ink/60 hover:text-ink dark:text-white/55 dark:hover:text-white"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="side-pill"
              className="absolute inset-0 rounded-xl bg-brand-600 dark:bg-brand-500"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <Icon className="relative h-5 w-5" />
          <span className="relative">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

function TabLink({ item }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        `relative flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[11px] font-semibold transition-colors ${
          isActive ? "text-white" : "text-ink/55 dark:text-white/55"
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId="tab-pill"
              className="absolute inset-0 rounded-xl bg-brand-600 dark:bg-brand-500"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <Icon className="relative h-5 w-5" />
          <span className="relative">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const outlet = useOutlet();

  return (
    <div className="min-h-screen">
      {/* desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-ink/10 px-5 py-6 dark:border-white/10 lg:flex">
        <Logo />
        <nav className="mt-10 flex flex-col gap-1" aria-label="Main">
          {NAV.map((item) => (
            <SideLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="mt-auto space-y-4">
          <div className="flex items-center gap-3">
            <Avatar name={user?.name} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs muted">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button type="button" onClick={logout} className="btn btn-soft flex-1">
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between bg-paper-100/90 px-5 py-3 backdrop-blur dark:bg-night-900/90 lg:hidden">
        <Logo />
        <ThemeToggle />
      </header>

      <div className="lg:pl-64">
        <main className="mx-auto max-w-6xl px-5 pb-28 pt-4 lg:px-10 lg:pb-12 lg:pt-10">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {outlet}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* mobile bottom navigation */}
      <nav
        className="fixed inset-x-4 bottom-4 z-30 flex rounded-2xl border border-ink/10 bg-white/95 p-1.5 shadow-lift backdrop-blur dark:border-white/10 dark:bg-night-800/95 lg:hidden"
        aria-label="Main"
      >
        {NAV.map((item) => (
          <TabLink key={item.to} item={item} />
        ))}
      </nav>
    </div>
  );
}
