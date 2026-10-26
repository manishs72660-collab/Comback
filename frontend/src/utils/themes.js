export const colorThemes = [
  { id: "orange", label: "Orange", color: "#f27848" },
  { id: "purple", label: "Purple", color: "#ad83ef" },
  { id: "emerald", label: "Emerald", color: "#72ba86" },
  { id: "ocean-blue", label: "Ocean Blue", color: "#5b9df7" },
  { id: "rose-pink", label: "Rose Pink", color: "#ed7895" },
];

export const validTheme = (theme) => colorThemes.some(({ id }) => id === theme);
let themeTransitionTimer;

export const applyColorTheme = (theme, animate = false) => {
  if (!validTheme(theme)) return;
  const root = document.documentElement;
  window.clearTimeout(themeTransitionTimer);
  if (animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    root.classList.add("theme-transitioning");
    themeTransitionTimer = window.setTimeout(() => root.classList.remove("theme-transitioning"), 420);
  } else {
    root.classList.remove("theme-transitioning");
  }
  root.dataset.theme = theme;
};

export const saveColorTheme = (theme, userId) => {
  if (!validTheme(theme)) return false;
  if (userId) window.localStorage.setItem(`comeback-theme:${userId}`, theme);
  window.localStorage.setItem("comeback-theme", theme);
  applyColorTheme(theme, true);
  return true;
};
