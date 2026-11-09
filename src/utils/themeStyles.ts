import { ColorTheme } from "../types";

export interface ThemeConfig {
  id: ColorTheme;
  name: string;
  accentLabel: string;
  colorDot: string;
  appBackground: string;
  topNavAccent: string;
  heroGradient: string;
  heroBorder: string;
  heroTagBg: string;
  heroTagText: string;
  activeTabClass: string;
  accentColor: string;
  kpiCards: {
    revenue: { bg: string; border: string; iconBg: string; statColor: string; subText: string };
    ebitda: { bg: string; border: string; iconBg: string; statColor: string; subText: string };
    pat: { bg: string; border: string; iconBg: string; statColor: string; subText: string };
    treasury: { bg: string; border: string; iconBg: string; statColor: string; subText: string };
    workingCapital: {
      bg: string;
      border: string;
      iconBg: string;
      statColor: string;
      subText: string;
    };
    compliance: { bg: string; border: string; iconBg: string; statColor: string; subText: string };
  };
  synopsisColumns: {
    statutory: {
      bg: string;
      border: string;
      iconColor: string;
      badgeClass: string;
      titleClass: string;
    };
    workflows: {
      bg: string;
      border: string;
      iconColor: string;
      badgeClass: string;
      titleClass: string;
    };
    financial: {
      bg: string;
      border: string;
      iconColor: string;
      badgeClass: string;
      titleClass: string;
    };
  };
}

