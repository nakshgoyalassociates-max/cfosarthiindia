import React, { useState } from "react";
import {
  ReminderItem,
  generateWhatsAppReminderMessage,
  generateWhatsAppUrl,
  generateEmailReminder,
  recordReminderDispatchLog,
} from "../../utils/reminderEngine";
import { useApp } from "../../context/AppContext";
import {
  X,
  Mail,
  MessageSquare,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Send,
  ExternalLink,
  Copy,
  Check,
  Building,
  User,
  ShieldCheck,
  Users,
} from "lucide-react";

interface ReminderPreviewModalProps {
  item: ReminderItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatched?: () => void;
}

export const ReminderPreviewModal: React.FC<ReminderPreviewModalProps> = ({
  item,
  isOpen,
  onClose,
  onDispatched,
}) => {
  const { showToast } = useApp();
  const [activeChannelTab, setActiveChannelTab] = useState<"whatsapp" | "email">("whatsapp");
  const [copiedText, setCopiedText] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen || !item) return null;

  const isCritical = item.isCriticalOverdue;
  const isOverdue = item.severity === "overdue" || isCritical;

  const whatsappMessage = generateWhatsAppReminderMessage(item);
  const emailPayload = generateEmailReminder(item);
  const whatsappUrl = generateWhatsAppUrl(item.assignedUser.phone, whatsappMessage);

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(whatsappMessage);
    setCopiedText(true);
    showToast("WhatsApp reminder text copied to clipboard!");
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(emailPayload.plainText);
    setCopiedText(true);
    showToast("Email text copied to clipboard!");
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, "_blank");
    recordReminderDispatchLog({
      reminderItemId: item.id,
      itemTitle: item.title,
      companyName: item.companyName,
      sourceLabel: item.sourceLabel,
      severity: item.severity,
      channel: "whatsapp",
      primaryRecipient: `${item.assignedUser.name} (${item.assignedUser.phone || item.assignedUser.email})`,
      cfoCopied: `${item.cfoCopy.name} (${item.cfoCopy.email})`,
      clientCopied: isCritical && item.clientCopy ? `${item.clientCopy.name} (${item.clientCopy.email})` : undefined,
      status: "sent_external",
      messageExcerpt: whatsappMessage.substring(0, 150) + "...",
    });
    showToast("Opened WhatsApp Web & logged dispatch");
    onDispatched?.();
  };

  const handleOpenEmailClient = () => {
    window.location.href = emailPayload.mailtoUrl;
    recordReminderDispatchLog({
      reminderItemId: item.id,
      itemTitle: item.title,
      companyName: item.companyName,
      sourceLabel: item.sourceLabel,
      severity: item.severity,
      channel: "email",
      primaryRecipient: `${item.assignedUser.name} (${item.assignedUser.email})`,
      cfoCopied: `${item.cfoCopy.name} (${item.cfoCopy.email})`,
      clientCopied: isCritical && item.clientCopy ? `${item.clientCopy.name} (${item.clientCopy.email})` : undefined,
      status: "sent_external",
      messageExcerpt: emailPayload.subject,
    });
    showToast("Opened default mail client with To, CC CFO & Client pre-filled");
    onDispatched?.();
  };

  const handleDirectSimulateDispatch = (channel: "email" | "whatsapp" | "both") => {
    setIsSending(true);
    setTimeout(() => {
      recordReminderDispatchLog({
        reminderItemId: item.id,
        itemTitle: item.title,
        companyName: item.companyName,
        sourceLabel: item.sourceLabel,
        severity: item.severity,
        channel,
        primaryRecipient: `${item.assignedUser.name} (${item.assignedUser.email || item.assignedUser.phone})`,
        cfoCopied: `${item.cfoCopy.name} (${item.cfoCopy.email})`,
        clientCopied: isCritical && item.clientCopy ? `${item.clientCopy.name} (${item.clientCopy.email})` : undefined,
        status: "delivered",
        messageExcerpt: channel === "whatsapp" ? whatsappMessage.substring(0, 140) : emailPayload.subject,
      });
      setIsSending(false);
      showToast(
        channel === "both"
          ? `Dispatched Email & WhatsApp reminders (CC CFO${isCritical ? " + CC Client" : ""})`
          : `Dispatched ${channel.toUpperCase()} reminder (CC CFO${isCritical ? " + CC Client" : ""})`,
      );
      onDispatched?.();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`px-5 py-4 flex items-center justify-between text-white ${
            isCritical
              ? "bg-rose-700"
              : isOverdue
                ? "bg-amber-600"
                : "bg-indigo-700"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              {isCritical ? (
                <ShieldAlert className="w-5 h-5" />
              ) : isOverdue ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20">
                  {isCritical
                    ? "Critical Overdue (Client Copied)"
                    : isOverdue
                      ? "Overdue Reminder"
                      : "Due Soon Reminder"}
                </span>
                <span className="text-xs text-white/80">{item.sourceLabel}</span>
              </div>
              <h3 className="font-bold text-base sm:text-lg leading-tight mt-0.5 truncate max-w-lg">
                {item.title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Escalation Routing Info Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Escalation Matrix &amp; Notification Recipients</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {/* Primary To */}
            <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500 mb-1">
                <span>PRIMARY ASSIGNEE (TO)</span>
                <User className="w-3 h-3 text-indigo-600" />
              </div>
              <p className="font-bold text-slate-900 truncate">{item.assignedUser.name}</p>
              <p className="text-[11px] text-slate-500 font-mono truncate">{item.assignedUser.email}</p>
              {item.assignedUser.phone && (
                <p className="text-[10px] text-slate-400 font-mono">{item.assignedUser.phone}</p>
              )}
            </div>

            {/* CC CFO (Always) */}
            <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-[10px] font-semibold text-indigo-800 mb-1">
                <span>COPY TO CFO (CC)</span>
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
              </div>
              <p className="font-bold text-indigo-950 truncate">{item.cfoCopy.name}</p>
              <p className="text-[11px] text-indigo-700 font-mono truncate">{item.cfoCopy.email}</p>
              <span className="inline-block mt-0.5 text-[9.5px] font-semibold text-indigo-600 bg-white px-1.5 py-0.2 rounded border border-indigo-100">
                Always Notified
              </span>
            </div>

            {/* CC Client Promoter (If Critical Overdue) */}
            <div
              className={`p-2.5 rounded-xl shadow-2xs ${
                isCritical
                  ? "bg-rose-50 border border-rose-300 ring-2 ring-rose-200"
                  : "bg-slate-100/70 border border-slate-200 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                <span className={isCritical ? "text-rose-800 font-bold" : "text-slate-500"}>
                  {isCritical ? "COPY TO CLIENT (CC) 🚨" : "CLIENT ESCALATION"}
                </span>
                <Building className={`w-3 h-3 ${isCritical ? "text-rose-600" : "text-slate-400"}`} />
              </div>
              {item.clientCopy ? (
                <>
                  <p className={`font-bold truncate ${isCritical ? "text-rose-950" : "text-slate-700"}`}>
                    {item.clientCopy.name}
                  </p>
                  <p className={`text-[11px] font-mono truncate ${isCritical ? "text-rose-700" : "text-slate-500"}`}>
                    {item.clientCopy.email}
                  </p>
                  <span
                    className={`inline-block mt-0.5 text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                      isCritical
                        ? "bg-rose-600 text-white animate-pulse"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {isCritical ? "CRITICAL ESCALATION ACTIVE" : "Not Copied (Normal)"}
                  </span>
                </>
              ) : (
                <p className="text-[11px] text-slate-500 italic">No Client Director profile</p>
              )}
            </div>
          </div>
        </div>

        {/* Channel Selection Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveChannelTab("whatsapp")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeChannelTab === "whatsapp"
                ? "bg-white text-emerald-700 border-slate-200 -mb-[1px] shadow-2xs"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp Reminder Preview</span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
              wa.me ready
            </span>
          </button>

          <button
            onClick={() => setActiveChannelTab("email")}
            className={`flex items-center gap-2 px-4 py-2.5 font-bold text-xs rounded-t-xl transition-all cursor-pointer border-t border-x ${
              activeChannelTab === "email"
                ? "bg-white text-indigo-700 border-slate-200 -mb-[1px] shadow-2xs"
                : "text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-200/50"
            }`}
          >
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>Email Reminder Preview</span>
            <span className="text-[10px] font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-semibold">
              To + CC routing
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 max-h-[50vh] overflow-y-auto">
          {activeChannelTab === "whatsapp" ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Message preview as received on WhatsApp:</span>
                <button
                  onClick={handleCopyWhatsApp}
                  className="flex items-center gap-1 text-slate-700 hover:text-slate-950 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>

              {/* Mock WhatsApp Chat Bubble */}
              <div className="p-4 rounded-2xl bg-emerald-950 text-slate-100 font-sans text-xs sm:text-[13px] leading-relaxed shadow-inner border border-emerald-800/60 max-w-2xl mx-auto">
                <div className="whitespace-pre-line font-mono text-[12px] text-emerald-100">
                  {whatsappMessage}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Formatted HTML Email preview:</span>
                <button
                  onClick={handleCopyEmail}
                  className="flex items-center gap-1 text-slate-700 hover:text-slate-950 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  {copiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Plain Text</span>
                    </>
                  )}
                </button>
              </div>

              {/* Email Envelope Header */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div>
                  <span className="font-semibold text-slate-500">To:</span>{" "}
                  <span className="font-mono text-slate-900 font-medium">
                    {emailPayload.to.join(", ")}
                  </span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">CC:</span>{" "}
                  <span className="font-mono text-slate-900 font-medium">
                    {emailPayload.cc.join(", ")}
                  </span>
                  {isCritical && (
                    <span className="ml-2 text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.2 rounded">
                      Includes Client Promoter
                    </span>
                  )}
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Subject:</span>{" "}
                  <span className="font-semibold text-slate-900">{emailPayload.subject}</span>
                </div>
              </div>

              {/* Render HTML Body preview */}
              <div
                className="border border-slate-200 rounded-xl p-4 bg-white overflow-x-auto shadow-2xs"
                dangerouslySetInnerHTML={{ __html: emailPayload.htmlBody }}
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500">
            {isCritical ? (
              <span className="font-semibold text-rose-700 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Critical Overdue notice will be copied to Client Promoter &amp; CFO
              </span>
            ) : (
              <span className="text-slate-600">Copied to CFO (cfo@practice.com)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeChannelTab === "whatsapp" ? (
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in WhatsApp Web / App</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenEmailClient}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Email App (mailto)</span>
              </button>
            )}

            <button
              type="button"
              disabled={isSending}
              onClick={() => handleDirectSimulateDispatch("both")}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? "Dispatching..." : "Simulate Instant Dispatch & Log"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
