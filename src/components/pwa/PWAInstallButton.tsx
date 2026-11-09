import React from "react";
import { Monitor, Download } from "lucide-react";

interface PWAInstallButtonProps {
  onOpenModal: () => void;
  isInstalled?: boolean;
  className?: string;
  variant?: "header" | "pill" | "banner";
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenModal,
  isInstalled = false,
  className = "",
  variant = "header",
}) => {
  if (isInstalled) {
    return null;
  }

  if (variant === "pill") {
    return (
      <button
        id="btn-install-pwa-pill"
        onClick={onOpenModal}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs transition-colors cursor-pointer ${className}`}
        title="Install Desktop App or Download Shortcut"
      >
        <Monitor className="w-3.5 h-3.5" />
        <span>Desktop App</span>
      </button>
    );
  }

  return (
    <button
      id="btn-install-pwa"
      onClick={onOpenModal}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 shadow-2xs transition-colors cursor-pointer group ${className}`}
      title="Install on Desktop / Download Shortcut File"
    >
      <Monitor className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline">Desktop App</span>
      <Download className="w-3 h-3 text-slate-400 group-hover:text-white" />
    </button>
  );
};