export const THEME_CONFIGS: Record<ColorTheme, ThemeConfig> = {
  sapphire: {
    id: "sapphire",
    name: "Classic Sapphire Blue",
    accentLabel: "Sapphire Blue",
    colorDot: "bg-indigo-600",
    appBackground: "bg-slate-50/90",
    topNavAccent: "bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500",
    heroGradient:
      "bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white shadow-md",
    heroBorder: "border-indigo-900/60",
    heroTagBg: "bg-indigo-500/25 border border-indigo-400/30",
    heroTagText: "text-indigo-200",
    activeTabClass:
      "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xs font-semibold",
    accentColor: "indigo",
    kpiCards: {
      revenue: {
        bg: "bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40",
        border: "border-emerald-200/90 hover:border-emerald-300",
        iconBg: "bg-emerald-500 text-white shadow-2xs",
        statColor: "text-emerald-950",
        subText: "text-emerald-700 font-medium",
      },
      ebitda: {
        bg: "bg-gradient-to-br from-indigo-50/90 via-white to-blue-50/40",
        border: "border-indigo-200/90 hover:border-indigo-300",
        iconBg: "bg-indigo-600 text-white shadow-2xs",
        statColor: "text-indigo-950",
        subText: "text-indigo-700 font-medium",
      },
      pat: {
        bg: "bg-gradient-to-br from-sky-50/90 via-white to-blue-50/40",
        border: "border-sky-200/90 hover:border-sky-300",
        iconBg: "bg-sky-600 text-white shadow-2xs",
        statColor: "text-sky-950",
        subText: "text-sky-700 font-medium",
      },
      treasury: {
        bg: "bg-gradient-to-br from-amber-50/90 via-white to-yellow-50/40",
        border: "border-amber-200/90 hover:border-amber-300",
        iconBg: "bg-amber-500 text-white shadow-2xs",
        statColor: "text-amber-950",
        subText: "text-amber-800 font-medium",
      },
      workingCapital: {
        bg: "bg-gradient-to-br from-purple-50/90 via-white to-indigo-50/40",
        border: "border-purple-200/90 hover:border-purple-300",
        iconBg: "bg-purple-600 text-white shadow-2xs",
        statColor: "text-purple-950",
        subText: "text-purple-700 font-medium",
      },
      compliance: {
        bg: "bg-gradient-to-br from-emerald-100/70 via-emerald-50/80 to-teal-50/90",
        border: "border-emerald-300 hover:border-emerald-400",
        iconBg: "bg-emerald-600 text-white shadow-2xs",
        statColor: "text-emerald-950",
        subText: "text-emerald-800 font-medium",
      },
    },
    synopsisColumns: {
      statutory: {
        bg: "bg-gradient-to-br from-indigo-50/60 to-blue-50/30",
        border: "border-indigo-100/90",
        iconColor: "text-indigo-600",
        badgeClass: "bg-indigo-100 text-indigo-800",
        titleClass: "text-indigo-950",
      },
      workflows: {
        bg: "bg-gradient-to-br from-amber-50/60 to-orange-50/30",
        border: "border-amber-100/90",
        iconColor: "text-amber-600",
        badgeClass: "bg-amber-100 text-amber-900",
        titleClass: "text-amber-950",
      },
      financial: {
        bg: "bg-gradient-to-br from-rose-50/60 to-pink-50/30",
        border: "border-rose-100/90",
        iconColor: "text-rose-600",
        badgeClass: "bg-rose-100 text-rose-800",
        titleClass: "text-rose-950",
      },
    },
  },

  emerald: {
    id: "emerald",
    name: "Emerald Prestige & Jade",
    accentLabel: "Emerald Prestige",
    colorDot: "bg-emerald-600",
    appBackground: "bg-emerald-50/30",
    topNavAccent: "bg-gradient-to-r from-emerald-600 via-teal-600 to-lime-500",
    heroGradient:
      "bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 text-white shadow-md",
    heroBorder: "border-emerald-900/60",
    heroTagBg: "bg-emerald-500/25 border border-emerald-400/30",
    heroTagText: "text-emerald-200",
    activeTabClass:
      "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs font-semibold",
    accentColor: "emerald",
    kpiCards: {
      revenue: {
        bg: "bg-gradient-to-br from-emerald-50 via-white to-teal-50/40",
        border: "border-emerald-200 hover:border-emerald-300",
        iconBg: "bg-emerald-600 text-white",
        statColor: "text-emerald-950",
        subText: "text-emerald-700 font-medium",
      },
      ebitda: {
        bg: "bg-gradient-to-br from-teal-50 via-white to-emerald-50/40",
        border: "border-teal-200 hover:border-teal-300",
        iconBg: "bg-teal-600 text-white",
        statColor: "text-teal-950",
        subText: "text-teal-700 font-medium",
      },
      pat: {
        bg: "bg-gradient-to-br from-green-50 via-white to-lime-50/30",
        border: "border-green-200 hover:border-green-300",
        iconBg: "bg-green-600 text-white",
        statColor: "text-green-950",
        subText: "text-green-700 font-medium",
      },
      treasury: {
        bg: "bg-gradient-to-br from-amber-50 via-white to-yellow-50/30",
        border: "border-amber-200 hover:border-amber-300",
        iconBg: "bg-amber-600 text-white",
        statColor: "text-amber-950",
        subText: "text-amber-800 font-medium",
      },
      workingCapital: {
        bg: "bg-gradient-to-br from-cyan-50 via-white to-teal-50/30",
        border: "border-cyan-200 hover:border-cyan-300",
        iconBg: "bg-cyan-600 text-white",
        statColor: "text-cyan-950",
        subText: "text-cyan-700 font-medium",
      },
      compliance: {
        bg: "bg-gradient-to-br from-emerald-100/80 via-teal-50 to-white",
        border: "border-emerald-300 hover:border-emerald-400",
        iconBg: "bg-emerald-700 text-white",
        statColor: "text-emerald-950",
        subText: "text-emerald-800 font-medium",
      },
    },
    synopsisColumns: {
      statutory: {
        bg: "bg-gradient-to-br from-emerald-50/70 to-teal-50/40",
        border: "border-emerald-100",
        iconColor: "text-emerald-600",
        badgeClass: "bg-emerald-100 text-emerald-800",
        titleClass: "text-emerald-950",
      },
      workflows: {
        bg: "bg-gradient-to-br from-amber-50/70 to-yellow-50/40",
        border: "border-amber-100",
        iconColor: "text-amber-600",
        badgeClass: "bg-amber-100 text-amber-900",
        titleClass: "text-amber-950",
      },
      financial: {
        bg: "bg-gradient-to-br from-rose-50/70 to-red-50/40",
        border: "border-rose-100",
        iconColor: "text-rose-600",
        badgeClass: "bg-rose-100 text-rose-800",
        titleClass: "text-rose-950",
      },
    },
  },

  amethyst: {
    id: "amethyst",
    name: "Imperial Amethyst & Ruby",
    accentLabel: "Imperial Violet",
    colorDot: "bg-purple-600",
    appBackground: "bg-purple-50/20",
    topNavAccent: "bg-gradient-to-r from-purple-600 via-violet-600 to-rose-500",
    heroGradient:
      "bg-gradient-to-r from-slate-950 via-purple-950 to-slate-900 text-white shadow-md",
    heroBorder: "border-purple-900/60",
    heroTagBg: "bg-purple-500/25 border border-purple-400/30",
    heroTagText: "text-purple-200",
    activeTabClass:
      "bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-xs font-semibold",
    accentColor: "purple",
    kpiCards: {
      revenue: {
        bg: "bg-gradient-to-br from-emerald-50 via-white to-teal-50/40",
        border: "border-emerald-200 hover:border-emerald-300",
        iconBg: "bg-emerald-600 text-white",
        statColor: "text-emerald-950",
        subText: "text-emerald-700 font-medium",
      },
      ebitda: {
        bg: "bg-gradient-to-br from-purple-50 via-white to-violet-50/40",
        border: "border-purple-200 hover:border-purple-300",
        iconBg: "bg-purple-600 text-white",
        statColor: "text-purple-950",
        subText: "text-purple-700 font-medium",
      },
      pat: {
        bg: "bg-gradient-to-br from-fuchsia-50 via-white to-pink-50/40",
        border: "border-fuchsia-200 hover:border-fuchsia-300",
        iconBg: "bg-fuchsia-600 text-white",
        statColor: "text-fuchsia-950",
        subText: "text-fuchsia-700 font-medium",
      },
      treasury: {
        bg: "bg-gradient-to-br from-amber-50 via-white to-yellow-50/30",
        border: "border-amber-200 hover:border-amber-300",
        iconBg: "bg-amber-600 text-white",
        statColor: "text-amber-950",
        subText: "text-amber-800 font-medium",
      },
      workingCapital: {
        bg: "bg-gradient-to-br from-violet-50 via-white to-purple-50/30",
        border: "border-violet-200 hover:border-violet-300",
        iconBg: "bg-violet-600 text-white",
        statColor: "text-violet-950",
        subText: "text-violet-700 font-medium",
      },
      compliance: {
        bg: "bg-gradient-to-br from-purple-100/80 via-fuchsia-50 to-white",
        border: "border-purple-300 hover:border-purple-400",
        iconBg: "bg-purple-700 text-white",
        statColor: "text-purple-950",
        subText: "text-purple-800 font-medium",
      },
    },
    synopsisColumns: {
      statutory: {
        bg: "bg-gradient-to-br from-purple-50/70 to-violet-50/40",
        border: "border-purple-100",
        iconColor: "text-purple-600",
        badgeClass: "bg-purple-100 text-purple-800",
        titleClass: "text-purple-950",
      },
      workflows: {
        bg: "bg-gradient-to-br from-amber-50/70 to-orange-50/40",
        border: "border-amber-100",
        iconColor: "text-amber-600",
        badgeClass: "bg-amber-100 text-amber-900",
        titleClass: "text-amber-950",
      },
      financial: {
        bg: "bg-gradient-to-br from-rose-50/70 to-red-50/40",
        border: "border-rose-100",
        iconColor: "text-rose-600",
        badgeClass: "bg-rose-100 text-rose-800",
        titleClass: "text-rose-950",
      },
    },
  },

  oceanic: {
    id: "oceanic",
    name: "Oceanic Azure & Cyan",
    accentLabel: "Oceanic Azure",
    colorDot: "bg-sky-500",
    appBackground: "bg-sky-50/20",
    topNavAccent: "bg-gradient-to-r from-sky-500 via-blue-600 to-teal-500",
    heroGradient: "bg-gradient-to-r from-slate-950 via-sky-950 to-slate-900 text-white shadow-md",
    heroBorder: "border-sky-900/60",
    heroTagBg: "bg-sky-500/25 border border-sky-400/30",
    heroTagText: "text-sky-200",
    activeTabClass: "bg-gradient-to-r from-sky-600 to-blue-700 text-white shadow-xs font-semibold",
    accentColor: "sky",
    kpiCards: {
      revenue: {
        bg: "bg-gradient-to-br from-emerald-50 via-white to-teal-50/40",
        border: "border-emerald-200 hover:border-emerald-300",
        iconBg: "bg-emerald-600 text-white",
        statColor: "text-emerald-950",
        subText: "text-emerald-700 font-medium",
      },
      ebitda: {
        bg: "bg-gradient-to-br from-sky-50 via-white to-blue-50/40",
        border: "border-sky-200 hover:border-sky-300",
        iconBg: "bg-sky-600 text-white",
        statColor: "text-sky-950",
        subText: "text-sky-700 font-medium",
      },
      pat: {
        bg: "bg-gradient-to-br from-cyan-50 via-white to-teal-50/40",
        border: "border-cyan-200 hover:border-cyan-300",
        iconBg: "bg-cyan-600 text-white",
        statColor: "text-cyan-950",
        subText: "text-cyan-700 font-medium",
      },
      treasury: {
        bg: "bg-gradient-to-br from-amber-50 via-white to-yellow-50/30",
        border: "border-amber-200 hover:border-amber-300",
        iconBg: "bg-amber-600 text-white",
        statColor: "text-amber-950",
        subText: "text-amber-800 font-medium",
      },
      workingCapital: {
        bg: "bg-gradient-to-br from-blue-50 via-white to-indigo-50/30",
        border: "border-blue-200 hover:border-blue-300",
        iconBg: "bg-blue-600 text-white",
        statColor: "text-blue-950",
        subText: "text-blue-700 font-medium",
      },
      compliance: {
        bg: "bg-gradient-to-br from-sky-100/80 via-cyan-50 to-white",
        border: "border-sky-300 hover:border-sky-400",
        iconBg: "bg-sky-700 text-white",
        statColor: "text-sky-950",
        subText: "text-sky-800 font-medium",
      },
    },
    synopsisColumns: {
      statutory: {
        bg: "bg-gradient-to-br from-sky-50/70 to-blue-50/40",
        border: "border-sky-100",
        iconColor: "text-sky-600",
        badgeClass: "bg-sky-100 text-sky-800",
        titleClass: "text-sky-950",
      },
      workflows: {
        bg: "bg-gradient-to-br from-amber-50/70 to-orange-50/40",
        border: "border-amber-100",
        iconColor: "text-amber-600",
        badgeClass: "bg-amber-100 text-amber-900",
        titleClass: "text-amber-950",
      },
      financial: {
        bg: "bg-gradient-to-br from-rose-50/70 to-red-50/40",
        border: "border-rose-100",
        iconColor: "text-rose-600",
        badgeClass: "bg-rose-100 text-rose-800",
        titleClass: "text-rose-950",
      },
    },
  },
};
