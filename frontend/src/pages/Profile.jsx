import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";
import toast from "react-hot-toast";

import { dashboardApi } from "../api";
import Avatar from "../components/Avatar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { todayString } from "../utils/date.js";

export default function Profile() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let active = true;
    dashboardApi
      .get(todayString())
      .then(({ data }) => active && setStats(data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    toast.success("You are logged out");
    navigate("/login", { replace: true });
  };

  const dark = theme === "dark";

  return (
    <div className="max-w-2xl space-y-8">
      <header className="flex items-center gap-5">
        <Avatar name={user?.name} className="h-16 w-16 text-2xl" />
        <div className="min-w-0">
          <h1 className="truncate text-3xl font-semibold">{user?.name}</h1>
          <p className="mt-1 truncate muted">{user?.email}</p>
        </div>
      </header>

      <section aria-label="Your numbers" className="grid grid-cols-3 gap-4 border-y border-ink/10 py-6 dark:border-white/10">
        <div>
          <p className="text-sm muted">Current streak</p>
          <p className="mt-1 font-display text-2xl font-semibold">{stats ? `${stats.streak.current} days` : "-"}</p>
        </div>
        <div>
          <p className="text-sm muted">Best streak</p>
          <p className="mt-1 font-display text-2xl font-semibold">{stats ? `${stats.streak.best} days` : "-"}</p>
        </div>
        <div>
          <p className="text-sm muted">Last 30 days</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {stats ? `${stats.stats.last30Days.completionRate}%` : "-"}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <div className="surface flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-semibold">Theme</p>
            <p className="text-sm muted">{dark ? "Dark" : "Light"} theme is on.</p>
          </div>
          <button type="button" className="btn btn-soft" onClick={toggle}>
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Switch to {dark ? "light" : "dark"}
          </button>
        </div>

        <div className="surface flex items-center justify-between gap-4 p-4">
          <div>
            <p className="font-semibold">Log out</p>
            <p className="text-sm muted">Ends your session on this device.</p>
          </div>
          <button type="button" className="btn btn-danger" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </section>
    </div>
  );
}
