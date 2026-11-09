import React, { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppProvider, useApp } from "./context/AppContext";
import { usePWA } from "./hooks/usePWA";
import { Navbar } from "./components/Navbar";
import { CfoDashboard } from "./components/cfo/CfoDashboard";
import { ClientDashboard } from "./components/client/ClientDashboard";
import { ComplianceMasterTab } from "./components/compliances/ComplianceMasterTab";
import { ActionFlowTab } from "./components/actions/ActionFlowTab";
import { FinancialMisTab } from "./components/mis/FinancialMisTab";
import { AdminPanel } from "./components/admin/AdminPanel";
import { RepositoryTab } from "./components/repository/RepositoryTab";
import { NewActionModal } from "./components/modals/NewActionModal";
import { AuthModal } from "./components/auth/AuthModal";
import { InviteUserModal } from "./components/admin/InviteUserModal";
import { ComplianceDetailModal } from "./components/modals/ComplianceDetailModal";
import { UploadComplianceProofModal } from "./components/compliances/UploadComplianceProofModal";
import { ViewComplianceProofModal } from "./components/compliances/ViewComplianceProofModal";
import { DesktopInstallModal } from "./components/pwa/DesktopInstallModal";
import { AutomatedReminderCenterModal } from "./components/modals/AutomatedReminderCenterModal";
import { ReminderPreviewModal } from "./components/modals/ReminderPreviewModal";
import { OfflineIndicator } from "./components/pwa/OfflineIndicator";
import { BackendNotConfigured } from "./components/common/BackendNotConfigured";
import { isSupabaseConfigured } from "./integrations/supabase/client";
import { THEME_CONFIGS } from "./utils/themeStyles";
import { SupabaseMigrationModal } from "./components/modals/SupabaseMigrationModal";
import {
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Monitor,
  Download,
  Database,
} from "lucide-react";

