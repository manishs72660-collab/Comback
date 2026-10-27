import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Check, Download, RefreshCw, Wifi, WifiOff, X } from "lucide-react";

const PwaContext = createContext(null);

export function PwaProvider({ children }) {
  const [online, setOnline] = useState(navigator.onLine);
  const installPrompt = useRef(null);
  const [canInstall, setCanInstall] = useState(false);
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onRegisterError: (error) => console.error("Service worker registration failed:", error),
  });

  useEffect(() => {
    const updateOnlineState = () => setOnline(navigator.onLine);
    const reportNetworkError = () => setOnline(false);
    const reportNetworkRestored = () => setOnline(true);
    const captureInstallPrompt = (event) => {
      event.preventDefault();
      installPrompt.current = event;
      setCanInstall(true);
    };
    const clearInstallPrompt = () => {
      installPrompt.current = null;
      setCanInstall(false);
    };
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    window.addEventListener("comeback:network-error", reportNetworkError);
    window.addEventListener("comeback:network-restored", reportNetworkRestored);
    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", clearInstallPrompt);
    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
      window.removeEventListener("comeback:network-error", reportNetworkError);
      window.removeEventListener("comeback:network-restored", reportNetworkRestored);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", clearInstallPrompt);
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = installPrompt.current;
    if (!prompt) return false;
    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      installPrompt.current = null;
      setCanInstall(false);
      return true;
    }
    return false;
  }, []);

  const value = useMemo(() => ({ online, canInstall, install }), [online, canInstall, install]);

  return <PwaContext.Provider value={value}>
    {children}
    {(needRefresh || offlineReady) && <div className="pwa-update-banner" role="status">
      <span>{needRefresh ? "A new Comback version is ready." : "Comback is ready to use offline."}</span>
      {needRefresh && <button type="button" className="pwa-banner-action" onClick={() => updateServiceWorker(true)}><RefreshCw size={14} /> Update</button>}
      <button type="button" className="pwa-banner-close" aria-label="Dismiss update notice" onClick={() => { setNeedRefresh(false); setOfflineReady(false); }}><X size={15} /></button>
    </div>}
  </PwaContext.Provider>;
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("PWA controls must be used inside PwaProvider.");
  return context;
}

export function PwaInstallButton({ className = "", iconOnly = false }) {
  const { canInstall, install } = usePwa();
  const [helpVisible, setHelpVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const onClick = async () => {
    if (canInstall) {
      setInstalled(await install());
      setHelpVisible(false);
    } else {
      setHelpVisible((visible) => !visible);
    }
  };
  return <span className="pwa-install-wrap">
    <button type="button" className={`pwa-install-button ${className}`} onClick={onClick} aria-label="Install Comback" aria-expanded={helpVisible}>
      {installed ? <Check size={15} /> : <Download size={15} />}
      {!iconOnly && <span>{installed ? "Installed" : "Install app"}</span>}
    </button>
    {helpVisible && <span className="pwa-install-help" role="status">Use your browser menu and choose “Install app” or “Add to Home Screen”.</span>}
  </span>;
}

export function PwaNetworkStatus() {
  const { online } = usePwa();
  return <span className={`pwa-network-status ${online ? "online" : "offline"}`} role="status" aria-live="polite">
    {online ? <Wifi size={13} /> : <WifiOff size={13} />}
    <span>{online ? "Online" : "Offline"}</span>
  </span>;
}
