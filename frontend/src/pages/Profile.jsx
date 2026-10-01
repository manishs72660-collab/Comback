import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Flame, LogOut, Percent, Trophy } from "lucide-react";
import toast from "react-hot-toast";

import { dashboardApi } from "../api";
import Avatar from "../components/Avatar.jsx";
import Reveal from "../components/Reveal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import { todayString } from "../utils/date.js";

function Stat({ icon: Icon, label, value, unit, accent = false }) {
  return (
    <div className="card p-5 sm:p-6">
      <p className="flex items-center gap-2 text-sm font-medium muted">
        <Icon className={`h-4 w-4 ${accent ? "text-accent" : ""}`} strokeWidth={2} />
        {label}
      </p>
      <p className="mt-4 flex items-baseline gap-1.5">
        <span className={`num text-4xl leading-none sm:text-5xl ${accent ? "text-accent" : ""}`}>{value}</span>
        {unit && <span className="text-sm muted">{unit}</span>}
      </p>
    </div>
  );
}

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
  const segment = (on) =>
    `rounded-full px-5 py-2 text-sm font-medium transition-colors duration-200 ${on ? "bg-ink text-bg" : "text-muted hover:text-ink"}`;

  return (
    <div className="mx-auto max-w-[720px] space-y-4">
      <Reveal>
        <section className="card dots flex flex-col items-center px-6 py-12 text-center">
          <Avatar name={user?.name} className="h-24 w-24 text-4xl ring-4 ring-accent ring-offset-4 ring-offset-panel" />
          <h1 className="page-title mt-7 break-words">{user?.name}</h1>
          <p className="mt-2 muted">{user?.email}</p>
        </section>
      </Reveal>

      <Reveal delay={0.06}>
        <section aria-label="Your numbers" className="grid grid-cols-3 gap-3 sm:gap-4">
          <Stat icon={Flame} label="Streak" value={stats ? stats.streak.current : "–"} unit={stats ? "days" : ""} accent />
          <Stat icon={Trophy} label="Best" value={stats ? stats.streak.best : "–"} unit={stats ? "days" : ""} />
          <Stat icon={Percent} label="30 days" value={stats ? stats.stats.last30Days.completionRate : "–"} unit={stats ? "%" : ""} />
        </section>
      </Reveal>

      <Reveal delay={0.12}>
        <section className="card divide-y divide-line px-6">
          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <p className="font-semibold">Appearance</p>
              <p className="text-sm muted">{dark ? "Dark" : "White"} theme is on.</p>
            </div>
            <div className="inline-flex gap-1 rounded-full border border-line bg-bg p-1" role="group" aria-label="Theme">
              <button type="button" className={segment(dark)} aria-pressed={dark} onClick={() => !dark && toggle()}>
                Dark
              </button>
              <button type="button" className={segment(!dark)} aria-pressed={!dark} onClick={() => dark && toggle()}>
                White
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 py-5">
            <div>
              <p className="font-semibold">Log out</p>
              <p className="text-sm muted">Ends your session on this device.</p>
            </div>
            <button type="button" className="btn btn-danger" onClick={handleLogout}>
              <LogOut className="h-4 w-4" strokeWidth={1.75} />
              Log out
            </button>
          </div>
        </section>
      </Reveal>
    </div>
  );
}