const MainLayout: React.FC = () => {
  const {
    isAuthenticated,
    isAuthLoading,
    activeTab,
    role,
    toastMessage,
    clientProfile,
    complianceProofModalTarget,
    closeComplianceProofModal,
    complianceProofViewTarget,
    closeComplianceProofView,
    openComplianceProofModal,
    colorTheme,
    isReminderCenterOpen,
    setIsReminderCenterOpen,
    reminderCenterDefaultSource,
    reminderPreviewItem,
    setReminderPreviewItem,
  } = useApp();

  const [isMigrationModalOpen, setIsMigrationModalOpen] = React.useState(false);

  const theme = THEME_CONFIGS[colorTheme] || THEME_CONFIGS.sapphire;

  const navigate = useNavigate();

  const {
    isInstallable,
    isInstalled,
    isIOS,
    isOnline,
    isModalOpen,
    setIsModalOpen,
    installApp,
    downloadDesktopShortcut,
    downloadDesktopEntry,
  } = usePWA();

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      void navigate({ to: "/auth" });
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <span>Verifying session &amp; role access...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const renderContent = () => {
    // 1. Client Team: Access to Compliances (including Assigned Tasks), Financial MIS, and Repository
    if (role === "client_team") {
      if (activeTab === "mis") return <FinancialMisTab />;
      if (activeTab === "action_flow" || activeTab === "actions") {
        return <ComplianceMasterTab initialCategory="ASSIGNED_TASKS" />;
      }
      if (activeTab === "repository") return <RepositoryTab />;
      return <ComplianceMasterTab />;
    }

    // 2. Client: Comprehensive all-in-one executive dashboard with direct access to Compliances & Repository
    if (role === "client") {
      if (activeTab === "compliances") return <ComplianceMasterTab />;
      if (activeTab === "action_flow" || activeTab === "actions") {
        return <ComplianceMasterTab initialCategory="ASSIGNED_TASKS" />;
      }
      if (activeTab === "mis") return <FinancialMisTab />;
      if (activeTab === "repository") return <RepositoryTab />;
      return <ClientDashboard />;
    }

    // 3. CFO: Can view and amend all tabs + Admin Panel + Repository
    if (activeTab === "dashboard") return <CfoDashboard />;
    if (activeTab === "compliances") return <ComplianceMasterTab />;
    if (activeTab === "action_flow" || activeTab === "actions") {
      return <ComplianceMasterTab initialCategory="ASSIGNED_TASKS" />;
    }
    if (activeTab === "mis") return <FinancialMisTab />;
    if (activeTab === "repository") return <RepositoryTab />;
    if (activeTab === "admin") return <AdminPanel />;
    return <CfoDashboard />;
  };

  return (
    <div
      className={`min-h-screen ${theme.appBackground} text-slate-900 flex flex-col font-sans antialiased relative transition-colors duration-200`}
    >
      {/* Subtle Ambient Colorful Background Glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-40 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.18),rgba(255,255,255,0))]"
        aria-hidden="true"
      />

      {/* Preview Sandbox Notification Banner */}
      {!isSupabaseConfigured && (
        <div className="relative z-50 bg-slate-900 border-b border-amber-500/30 text-slate-300 text-xs py-2 px-4 flex items-center justify-between shadow-xs flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[10px] uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full">
              Preview Sandbox
            </span>
            <span className="text-slate-300">
              Operating with local client &amp; MIS data. Migration SQL prepared with 243 sample records.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsMigrationModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shadow-2xs transition-colors cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Open &amp; Copy Migration SQL</span>
          </button>
        </div>
      )}

      {/* Navigation Bar with Role and Tab Controls */}
      <div className="relative z-40">
        <Navbar onOpenInstallModal={() => setIsModalOpen(true)} isInstalled={isInstalled} />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 relative z-10">
        {renderContent()}
      </main>

      {/* Modals */}
      <NewActionModal />
      <AuthModal />
      <InviteUserModal />
      <ComplianceDetailModal />
      <UploadComplianceProofModal
        isOpen={!!complianceProofModalTarget}
        onClose={closeComplianceProofModal}
        compliance={complianceProofModalTarget}
      />
      <ViewComplianceProofModal
        isOpen={!!complianceProofViewTarget}
        onClose={closeComplianceProofView}
        compliance={complianceProofViewTarget?.compliance || null}
        proof={complianceProofViewTarget?.proof || null}
        onReplaceProof={() => {
          if (complianceProofViewTarget) {
            const comp = complianceProofViewTarget.compliance;
            closeComplianceProofView();
            openComplianceProofModal(comp);
          }
        }}
      />
      <DesktopInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={installApp}
        onDownloadShortcut={downloadDesktopShortcut}
        onDownloadDesktopEntry={downloadDesktopEntry}
      />
      <AutomatedReminderCenterModal
        isOpen={isReminderCenterOpen}
        onClose={() => setIsReminderCenterOpen(false)}
        defaultSource={reminderCenterDefaultSource}
      />
      <ReminderPreviewModal
        isOpen={!!reminderPreviewItem}
        item={reminderPreviewItem}
        onClose={() => setReminderPreviewItem(null)}
      />
      <SupabaseMigrationModal
        isOpen={isMigrationModalOpen}
        onClose={() => setIsMigrationModalOpen(false)}
      />

      {/* Connectivity Status */}
      <OfflineIndicator isOnline={isOnline} />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 text-xs font-medium max-w-md bg-slate-900 text-slate-100 border-slate-800">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-10 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800">Virtual CFO Suite</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-600 font-medium">{clientProfile.companyName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-500">GSTIN: {clientProfile.gstin}</span>
          </div>

          <div className="flex items-center gap-3 text-slate-500 flex-wrap">
            <span>
              CFO: <strong className="text-slate-700 font-semibold">{clientProfile.cfoName}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop App</span>
            </button>
            <span aria-hidden="true">·</span>
            <span>FY {clientProfile.financialYear}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function AppShell() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
