// @ts-nocheck -- legacy types from imported project; pending cleanup
import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import {
  RepositoryItemType,
  TaxAssessmentMatter,
  LegalCaseMatter,
  LicenseCertificationMatter,
  SopMatter,
} from "../../types";
import {
  X,
  PlusCircle,
  Scale,
  ShieldAlert,
  Award,
  Calendar,
  Building,
  AlertCircle,
  FileCheck,
  Layers,
  BookOpen,
} from "lucide-react";

interface NewMatterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: RepositoryItemType | "income_tax" | "gst" | "legal" | "renewals" | "sop";
}

export const NewMatterModal: React.FC<NewMatterModalProps> = ({
  isOpen,
  onClose,
  defaultType = "income_tax",
}) => {
  const { companies, selectedCompanyId, addTaxAssessment, addLegalCase, addLicense, addSop } =
    useApp();

  const getInitialMatterType = (typeVal: string): RepositoryItemType => {
    if (typeVal === "sop") return "sop";
    if (typeVal === "legal" || typeVal === "legal_case") return "legal_case";
    if (typeVal === "renewals" || typeVal === "license_certification")
      return "license_certification";
    return "tax_assessment";
  };

  const [matterType, setMatterType] = useState<RepositoryItemType>(
    getInitialMatterType(defaultType),
  );
  const [activeCategoryTab, setActiveCategoryTab] = useState<
    "income_tax" | "gst" | "legal" | "renewals" | "sop"
  >(
    defaultType === "sop"
      ? "sop"
      : defaultType === "gst"
        ? "gst"
        : defaultType === "legal" || defaultType === "legal_case"
          ? "legal"
          : defaultType === "renewals" || defaultType === "license_certification"
            ? "renewals"
            : "income_tax",
  );

  const [companyId, setCompanyId] = useState(
    selectedCompanyId !== "portfolio" ? selectedCompanyId : companies[0]?.id || "client-101",
  );

  // Common / Tax state
  const [title, setTitle] = useState("");
  const [taxCategory, setTaxCategory] = useState<TaxAssessmentMatter["taxCategory"]>(
    defaultType === "gst" ? "GST" : "Income Tax",
  );
  const [financialYear, setFinancialYear] = useState("FY 2024-25");
  const [assessmentYear, setAssessmentYear] = useState("AY 2025-26");
  const [caseOrNoticeNumber, setCaseOrNoticeNumber] = useState("");
  const [authorityOrCourt, setAuthorityOrCourt] = useState("");
  const [demandOrClaimAmount, setDemandOrClaimAmount] = useState("");
  const [depositPaid, setDepositPaid] = useState("");
  const [nextDueDate, setNextDueDate] = useState("");
  const [dueDateType, setDueDateType] = useState("");
  const [status, setStatus] = useState("");
  const [counselName, setCounselName] = useState("");
  const [counselFirm, setCounselFirm] = useState("");
  const [riskLevel, setRiskLevel] = useState<"Low" | "Medium" | "High" | "Critical">("Medium");
  const [summary, setSummary] = useState("");

  // Legal specific
  const [legalCategory, setLegalCategory] =
    useState<LegalCaseMatter["legalCategory"]>("Commercial Suit");
  const [oppositeParty, setOppositeParty] = useState("");
  const [companyRole, setCompanyRole] = useState<
    "Plaintiff" | "Defendant" | "Petitioner" | "Respondent"
  >("Defendant");
  const [contingentLiabilityType, setContingentLiabilityType] = useState<
    "Probable" | "Possible" | "Remote"
  >("Possible");

  // License specific
  const [licenseCategory, setLicenseCategory] = useState<
    LicenseCertificationMatter["licenseCategory"]
  >("Statutory / Factory / Labor");
  const [issuedDate, setIssuedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [renewalWindowDays, setRenewalWindowDays] = useState("60");
  const [annualFee, setAnnualFee] = useState("");
  const [renewalOfficer, setRenewalOfficer] = useState("");

  // SOP specific
  const [sopCode, setSopCode] = useState("");
  const [sopCategory, setSopCategory] = useState<SopMatter["sopCategory"]>("Accounts Payable");
  const [department, setDepartment] = useState("Finance & Accounts");
  const [owner, setOwner] = useState("Finance Manager");
  const [approver, setApprover] = useState("Virtual CFO");
  const [version, setVersion] = useState("v1.0");
  const [reviewFrequency, setReviewFrequency] = useState<SopMatter["reviewFrequency"]>("Quarterly");
  const [scope, setScope] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selComp = companies.find((c) => c.id === companyId);
    const compName = selComp?.companyName || "Client Entity";

    if (matterType === "tax_assessment") {
      addTaxAssessment({
        type: "tax_assessment",
        companyId,
        companyName: compName,
        taxCategory,
        matterTitle: title.trim(),
        financialYear,
        assessmentYear,
        caseOrNoticeNumber: caseOrNoticeNumber.trim(),
        assessingAuthority: authorityOrCourt.trim(),
        demandAmount: parseFloat(demandOrClaimAmount) || 0,
        depositPaid: depositPaid ? parseFloat(depositPaid) : undefined,
        status: (status as any) || "Notice Received",
        nextDueDate: nextDueDate || new Date().toISOString().split("T")[0],
        dueDateType: dueDateType.trim() || "Written Submission Reply",
        counselName: counselName.trim() || "Senior Tax Counsel",
        counselFirm: counselFirm.trim() || "Chartered Accountants",
        riskLevel,
        summary: summary.trim(),
      });
    } else if (matterType === "legal_case") {
      addLegalCase({
        type: "legal_case",
        companyId,
        companyName: compName,
        legalCategory,
        matterTitle: title.trim(),
        caseNumber: caseOrNoticeNumber.trim(),
        forumOrCourt: authorityOrCourt.trim() || "District Commercial Court",
        oppositeParty: oppositeParty.trim() || "Opponent Party",
        companyRole,
        claimOrExposureAmount: parseFloat(demandOrClaimAmount) || 0,
        contingentLiabilityType,
        status: (status as any) || "Summons Issued",
        nextHearingDate: nextDueDate || new Date().toISOString().split("T")[0],
        hearingPurpose: dueDateType.trim() || "Evidence & Cross-examination",
        advocateLegalFirm: counselFirm.trim() || counselName.trim() || "Corporate Law Associates",
        riskLevel,
        summary: summary.trim(),
      });
    } else if (matterType === "sop") {
      addSop({
        type: "sop",
        companyId,
        companyName: compName,
        sopCode: sopCode.trim() || `SOP-FIN-0${Math.floor(Math.random() * 90) + 10}`,
        sopCategory,
        title: title.trim(),
        version: version.trim() || "v1.0",
        department: department.trim() || "Finance & Accounts",
        owner: owner.trim() || "Finance Controller",
        approver: approver.trim() || "Virtual CFO",
        effectiveDate: issuedDate || new Date().toISOString().split("T")[0],
        nextReviewDate:
          nextDueDate || new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0],
        reviewFrequency,
        status: (status as any) || "Approved & Active",
        summary: summary.trim(),
        scope: scope.trim() || summary.trim(),
        applicableRegulations: ["Internal Financial Controls (IFC)", "Companies Act, 2013"],
        keySteps: [
          {
            stepNumber: 1,
            title: "Process Initiation & Verification",
            responsibleRole: owner.trim() || "Process Lead",
            description:
              "Initiate operational cycle and verify underlying documents against checklist.",
            controlCheck: "Dual authorization review prior to execution.",
          },
          {
            stepNumber: 2,
            title: "Execution & Reconciliation",
            responsibleRole: "Senior Accountant",
            description: "Perform transaction execution, GL entries, and periodic reconciliation.",
            controlCheck: "System validation against ledger balance.",
          },
          {
            stepNumber: 3,
            title: "Supervisory Sign-Off & Dossier Archival",
            responsibleRole: approver.trim() || "Virtual CFO",
            description: "Conduct monthly closing review and archive signed audit evidence.",
            controlCheck: "Mandatory CFO sign-off required for closure.",
          },
        ],
      });
    } else {
      addLicense({
        type: "license_certification",
        companyId,
        companyName: compName,
        licenseCategory,
        title: title.trim(),
        licenseNumber: caseOrNoticeNumber.trim(),
        issuingAuthority: authorityOrCourt.trim() || "Statutory Directorate",
        issuedDate: issuedDate || "2024-04-01",
        expiryDate: expiryDate || nextDueDate || new Date().toISOString().split("T")[0],
        renewalWindowDays: parseInt(renewalWindowDays) || 60,
        annualFeeOrCost: annualFee ? parseFloat(annualFee) : undefined,
        status: (status as any) || "Active & Valid",
        renewalOfficer: renewalOfficer.trim() || "Compliance Officer",
        summary: summary.trim(),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Register New Business Matter</h3>
              <p className="text-xs text-slate-300">
                Corporate Repository Entry • CFO Admin Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matter Type Selector Tabs (Category-wise) */}
        <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveCategoryTab("income_tax");
              setMatterType("tax_assessment");
              setTaxCategory("Income Tax");
              setStatus("Notice Received");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeCategoryTab === "income_tax"
                ? "bg-white text-indigo-700 shadow-xs border border-indigo-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Income Tax</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategoryTab("gst");
              setMatterType("tax_assessment");
              setTaxCategory("GST");
              setStatus("Notice Received");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeCategoryTab === "gst"
                ? "bg-white text-emerald-700 shadow-xs border border-emerald-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>GST / Indirect</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategoryTab("legal");
              setMatterType("legal_case");
              setStatus("Summons Issued");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeCategoryTab === "legal"
                ? "bg-white text-amber-700 shadow-xs border border-amber-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Legal Case</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategoryTab("renewals");
              setMatterType("license_certification");
              setStatus("Active & Valid");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeCategoryTab === "renewals"
                ? "bg-white text-purple-700 shadow-xs border border-purple-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>License / Renewal</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategoryTab("sop");
              setMatterType("sop");
              setStatus("Approved & Active");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeCategoryTab === "sop"
                ? "bg-white text-teal-700 shadow-xs border border-teal-200"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>SOP</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Company Workspace */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Client Entity / Company <span className="text-rose-500">*</span>
              </label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.legalEntity})
                  </option>
                ))}
              </select>
            </div>

            {matterType === "sop" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SOP Functional Domain <span className="text-rose-500">*</span>
                </label>
                <select
                  value={sopCategory}
                  onChange={(e) => setSopCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 bg-white"
                >
                  <option value="Accounts Payable">Accounts Payable (P2P)</option>
                  <option value="Taxation & Direct Tax">Taxation & Direct Tax</option>
                  <option value="GST & Indirect Tax">GST & Indirect Tax</option>
                  <option value="Statutory & Corporate Secretarial">
                    Statutory & Corporate Secretarial
                  </option>
                  <option value="Financial MIS & Reporting">
                    Financial MIS & Month-End Reporting
                  </option>
                  <option value="Fixed Assets & Capex">Fixed Assets & Capex</option>
                  <option value="Treasury & Banking">Treasury & Banking Operations</option>
                  <option value="Internal Controls & Audit">Internal Controls & Audit (IFC)</option>
                  <option value="Payroll & HR Compliance">Payroll & HR Compliance</option>
                  <option value="Procurement & Vendor Management">
                    Procurement & Vendor Management
                  </option>
                </select>
              </div>
            )}

            {matterType === "tax_assessment" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tax Stream Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={taxCategory}
                  onChange={(e) => setTaxCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Income Tax">Income Tax (Direct Tax / NFAC)</option>
                  <option value="GST">GST (State / Central / DGGI)</option>
                  <option value="TDS/TCS">TDS / TCS (Direct Tax Withholding)</option>
                  <option value="Transfer Pricing">Transfer Pricing / International Tax</option>
                  <option value="Customs / Excise">Customs / Central Excise / FTP</option>
                </select>
              </div>
            )}

            {matterType === "legal_case" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Litigation Category <span className="text-rose-500">*</span>
                </label>
                <select
                  value={legalCategory}
                  onChange={(e) => setLegalCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Commercial Suit">Commercial Suit / Contractual</option>
                  <option value="NCLT / Insolvency">NCLT / Insolvency / IBC</option>
                  <option value="Labor & Industrial">Labor & Industrial Dispute</option>
                  <option value="Arbitration">Arbitration & Conciliation</option>
                  <option value="High Court / Writ / IP">High Court / Writ / Trademark / IP</option>
                  <option value="Cheque Bounce (NI 138)">Cheque Bounce (NI Act 138)</option>
                </select>
              </div>
            )}

            {matterType === "license_certification" && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  License Domain <span className="text-rose-500">*</span>
                </label>
                <select
                  value={licenseCategory}
                  onChange={(e) => setLicenseCategory(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Statutory / Factory / Labor">
                    Statutory / Factory / Shops & Est
                  </option>
                  <option value="Environmental & Pollution">
                    Environmental & Pollution (CTO / KSPCB)
                  </option>
                  <option value="Quality & Security (ISO/SOC)">
                    Quality & Security (ISO 27001, SOC 2)
                  </option>
                  <option value="Fire Safety & NOC">Fire Safety NOC / Municipal</option>
                  <option value="Food & Safety (FSSAI)">Food & Safety (FSSAI)</option>
                  <option value="Import & Export (IEC)">Import & Export (IEC / DGFT)</option>
                </select>
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {matterType === "sop" ? "SOP Title / Procedure Name" : "Matter / Docket Title"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                matterType === "sop"
                  ? "e.g. Monthly GST Return (GSTR-1 & 3B) Preparation & Reconciliation SOP"
                  : matterType === "tax_assessment"
                    ? "e.g. Scrutiny Assessment u/s 143(3) - Deduction of R&D Expenses"
                    : matterType === "legal_case"
                      ? "e.g. Nexora vs Zenith Tech Logistics - Vendor Recovery Suit"
                      : "e.g. KSPCB Consent to Operate (CTO - Water & Air Act)"
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {matterType === "sop" ? (
            <>
              {/* SOP Specific Identifiers & Ownership */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    SOP Code / Identifier <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sopCode}
                    onChange={(e) => setSopCode(e.target.value)}
                    placeholder="e.g. SOP-FIN-008"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department / Function <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Finance & Accounts"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Process Owner / Lead <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g. Finance Manager / Controller"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Approver Authority <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={approver}
                    onChange={(e) => setApprover(e.target.value)}
                    placeholder="e.g. Virtual CFO / Audit Committee"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Version Tag</label>
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="v1.0"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Review Frequency Cadence
                  </label>
                  <select
                    value={reviewFrequency}
                    onChange={(e) => setReviewFrequency(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Semi-Annually">Semi-Annually</option>
                    <option value="Annually">Annually</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Effective / Release Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={issuedDate}
                    onChange={(e) => setIssuedDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Next Review Due Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={nextDueDate}
                    onChange={(e) => setNextDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Scope & Applicability <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  placeholder="Defines coverage, organizational entities, operational departments, and exclusions..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                />
              </div>
            </>
          ) : (
            <>
              {/* Tax Specific: Periods */}
              {matterType === "tax_assessment" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Financial Year (FY)
                    </label>
                    <input
                      type="text"
                      value={financialYear}
                      onChange={(e) => setFinancialYear(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Assessment Year (AY)
                    </label>
                    <input
                      type="text"
                      value={assessmentYear}
                      onChange={(e) => setAssessmentYear(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Identifiers */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {matterType === "tax_assessment"
                      ? "Notice / DIN / Case Ref #"
                      : matterType === "legal_case"
                        ? "Court Case / Docket #"
                        : "License / Registration #"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={caseOrNoticeNumber}
                    onChange={(e) => setCaseOrNoticeNumber(e.target.value)}
                    placeholder="e.g. ITBA/AST/143(3)/2025-26/10291"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {matterType === "tax_assessment"
                      ? "Assessing Authority / Office"
                      : matterType === "legal_case"
                        ? "Forum / Court / Tribunal"
                        : "Issuing Authority / Agency"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={authorityOrCourt}
                    onChange={(e) => setAuthorityOrCourt(e.target.value)}
                    placeholder="e.g. NFAC, Income Tax Dept or Commercial Court, Bengaluru"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Amounts & Financial Exposure */}
              {matterType !== "license_certification" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {matterType === "tax_assessment"
                        ? "Demand Amount (₹)"
                        : "Claim / Exposure (₹)"}{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={demandOrClaimAmount}
                      onChange={(e) => setDemandOrClaimAmount(e.target.value)}
                      placeholder="e.g. 1850000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>

                  {matterType === "tax_assessment" ? (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Stay Deposit Paid (20% rule) (₹)
                      </label>
                      <input
                        type="number"
                        value={depositPaid}
                        onChange={(e) => setDepositPaid(e.target.value)}
                        placeholder="e.g. 370000"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Contingent Liability (AS 29 / Ind AS 37)
                      </label>
                      <select
                        value={contingentLiabilityType}
                        onChange={(e) => setContingentLiabilityType(e.target.value as any)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Probable">Probable (&gt; 50% chance of outflow)</option>
                        <option value="Possible">Possible (Note to Accounts disclosure)</option>
                        <option value="Remote">Remote (Low risk / Outflow unlikely)</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Issued Date</label>
                    <input
                      type="date"
                      value={issuedDate}
                      onChange={(e) => setIssuedDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Statutory / Renewal Fee (₹)
                    </label>
                    <input
                      type="number"
                      value={annualFee}
                      onChange={(e) => setAnnualFee(e.target.value)}
                      placeholder="e.g. 85000"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {/* Dates: Due Date / Hearing Date / Expiry Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {matterType === "license_certification"
                      ? "License Expiry Date (Renewal Deadline)"
                      : "Next Hearing / Submission Due Date"}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={nextDueDate}
                    onChange={(e) => {
                      setNextDueDate(e.target.value);
                      if (matterType === "license_certification") setExpiryDate(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {matterType === "license_certification"
                      ? "Renewal Officer / In-Charge"
                      : "Due Date Purpose / Milestone Focus"}
                  </label>
                  <input
                    type="text"
                    value={matterType === "license_certification" ? renewalOfficer : dueDateType}
                    onChange={(e) => {
                      if (matterType === "license_certification") setRenewalOfficer(e.target.value);
                      else setDueDateType(e.target.value);
                    }}
                    placeholder={
                      matterType === "license_certification"
                        ? "e.g. Head of Plant Operations"
                        : "e.g. Written Statement Filing / Hearing"
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Legal / Tax Counsel Info */}
              {matterType !== "license_certification" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Counsel / Advocate Name
                    </label>
                    <input
                      type="text"
                      value={counselName}
                      onChange={(e) => setCounselName(e.target.value)}
                      placeholder="e.g. Adv. R. Subramanian"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Firm / Practice Name
                    </label>
                    <input
                      type="text"
                      value={counselFirm}
                      onChange={(e) => setCounselFirm(e.target.value)}
                      placeholder="e.g. Lex Apex Partners"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Summary */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              {matterType === "sop"
                ? "Objective & Operational Summary"
                : "Case Facts / Strategic Summary"}{" "}
              <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder={
                matterType === "sop"
                  ? "Detail the primary operational objective, quality standards, and compliance gates..."
                  : "Detail the background of the matter, core issue or allegations, and tactical stance..."
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
            />
          </div>

          {/* Footer Action */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Register Matter in Repository</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
