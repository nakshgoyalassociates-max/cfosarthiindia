import React, { useState } from "react";
import {
  Monitor,
  Download,
  Share2,
  CheckCircle2,
  X,
  ExternalLink,
  Laptop,
  Smartphone,
  ShieldCheck,
  Copy,
  Check,
  HardDrive,
} from "lucide-react";

interface DesktopInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
  onDownloadShortcut: () => void;
  onDownloadDesktopEntry: () => void;
}

export const DesktopInstallModal: React.FC<DesktopInstallModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
  onDownloadShortcut,
  onDownloadDesktopEntry,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeInstructionTab, setActiveInstructionTab] = useState<"windows" | "mac" | "mobile">(
    "windows",
  );
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== "undefined" ? window.location.href : "";

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNativeInstall = async () => {
    setInstalling(true);
    try {
      await onInstall();
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Executive Slate 900 Theme */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Install on Desktop / Download Shortcut
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  PWA Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Run Virtual CFO Suite as a standalone desktop app or paste shortcut on your desktop
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Status Banner */}
          {isInstalled ? (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-900">
                  Application Installed in Standalone Mode
                </p>
                <p className="text-emerald-700 mt-0.5">
                  You are currently running Virtual CFO Suite as an installed progressive web
                  application.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option A: Direct Desktop File Download */}
              <div className="p-4 rounded-xl border-2 border-indigo-100 bg-indigo-50/40 hover:border-indigo-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                      <Download className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Download Desktop File</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Downloads a <strong>.url desktop shortcut</strong> file. Simply drag or paste it
                    right onto your desktop!
                  </p>
                </div>

                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      onDownloadShortcut();
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Windows .URL</span>
                  </button>
                  <button
                    onClick={() => {
                      onDownloadDesktopEntry();
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <HardDrive className="w-3 h-3 text-slate-500" />
                    <span>Download Mac / Linux .desktop</span>
                  </button>
                </div>
              </div>

              {/* Option B: Browser PWA Installation */}
              <div className="p-4 rounded-xl border-2 border-amber-100 bg-amber-50/40 hover:border-amber-300 transition-colors flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                      <Laptop className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">Native PWA Install</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Installs as a borderless native window on your PC/Mac with launch icon pinned to
                    taskbar.
                  </p>
                </div>

                <div className="mt-4">
                  {isInstallable ? (
                    <button
                      onClick={handleNativeInstall}
                      disabled={installing}
                      className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Laptop className="w-3.5 h-3.5" />
                      <span>{installing ? "Installing..." : "Install Standalone App"}</span>
                    </button>
                  ) : (
                    <a
                      href={currentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Open in Full Tab to Install</span>
                    </a>
                  )}
                  <p className="text-[10.5px] text-slate-500 text-center mt-1.5">
                    {isInstallable
                      ? "Chrome / Edge prompt ready"
                      : "Preview mode: open in new tab for browser prompt"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Copy Link Bar */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Direct Application URL</span>
              <span className="text-[11px] text-slate-400">Save to bookmarks or desktop</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 font-mono select-all focus:outline-hidden"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Guided Step-by-Step Instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Installation Instructions By Device
              </h4>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setActiveInstructionTab("windows")}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    activeInstructionTab === "windows"
                      ? "bg-white font-bold text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Windows PC
                </button>
                <button
                  onClick={() => setActiveInstructionTab("mac")}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    activeInstructionTab === "mac"
                      ? "bg-white font-bold text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Mac
                </button>
                <button
                  onClick={() => setActiveInstructionTab("mobile")}
                  className={`px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    activeInstructionTab === "mobile"
                      ? "bg-white font-bold text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            {activeInstructionTab === "windows" && (
              <div className="text-xs space-y-2 text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                <p className="font-semibold text-slate-800">
                  For Google Chrome or Microsoft Edge on Windows:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>
                    <strong>Method 1 (Instant):</strong> Click <em>"Download Windows .URL"</em>{" "}
                    above and move/paste the downloaded file from your Downloads folder straight to
                    your <strong>Desktop</strong>.
                  </li>
                  <li>
                    <strong>Method 2 (Native App):</strong> Open in a browser tab. Look at the top
                    right of your address bar for the{" "}
                    <strong className="text-indigo-600">
                      Install icon (computer with down arrow)
                    </strong>
                    .
                  </li>
                  <li>
                    Alternatively, click the <strong>three dots (⋮)</strong> menu &rarr;{" "}
                    <em>"Save and share"</em> &rarr; <em>"Install Virtual CFO Suite"</em>.
                  </li>
                </ol>
              </div>
            )}

            {activeInstructionTab === "mac" && (
              <div className="text-xs space-y-2 text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                <p className="font-semibold text-slate-800">For Safari / Chrome on macOS:</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>
                    <strong>In Safari (macOS Sonoma+):</strong> Click <strong>File</strong> in the
                    top menu &rarr; choose <em>"Add to Dock"</em>. It will appear on your Dock and
                    Launchpad.
                  </li>
                  <li>
                    <strong>In Chrome on Mac:</strong> Click the <strong>Install</strong> icon in
                    the address bar, or Chrome menu (⋮) &rarr; <em>"Save and share"</em> &rarr;{" "}
                    <em>"Install"</em>.
                  </li>
                </ol>
              </div>
            )}

            {activeInstructionTab === "mobile" && (
              <div className="text-xs space-y-2 text-slate-600 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
                <p className="font-semibold text-slate-800">For Smartphones & Tablets:</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>
                    <strong>iOS Safari:</strong> Tap the <strong>Share</strong> button (box with
                    upward arrow) at the bottom &rarr; scroll down and tap{" "}
                    <em>"Add to Home Screen"</em>.
                  </li>
                  <li>
                    <strong>Android Chrome:</strong> Tap the three dots menu (⋮) &rarr; tap{" "}
                    <em>"Add to Home screen"</em> or <em>"Install app"</em>.
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>CA Verified Secure Web App Manifest Active</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
