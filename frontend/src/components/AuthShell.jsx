import { motion } from "framer-motion";
import { CalendarDays, CheckCircle2, RotateCcw } from "lucide-react";
import DayBar from "./DayBar.jsx";
import Logo from "./Logo.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

const POINTS = [
  { icon: CheckCircle2, text: "Tick off today's routines in one tap" },
  { icon: CalendarDays, text: "See every day you showed up on a calendar" },
  { icon: RotateCcw, text: "Restart a streak any time. Your history stays." },
];

const SAMPLE = ["done", "done", "done", "done", "pending", "pending", "pending"];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between bg-brand-600 p-12 text-white lg:flex dark:bg-brand-800">
        <Logo light />

        <div>
          <h2 className="max-w-md text-4xl font-semibold leading-tight">Missed a few days? Start again today.</h2>
          <p className="mt-4 max-w-md text-white/75">
            Comeback keeps your daily routine in one place and counts every day you show up.
          </p>

          <DayBar statuses={SAMPLE} tone="onBrand" className="mt-10 max-w-md" />

          <ul className="mt-10 space-y-4">
            {POINTS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.li
                  key={p.text}
                  className="flex items-center gap-3 text-white/90"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.12 }}
                >
                  <Icon className="h-5 w-5 text-hi-400" />
                  {p.text}
                </motion.li>
              );
            })}
          </ul>
        </div>

        <p className="text-sm text-white/60">Small routines, repeated daily.</p>
      </aside>

      <main className="relative flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-8 text-sm muted">{footer}</div>
        </motion.div>
      </main>
    </div>
  );
}
