import { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const previous = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplay(value);
      previous.current = value;
      return undefined;
    }
    const controls = animate(previous.current, value, {
      duration: 0.7,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    previous.current = value;
    return () => controls.stop();
  }, [value]);

  return <>{display}</>;
}
