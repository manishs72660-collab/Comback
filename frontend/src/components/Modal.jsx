import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

// side="center" (default) is a dialog; side="right" is a floating drawer.
export default function Modal({ open, onClose, title, children, maxWidth = "max-w-lg", side = "center" }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const drawer = side === "right";
  const ease = { duration: 0.3, ease: [0.22, 1, 0.36, 1] };

  // Rendered in a portal so parent spacing and stacking never offset the overlay.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex ${drawer ? "justify-end p-3" : "items-center justify-center p-4"}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[3px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className={
              drawer
                ? "relative flex h-full w-full max-w-md flex-col rounded-[28px] border border-line bg-panel"
                : `relative flex max-h-[90vh] w-full ${maxWidth} flex-col rounded-[28px] border border-line bg-panel`
            }
            initial={drawer ? { x: "110%" } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={drawer ? { x: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={drawer ? { x: "110%" } : { opacity: 0, y: 8 }}
            transition={ease}
          >
            <div className="flex items-center justify-between gap-4 px-7 pb-2 pt-7">
              <h2 className="text-2xl">{title}</h2>
              <button type="button" onClick={onClose} className="icon-btn" aria-label="Close">
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <div className="overflow-y-auto px-7 pb-7 pt-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
