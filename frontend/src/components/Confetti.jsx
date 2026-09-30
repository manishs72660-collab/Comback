import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";

const COLORS = ["#3446f0", "#ffd84a", "#6f7dfb", "#f5c400", "#f43f5e", "#9ba6ff"];

export default function Confetti({ show }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * Math.min(window.innerWidth, 900),
        peak: -(140 + Math.random() * 260),
        rotate: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 7,
        delay: Math.random() * 0.15,
      })),
    [show]
  );

  return (
    <AnimatePresence>
      {show && (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden="true">
          {pieces.map((p) => (
            <motion.span
              key={p.id}
              className="absolute left-1/2 top-1/2 block rounded-sm"
              style={{ width: p.size, height: p.size * 1.6, background: p.color }}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: [0, p.peak, p.peak + 560], opacity: [1, 1, 0], rotate: p.rotate }}
              transition={{ duration: 1.9, delay: p.delay, ease: "easeOut" }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
