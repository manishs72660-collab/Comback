import { motion } from "framer-motion";
import { Flame } from "lucide-react";

import Logo from "./Logo.jsx";
import ProgressRing from "./ProgressRing.jsx";
import ThemeToggle from "./ThemeToggle.jsx";

// Floating previews on the dark hero panel. Fixed colours so they look the same in both themes.
function Float({ children, className = "", delay = 0, y = 8 }) {
  return (
    <motion.div
      className={`rounded-[26px] border border-white/10 bg-white/[.05] p-5 backdrop-blur ${className}`}
      animate={{ y: [0, -y, 0] }}
      transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}

const ROWS = [
  { t: "Drink a glass of water", done: true },
  { t: "Walk for 20 minutes", done: true },
  { t: "Read for 15 minutes", done: false },
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen nav:grid-cols-[1.15fr_1fr]">
      {/* hero panel, always dark */}
      <aside
        className="relative hidden flex-col justify-between overflow-hidden bg-[#0b0b0d] p-12 text-[#f4f4f2] nav:flex"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,.08) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <Logo light />

        <div>
          <p className="headline-script text-[clamp(5rem,9vw,8.5rem)] leading-[.95]">Begin again.</p>
          <p className="mt-10 max-w-sm text-[17px] leading-relaxed text-white/60">
            Miss a day and pick up the next one. Your routines and your history stay where you left them.
          </p>
        </div>

        <div className="grid max-w-xl grid-cols-[1fr_auto] items-end gap-4">
          <Float delay={0.4} y={6}>
            <p className="text-xs font-medium text-white/50">Today</p>
            <ul className="mt-3 space-y-2.5">
              {ROWS.map((r) => (
                <li key={r.t} className="flex items-center gap-3 text-sm">
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                      r.done ? "bg-[#f7c046] text-black" : "border border-white/25"
                    }`}
                  >
                    {r.done ? "✓" : ""}
                  </span>
                  <span className={r.done ? "text-white/45 line-through" : ""}>{r.t}</span>
                </li>
              ))}
            </ul>
          </Float>

          <div className="space-y-4">
            <Float delay={0} y={8} className="flex items-center gap-4 !p-4">
              <ProgressRing percent={66} size={68} stroke={7} track="rgba(255,255,255,.12)" color="#f7c046">
                <span className="text-sm font-semibold">2/3</span>
              </ProgressRing>
              <span className="pr-2 text-xs text-white/50">done today</span>
            </Float>
            <Float delay={1.2} y={10} className="!p-4">
              <p className="flex items-center gap-1.5 text-xs text-white/50">
                <Flame className="h-3.5 w-3.5 text-[#f7c046]" /> Streak
              </p>
              <p className="num mt-1 text-4xl leading-none text-[#f7c046]">
                12<span className="ml-1.5 text-sm font-medium text-white/50">days</span>
              </p>
            </Float>
          </div>
        </div>
      </aside>

      <main className="relative flex items-center justify-center px-6 py-14 sm:px-12">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <motion.div
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <Logo className="mb-10 inline-block nav:hidden" />
          <h1 className="page-title">{title}</h1>
          <p className="mt-3 muted">{subtitle}</p>
          <div className="mt-9">{children}</div>
          <div className="mt-9 text-sm muted [&_a]:font-medium [&_a]:text-ink [&_a]:underline [&_a]:underline-offset-4">
            {footer}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
