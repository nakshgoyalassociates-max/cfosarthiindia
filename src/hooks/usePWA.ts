import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" && typeof navigator.onLine === "boolean"
      ? navigator.onLine
      : true,
  );
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Detect standalone mode (already installed PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");
    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleDevice);

    // Listen for beforeinstallprompt (Chromium / Edge / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    // Online / Offline tracking
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // In dev / preview environment, unregister any service worker to avoid stale chunk caching
    if (import.meta.env.DEV && "serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const reg of registrations) {
          reg.unregister().catch(() => {});
        }
      });
      if (typeof caches !== "undefined") {
        caches.keys().then((keys) => {
          for (const key of keys) {
            caches.delete(key).catch(() => {});
          }
        });
      }
    } else if (
      "serviceWorker" in navigator &&
      (typeof process === "undefined" || (process as any)?.env?.NODE_ENV !== "test")
    ) {
      // Register Service Worker in production
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Check for worker updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New update available, auto activate
                  installingWorker.postMessage({ type: "SKIP_WAITING" });
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("[SW] Registration note:", err);
        });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Trigger browser's native PWA installation prompt
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error("[PWA] Install prompt failed:", err);
    }
    return false;
  }, [deferredPrompt]);

  // Generate and download Windows Desktop Internet Shortcut (.url)
  // This is what users literally drag & paste onto their desktop
  const downloadDesktopShortcut = useCallback(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const shortcutContent = [
      "[InternetShortcut]",
      `URL=${origin}`,
      `IconFile=${origin}/favicon.ico`,
      "IconIndex=0",
      "HotKey=0",
      "[{000214A0-0000-0000-C000-000000000046}]",
      "Prop3=19,11",
      "[Desktop]",
      "Name=Virtual CFO Suite",
      "Comment=MIS Insights Hub & Virtual CFO Practice Command Center",
      "",
    ].join("\r\n");

    const blob = new Blob([shortcutContent], { type: "application/internet-shortcut" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Virtual CFO Suite.url";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  // Generate and download Linux/Mac Desktop Launcher (.desktop)
  const downloadDesktopEntry = useCallback(() => {
    if (typeof window === "undefined") return;
    const origin = window.location.origin;
    const desktopContent = [
      "[Desktop Entry]",
      "Version=1.0",
      "Type=Application",
      "Name=Virtual CFO Suite",
      "GenericName=Virtual CFO Management Suite",
      "Comment=Statutory compliances, CFO sign-off review queue, financial MIS, and cash runway tracking",
      `Exec=xdg-open ${origin}`,
      "Icon=office-finance",
      "Terminal=false",
      "Categories=Office;Finance;",
      "Keywords=CFO;MIS;Compliance;Finance;Tax;",
      "StartupNotify=true",
      "",
    ].join("\n");

    const blob = new Blob([desktopContent], { type: "application/x-desktop" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Virtual CFO Suite.desktop";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isOnline,
    isModalOpen,
    setIsModalOpen,
    installApp,
    downloadDesktopShortcut,
    downloadDesktopEntry,
  };
}
