import React from "react";
import { useApp } from "../context/AppContext";
import { Role, ColorTheme } from "../types";
import { THEME_CONFIGS } from "../utils/themeStyles";
import { PWAInstallButton } from "./pwa/PWAInstallButton";
import {
  Building2,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  CheckSquare,
  BarChart3,
  CalendarClock,
  RotateCcw,
  LayoutDashboard,
  Lock,
  LogIn,
  ChevronDown,
  Layers,
  Calculator,
  FolderArchive,
  LogOut,
  User,
  Palette,
  UserPlus,
  Bell,
  MessageSquare,
} from "lucide-react";
import { extractAllReminderItems } from "../utils/reminderEngine";

interface NavbarProps {
  onOpenInstallModal?: () => void;
  isInstalled?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenInstallModal, isInstalled = false }) => {
  const {
    role,
    setRole,
    activeTab,
    setActiveTab,
    clientProfile,
    stats,
    resetToDefaultData,
    currentUser,
    logout,
    setIsAuthModalOpen,
    companies,
    selectedCompanyId,
    setSelectedCompanyId,
    cfoViewMode,
    setCfoViewMode,
    criticalDelayedItems,
    hiddenItemsRegistry,
    userAccounts,
    switchActiveUser,
    setIsInviteModalOpen,
    effectivePermissions,
    colorTheme,
    setColorTheme,
    openReminderCenter,
    compliances,
    taxAssessments,
    legalCases,
    licenses,
    sops,
  } = useApp();

  const reminderItems = React.useMemo(() => {
    return extractAllReminderItems({
      compliances,
      taxAssessments,
      legalCases,
      licenses,
      sops,
      companies,
      userAccounts,
      clientProfile,
      companyFilter: selectedCompanyId,
      dueWindowDays: 7,
    });
  }, [
    compliances,
    taxAssessments,
    legalCases,
    licenses,
    sops,
    companies,
    userAccounts,
    clientProfile,
    selectedCompanyId,
  ]);

  const criticalReminderCount = React.useMemo(
    () => reminderItems.filter((i) => i.severity === "critical_overdue").length,
    [reminderItems],
  );
  const overdueReminderCount = React.useMemo(
    () => reminderItems.filter((i) => i.severity === "overdue").length,
    [reminderItems],
  );

  const theme = THEME_CONFIGS[colorTheme] || THEME_CONFIGS.sapphire;
  const clientTeamMembers = userAccounts.filter((u) => u.role === "client_team");
  const [isThemePickerOpen, setIsThemePickerOpen] = React.useState(false);

  const availableThemes: { id: ColorTheme; label: string; dot: string }[] = [
    { id: "sapphire", label: "Sapphire Indigo", dot: "bg-indigo-600" },
    { id: "emerald", label: "Emerald Prestige", dot: "bg-emerald-600" },
    { id: "amethyst", label: "Amethyst Violet", dot: "bg-purple-600" },
    { id: "oceanic", label: "Oceanic Teal", dot: "bg-cyan-600" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Dynamic Top Brand Accent Bar */}
      <div className={`h-1 w-full ${theme.topNavAccent}`} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Header: Company Identity & Role / Auth Bar */}
        <div className="py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-100">
          {/* Company Profile & Company Selector */}
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-2xs shrink-0 ${
                role === "cfo"
                  ? "bg-indigo-600"
                  : role === "client"
                    ? "bg-emerald-600"
                    : "bg-sky-600"
              }`}
            >
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {role === "cfo" ? (
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => {
                      setSelectedCompanyId(e.target.value);
                      setCfoViewMode("single_company");
                      setActiveTab("dashboard");
                    }}
                    className="font-bold text-slate-900 text-sm tracking-tight bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 cursor-pointer focus:ring-1 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} ({c.legalEntity})
                      </option>
                    ))}
                  </select>
                ) : (
                  <h2 className="font-bold text-slate-900 text-sm tracking-tight">
                    {clientProfile.companyName}
                  </h2>
                )}

                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                  <span aria-hidden="true">·</span>
                  <span>FY {clientProfile.financialYear}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono text-slate-600">{clientProfile.gstin}</span>
                  <span aria-hidden="true">·</span>
                  <span>CFO: {clientProfile.cfoName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* User Profile & Verified Role */}
          <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
            {/* Verified Role Badge */}
            {role === "cfo" ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80 text-xs font-semibold text-indigo-900 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                <span>Virtual CFO</span>
              </div>
            ) : role === "client" ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-900 shadow-2xs">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Client Executive</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/80 text-xs font-semibold text-sky-900 shadow-2xs">
                <Users className="w-3.5 h-3.5 text-sky-600" />
                <span>Finance Team</span>
              </div>
            )}



            {/* Active User Account Profile */}
            <button
              id="nav-btn-account-profile"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200/70 border border-slate-200/80 transition-colors text-xs cursor-pointer"
              title={`Account Profile: ${currentUser.name} (${currentUser.roleTitle})`}
            >
              <div className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                {currentUser.avatar}
              </div>
              <span className="font-semibold text-slate-800 max-w-[110px] truncate hidden sm:inline">
                {currentUser.name}
              </span>
            </button>

            {/* Log Out Button */}
            <button
              id="nav-btn-logout"
              onClick={() => logout()}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>



            {/* Automated Reminder Center Button (Mail & WhatsApp with CC to CFO & Client) */}
            <button
              type="button"
              onClick={() => openReminderCenter("all")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border shadow-2xs ${
                criticalReminderCount > 0
                  ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100 ring-1 ring-rose-200"
                  : overdueReminderCount > 0
                    ? "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
              }`}
              title="Automated Reminders (Mail & WhatsApp) with CC to CFO and Client Promoter"
            >
              <Bell
                className={`w-3.5 h-3.5 ${
                  criticalReminderCount > 0
                    ? "text-rose-600 animate-pulse"
                    : overdueReminderCount > 0
                      ? "text-amber-600"
                      : "text-indigo-600"
                }`}
              />
              <span className="hidden sm:inline">Reminders</span>
              {reminderItems.length > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full font-mono ${
                    criticalReminderCount > 0
                      ? "bg-rose-600 text-white"
                      : overdueReminderCount > 0
                        ? "bg-amber-500 text-white"
                        : "bg-indigo-600 text-white"
                  }`}
                >
                  {reminderItems.length}
                </span>
              )}
            </button>

            {onOpenInstallModal && (
              <PWAInstallButton onOpenModal={onOpenInstallModal} isInstalled={isInstalled} />
            )}

            <button
              onClick={() => {
                if (window.confirm("Reset sample data to initial state?")) {
                  resetToDefaultData();
                }
              }}
              title="Reset sample data"
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center justify-between overflow-x-auto py-1.5 gap-3">
          <nav className="flex items-center gap-1">
            {role !== "client_team" && (
              <button
                type="button"
                id="nav-tab-dashboard"
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "dashboard"
                    ? theme.activeTabClass
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>
                  {role === "cfo"
                    ? "CFO Dashboard"
                    : "Executive Dashboard"}
                </span>
                {role === "cfo" && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${
                      activeTab === "dashboard"
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {clientProfile.companyName.split(" ")[0]}
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              id="nav-tab-compliances"
              onClick={() => setActiveTab("compliances")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "compliances"
                  ? theme.activeTabClass
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <CalendarClock className="w-3.5 h-3.5" />
              <span>Compliances</span>
              <span
                className={`font-mono text-[11px] ${activeTab === "compliances" ? "text-white/80" : "text-slate-400"}`}
              >
                {stats.fullyCompletedCompliances}/{stats.totalCompliances}
              </span>
            </button>

            <button
              type="button"
              id="nav-tab-mis"
              onClick={() => setActiveTab("mis")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === "mis"
                  ? theme.activeTabClass
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Financial MIS</span>
            </button>

            {role !== "client" && (
              <button
                type="button"
                id="nav-tab-repository"
                onClick={() => setActiveTab("repository")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "repository"
                    ? theme.activeTabClass
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>Repository</span>
              </button>
            )}

            {role === "cfo" && (
              <button
                type="button"
                id="nav-tab-admin"
                onClick={() => setActiveTab("admin")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === "admin"
                    ? theme.activeTabClass
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Admin & Governance</span>
                {hiddenItemsRegistry.length > 0 && (
                  <span
                    className={`font-mono text-[10px] ${activeTab === "admin" ? "text-white/80" : "text-slate-400"}`}
                  >
                    ({hiddenItemsRegistry.length})
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Client in-page section jumps */}
          {role === "client" && (
            <div className="flex items-center gap-1 text-xs shrink-0 overflow-x-auto">
              <a
                href="#overview"
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-[11px] transition-colors whitespace-nowrap"
              >
                Overview
              </a>
              <a
                href="#executive-report"
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-[11px] transition-colors whitespace-nowrap"
              >
                CFO Summary
              </a>
              <a
                href="#critical-pendencies"
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-[11px] transition-colors whitespace-nowrap"
              >
                Pendencies
              </a>
              <a
                href="#mis-synopsis"
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-[11px] transition-colors whitespace-nowrap"
              >
                MIS Synopsis
              </a>
              <a
                href="#health-charts"
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-[11px] transition-colors whitespace-nowrap"
              >
                Health
              </a>
              <a
                href="#financial-ratios"
                className="px-2.5 py-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium text-[11px] transition-colors whitespace-nowrap"
              >
                Ratios
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
