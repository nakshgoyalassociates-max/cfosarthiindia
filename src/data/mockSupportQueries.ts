import { CfoSupportQuery } from "../types";

export const MOCK_SUPPORT_QUERIES: CfoSupportQuery[] = [
  // 1. Accounts & Finance Query
  {
    id: "query-101",
    ticketNumber: "QRY-2026-101",
    companyId: "client-101",
    companyName: "Nexora Tech Private Limited",
    requestType: "accounts_query",
    title: "TDS Rate Clarification on Cross-Border AWS Cloud & Software Invoices",
    description:
      "Our finance team received an invoice of ₹4,85,000 for foreign cloud hosting and database licenses. Need Virtual CFO guidance on whether Section 195 with 10% withholding applies, or if Equalisation Levy / DTAA Form 10F exemption can be availed to prevent double taxation.",
    category: "Tax & GST",
    priority: "High",
    status: "answered",
    postedBy: {
      name: "Rahul Sharma",
      email: "rahul.sharma@nexoratech.com",
      role: "client_team",
      designation: "Finance Lead",
    },
    assignedCfo: "CA Sudhakar Rao",
    assignedCfoEmail: "cfo.desk@virtualcfopractice.com",
    slaHours: 12,
    createdAt: "2026-10-04T09:30:00.000Z",
    updatedAt: "2026-10-05T14:15:00.000Z",
    tags: ["TDS 195", "Cloud Subscriptions", "Withholding"],
    attachedDocNote: "AWS_Invoice_INV-9821.pdf (Attached to Tally entry)",
    messages: [
      {
        id: "msg-1",
        senderName: "Rahul Sharma",
        senderRole: "client_team",
        senderEmail: "rahul.sharma@nexoratech.com",
        content:
          "Hi CFO Team, We are processing the monthly AWS hosting bill. Last month the accounts clerk deducted TDS @ 2% under 194C by mistake. Please clarify the correct section and TRC / Form 10F requirement for this foreign remittance.",
        createdAt: "2026-10-04T09:30:00.000Z",
      },
      {
        id: "msg-2",
        senderName: "CA Sudhakar Rao",
        senderRole: "cfo",
        senderEmail: "cfo.desk@virtualcfopractice.com",
        content:
          "Hello Rahul, Standard cloud hosting services without custom source code transfer are classified as automated digital services. Since AWS India now bills under GSTIN (AISPL), domestic TDS under Section 194J (2% for FTS/Tech Services) applies if billing is in INR. If direct US dollar remittance, Section 195 applies at 10% subject to TRC. Please verify if invoice has AWS India GSTIN.",
        createdAt: "2026-10-04T15:20:00.000Z",
      },
      {
        id: "msg-3",
        senderName: "Rahul Sharma",
        senderRole: "client_team",
        senderEmail: "rahul.sharma@nexoratech.com",
        content:
          "Verified! The invoice is billed by AISPL with Maharashtra GSTIN 27AA... So we will deduct 2% under 194J. Thank you Sudhakar ji!",
        createdAt: "2026-10-05T10:05:00.000Z",
      },
      {
        id: "msg-4",
        senderName: "CA Sudhakar Rao",
        senderRole: "cfo",
        senderEmail: "cfo.desk@virtualcfopractice.com",
        content:
          "Perfect. Make sure the TDS return reflects the correct lower rate code so there is no TRACES 200A demand. You can proceed with payment releasing net of 2% TDS.",
        createdAt: "2026-10-05T14:15:00.000Z",
      },
    ],
  },

  // 2. Accounts & Finance Hiring Requirement (With CFO Separate Empanelled Recruiter Arrangement)
  {
    id: "query-102",
    ticketNumber: "HIR-2026-204",
    companyId: "client-101",
    companyName: "Nexora Tech Private Limited",
    requestType: "hiring_requirement",
    title: "Urgent Requirement: Senior Accounts Executive (Tally Prime, GST & TDS Compliance)",
    description:
      "Client finance team requires hiring a full-time Senior Accounts Executive with 3-5 years experience to handle daily sales/purchase voucher verification, bank reconciliations in Tally Prime, monthly GSTR-1 preparation, and vendor 2B matching.",
    category: "Hiring - Accounts & Finance",
    priority: "High",
    status: "client_approved",
    postedBy: {
      name: "Priya Patel",
      email: "priya.patel@nexoratech.com",
      role: "client_team",
      designation: "Senior Accounts Executive",
    },
    assignedCfo: "CA Sudhakar Rao",
    assignedCfoEmail: "cfo.desk@virtualcfopractice.com",
    slaHours: 24,
    createdAt: "2026-10-04T11:00:00.000Z",
    updatedAt: "2026-10-06T16:20:00.000Z",
    tags: ["Hiring", "Senior Accountant", "Tally Prime", "Candidate Sourcing"],
    hiringDetails: {
      roleTitle: "Senior Accounts Executive",
      department: "Accounts & Compliance",
      employmentType: "full_time",
      experienceYears: "3 - 5 Years",
      targetCtcRange: "₹4,80,000 - ₹6,00,000 P.A.",
      softwareStack: ["Tally Prime", "Zoho Books", "Advanced Excel (VLOOKUP, Pivots)", "GST Portal 2B"],
      openingsCount: 1,
      urgency: "Immediate (15 Days)",
      jobDescription:
        "Manage day-to-day transaction recording, scrutiny of supplier bills with E-way bills, 2B vs Purchase register reconciliations, TDS deduction on vendor payments under 194Q/194C, customer collections follow-up, and assisting Virtual CFO in month-end MIS closing.",
      interviewStatusSummary: "5 Profiles shortlisted by Recruitment Partner; 2 Technical rounds scheduled for Friday.",
    },
    cfoArrangement: {
      isSeparateArrangement: true,
      executionMode: "empanelled_professional",
      engagementModel: "success_fee_recruitment",
      proposalStatus: "client_approved",
      professionalPartner: {
        partnerType: "recruitment_headhunter",
        firmName: "TalentEdge Finance & Executive Search LLP",
        contactPerson: "Ms. Shalini Saxena (Head of BFSI Hiring)",
        email: "shalini.saxena@talentedgerecruiters.com",
        phone: "+91 98201 44521",
        registrationNumber: "MSME-MH-02-0094182",
        partnerFee: 35000,
      },
      commercials: {
        clientQuotedFee: 45000,
        internalCostOrPartnerFee: 35000,
        cfoOversightMargin: 10000,
        feeStructure: "fixed_lumpsum",
        paymentTerms: "100% upon candidate onboarding + 90-day free candidate replacement guarantee",
        currency: "INR",
      },
      clientSignOff: {
        approvedBy: "Siddharth Mehta (Managing Director)",
        approvedAt: "2026-10-05T17:30:00.000Z",
        clientRemarks: "Approved. Please expedite interviews and target offer rollout by 15th October.",
        poOrWorkOrderRef: "WO-HR-2026-044",
      },
      milestones: [
        {
          id: "m-1",
          title: "Job Description Calibration & Candidate Sourcing",
          targetDate: "2026-10-06",
          status: "completed",
        },
        {
          id: "m-2",
          title: "CFO Technical Screening of Top 5 Profiles",
          targetDate: "2026-10-08",
          status: "in_progress",
        },
        {
          id: "m-3",
          title: "Client Management Interviews & Offer Letter Release",
          targetDate: "2026-10-12",
          status: "pending",
        },
        {
          id: "m-4",
          title: "Candidate Onboarding & 30-Day Induction Check",
          targetDate: "2026-10-25",
          status: "pending",
        },
      ],
      cfoSupervisionNotes:
        "Special arrangement with TalentEdge: Virtual CFO team conducts initial technical vetting on Tally & GST knowledge before submitting CVs to client team, ensuring zero interview fatigue for client management.",
    },
    messages: [
      {
        id: "m-101",
        senderName: "Priya Patel",
        senderRole: "client_team",
        senderEmail: "priya.patel@nexoratech.com",
        content:
          "Hi Sudhakar Sir, our junior billing accountant resigned and we urgently need a skilled Senior Accounts Executive who understands Tally Prime and GST 2B reconciliation. Can you help us hire through your network?",
        createdAt: "2026-10-04T11:00:00.000Z",
      },
      {
        id: "m-102",
        senderName: "CA Sudhakar Rao",
        senderRole: "cfo",
        senderEmail: "cfo.desk@virtualcfopractice.com",
        content:
          "Noted Priya. As discussed, recruitment is an add-on special arrangement outside regular CFO retainership. I have drafted a proposal utilizing our empanelled recruitment firm TalentEdge. Our team will technically screen candidates before sending to you.",
        createdAt: "2026-10-04T16:45:00.000Z",
      },
      {
        id: "m-103",
        senderName: "Siddharth Mehta",
        senderRole: "client",
        senderEmail: "promoter@nexoratech.com",
        content:
          "Proposal looks fair. ₹45k one-time success fee with 90-day replacement warranty is approved. Please start sourcing immediately.",
        createdAt: "2026-10-05T17:30:00.000Z",
      },
    ],
  },

  // 3. Statutory MCA Assignment (With CFO Separate Empanelled Company Secretary Arrangement)
  {
    id: "query-103",
    ticketNumber: "MCA-2026-308",
    companyId: "client-101",
    companyName: "Nexora Tech Private Limited",
    requestType: "mca_statutory_assignment",
    title: "Statutory MCA Assignment: RoC Annual Filing (AOC-4, MGT-7) & Director DIR-3 KYC",
    description:
      "Annual statutory MCA mandate required for FY 2025-26 under the Companies Act 2013, including e-filing of financial statements in Form AOC-4 XBRL, annual return MGT-7, and Director KYC for 3 directors with digital signature certification.",
    category: "Statutory MCA & RoC",
    priority: "High",
    status: "in_progress",
    postedBy: {
      name: "Siddharth Mehta",
      email: "promoter@nexoratech.com",
      role: "client",
      designation: "Managing Director",
    },
    assignedCfo: "CA Sudhakar Rao",
    assignedCfoEmail: "cfo.desk@virtualcfopractice.com",
    slaHours: 48,
    createdAt: "2026-10-02T10:00:00.000Z",
    updatedAt: "2026-10-06T15:00:00.000Z",
    tags: ["MCA Filing", "AOC-4", "MGT-7", "DIR-3 KYC", "Company Secretary"],
    assignmentDetails: {
      assignmentType: "MCA Annual Filing (AOC-4 & MGT-7)",
      scopeSummary:
        "Drafting Board Report, Notice of AGM, Directors' Responsibility Statement, certification of Form AOC-4 & MGT-7 by Practicing Company Secretary (PCS), and DSC based filing on MCA V3 portal.",
      financialYearOrPeriod: "FY 2025-26",
      statutoryDeadline: "2026-10-30",
      keyDeliverables: [
        "Audited Financial Statements tagged into Form AOC-4",
        "Form MGT-7 extract and filing receipt (SRN)",
        "DIR-3 KYC verification for all 3 DIN holders",
        "Statutory Register updates (MGT-1, MBP-1)",
      ],
      applicableActOrSection: "Companies Act 2013, Section 92 & Section 137",
    },
    cfoArrangement: {
      isSeparateArrangement: true,
      executionMode: "empanelled_professional",
      engagementModel: "separate_sow_fixed",
      proposalStatus: "in_execution",
      professionalPartner: {
        partnerType: "practicing_cs",
        firmName: "Apex Corporate Legal & CS Partners (FCS Firm)",
        contactPerson: "CS Devendra Agarwal (Managing Partner)",
        email: "devendra.cs@apexcorporatelegal.com",
        phone: "+91 94140 88291",
        registrationNumber: "ICSI FCS-8192 / CP No. 9012",
        partnerFee: 28000,
      },
      commercials: {
        clientQuotedFee: 38000,
        internalCostOrPartnerFee: 28000,
        cfoOversightMargin: 10000,
        feeStructure: "fixed_lumpsum",
        paymentTerms: "50% Advance on signing, 50% on generation of MCA V3 SRN Acknowledgement Receipts",
        currency: "INR",
      },
      clientSignOff: {
        approvedBy: "Siddharth Mehta",
        approvedAt: "2026-10-03T09:15:00.000Z",
        clientRemarks: "Approved. CS firm may liaise directly with finance team for audited balance sheet copies.",
        poOrWorkOrderRef: "SOW-MCA-2026-09",
      },
      milestones: [
        {
          id: "mca-1",
          title: "Collection of Signed Financials & Director KYC Documents",
          targetDate: "2026-10-05",
          status: "completed",
        },
        {
          id: "mca-2",
          title: "Form AOC-4 and MGT-7 Preparation & PCS Scrutiny",
          targetDate: "2026-10-15",
          status: "in_progress",
        },
        {
          id: "mca-3",
          title: "DSC Affixation & Final MCA Portal V3 Upload",
          targetDate: "2026-10-24",
          status: "pending",
        },
      ],
      cfoSupervisionNotes:
        "Separate arrangement engaged with CS Devendra Agarwal. Virtual CFO team handles financial reconciliation and draft notes, while PCS provides statutory certification and filing.",
    },
    messages: [
      {
        id: "msg-mca-1",
        senderName: "Siddharth Mehta",
        senderRole: "client",
        content:
          "Sudhakar ji, please arrange for our annual ROC filings AOC-4 and MGT-7 before the October 30 deadline. Also ensure DIR-3 KYC is completed for all directors.",
        createdAt: "2026-10-02T10:00:00.000Z",
      },
      {
        id: "msg-mca-2",
        senderName: "CA Sudhakar Rao",
        senderRole: "cfo",
        content:
          "Proposal attached under separate assignment. We have engaged our empanelled PCS firm Apex Corporate Legal at ₹38,000 all-inclusive of secretarial audit and portal fees. Team has already initiated document collection.",
        createdAt: "2026-10-02T17:30:00.000Z",
      },
    ],
  },

  // 4. Audit Assignment (With CFO Separate Empanelled CA Firm Arrangement)
  {
    id: "query-104",
    ticketNumber: "AUD-2026-412",
    companyId: "client-101",
    companyName: "Nexora Tech Private Limited",
    requestType: "audit_assignment",
    title: "Quarterly Internal Audit & Inventory Physical Verification (Q2 FY 2026-27)",
    description:
      "Requirement for comprehensive internal audit covering store inventory valuation, scrap reconciliation, job-work challan tracking, and vendor credit control for 3 manufacturing and warehouse units.",
    category: "Audit - Statutory & Internal",
    priority: "High",
    status: "proposal_sent",
    postedBy: {
      name: "Rahul Sharma",
      email: "rahul.sharma@nexoratech.com",
      role: "client_team",
      designation: "Finance Lead",
    },
    assignedCfo: "CA Sudhakar Rao",
    assignedCfoEmail: "cfo.desk@virtualcfopractice.com",
    slaHours: 36,
    createdAt: "2026-10-05T14:30:00.000Z",
    updatedAt: "2026-10-06T18:00:00.000Z",
    tags: ["Internal Audit", "Physical Verification", "Inventory Control", "Practicing CA"],
    assignmentDetails: {
      assignmentType: "Internal Audit & Internal Financial Controls",
      scopeSummary:
        "100% physical stock audit of raw yarn, fabric roll inventory, WIP stores, and reconciliation with Tally book stocks. Review of internal financial controls over purchasing and payments.",
      financialYearOrPeriod: "Q2 FY 2026-27 (July - September 2026)",
      statutoryDeadline: "2026-10-31",
      keyDeliverables: [
        "Stock Discrepancy & Valuation Variance Report",
        "Sub-contractor Job Work Challan Aging (Annexure 55)",
        "Internal Financial Controls (IFC) Risk Matrix & Recommendations",
      ],
      applicableActOrSection: "Companies Act 2013, Section 138 (Internal Audit)",
    },
    cfoArrangement: {
      isSeparateArrangement: true,
      executionMode: "empanelled_professional",
      engagementModel: "separate_sow_fixed",
      proposalStatus: "proposed_to_client",
      professionalPartner: {
        partnerType: "practicing_ca",
        firmName: "Singhal & Kothari, Chartered Accountants",
        contactPerson: "CA Manish Singhal (Partner - Risk & Audit)",
        email: "manish.singhal@singhalkothari.com",
        phone: "+91 98112 55430",
        registrationNumber: "ICAI FRN 012891N",
        partnerFee: 65000,
      },
      commercials: {
        clientQuotedFee: 85000,
        internalCostOrPartnerFee: 65000,
        cfoOversightMargin: 20000,
        feeStructure: "fixed_lumpsum",
        paymentTerms: "40% Mobilization advance, 60% upon submission of Executive Internal Audit Report",
        currency: "INR",
      },
      milestones: [
        {
          id: "aud-1",
          title: "Audit Planning & Physical Stock Count Methodology",
          targetDate: "2026-10-10",
          status: "pending",
        },
        {
          id: "aud-2",
          title: "On-site Field Audit at Bhiwandi & Surat Warehouses",
          targetDate: "2026-10-18",
          status: "pending",
        },
        {
          id: "aud-3",
          title: "Draft Audit Observations Review with CFO & Management",
          targetDate: "2026-10-25",
          status: "pending",
        },
      ],
      cfoSupervisionNotes:
        "Virtual CFO will chair the exit conference and present the executive summary directly to the Board of Directors.",
    },
    messages: [
      {
        id: "msg-aud-1",
        senderName: "Rahul Sharma",
        senderRole: "client_team",
        content:
          "Sir, management has asked for a physical stock count and internal control audit for our two warehouses before Diwali. Can Virtual CFO coordinate this with an audit firm?",
        createdAt: "2026-10-05T14:30:00.000Z",
      },
      {
        id: "msg-aud-2",
        senderName: "CA Sudhakar Rao",
        senderRole: "cfo",
        content:
          "We have structured a separate engagement with Singhal & Kothari Chartered Accountants. Proposal shared for ₹85,000. Once Siddharth ji signs off, their senior audit team will visit Bhiwandi on 18th Oct.",
        createdAt: "2026-10-06T18:00:00.000Z",
      },
    ],
  },

  // 5. Taxation Assignment (Self-Executed by Virtual CFO Team under Separate Mandate)
  {
    id: "query-105",
    ticketNumber: "TAX-2026-518",
    companyId: "client-101",
    companyName: "Nexora Tech Private Limited",
    requestType: "taxation_assignment",
    title: "GST Annual Return (GSTR-9) & Reconciliation Statement (GSTR-9C) for FY 2024-25",
    description:
      "Comprehensive annual reconciliation of Turnover, Output Tax, Input Tax Credit (ITC) between books of accounts, GSTR-1, GSTR-3B, and GSTR-2B, plus filing of GSTR-9/9C.",
    category: "Taxation - Direct & GST",
    priority: "Medium",
    status: "in_progress",
    postedBy: {
      name: "Priya Patel",
      email: "priya.patel@nexoratech.com",
      role: "client_team",
      designation: "Senior Accounts Executive",
    },
    assignedCfo: "CA Sudhakar Rao",
    assignedCfoEmail: "cfo.desk@virtualcfopractice.com",
    slaHours: 48,
    createdAt: "2026-10-01T12:00:00.000Z",
    updatedAt: "2026-10-06T11:30:00.000Z",
    tags: ["GST 9/9C", "ITC Reconciliation", "Self CFO Execution", "Tax Mandate"],
    assignmentDetails: {
      assignmentType: "GST Annual Return (9/9C) & Reconciliation",
      scopeSummary:
        "Full-year matching of monthly GST 3B payments with Audited Financial Statements, reversal of ineligible ITC under Rule 42/43, reporting of credit notes, and final filing on GST common portal.",
      financialYearOrPeriod: "FY 2024-25",
      statutoryDeadline: "2026-12-31",
      keyDeliverables: [
        "Audited Financial Turnover vs GST Turnover Reconciliation Sheet",
        "ITC Table 8 Reconciliation Matrix (Book ITC vs GSTR-2B)",
        "Filed GSTR-9 JSON and PDF Acknowledgment",
      ],
      applicableActOrSection: "CGST Act 2017, Section 35(5) and Section 44",
    },
    cfoArrangement: {
      isSeparateArrangement: true,
      executionMode: "self_cfo_team",
      engagementModel: "separate_sow_fixed",
      proposalStatus: "client_approved",
      commercials: {
        clientQuotedFee: 50000,
        internalCostOrPartnerFee: 20000,
        cfoOversightMargin: 30000,
        feeStructure: "fixed_lumpsum",
        paymentTerms: "50% Advance on signing, 50% on successful portal upload",
        currency: "INR",
      },
      clientSignOff: {
        approvedBy: "Siddharth Mehta",
        approvedAt: "2026-10-02T16:00:00.000Z",
        clientRemarks: "Approved as self-executed assignment by Virtual CFO team.",
        poOrWorkOrderRef: "WO-TAX-2026-11",
      },
      milestones: [
        {
          id: "tax-1",
          title: "Books vs GSTR-1 Turnover & Rate-wise Reconciliation",
          targetDate: "2026-10-15",
          status: "completed",
        },
        {
          id: "tax-2",
          title: "ITC Matching with GSTR-2B & Supplier Follow-up",
          targetDate: "2026-10-30",
          status: "in_progress",
        },
        {
          id: "tax-3",
          title: "Draft GSTR-9 / 9C Sign-off with Promoters",
          targetDate: "2026-11-15",
          status: "pending",
        },
      ],
      cfoSupervisionNotes:
        "Executed directly by Virtual CFO Senior Tax Specialist (Self). Demarcated as separate engagement from ongoing monthly CFO advisory.",
    },
    messages: [
      {
        id: "m-tax-1",
        senderName: "Priya Patel",
        senderRole: "client_team",
        content:
          "Sir, we need to begin the GSTR-9 & 9C reconciliation for FY 24-25. Can CFO team handle this directly?",
        createdAt: "2026-10-01T12:00:00.000Z",
      },
      {
        id: "m-tax-2",
        senderName: "CA Sudhakar Rao",
        senderRole: "cfo",
        content:
          "Yes, we have added this as a Self-Executed separate mandate at ₹50,000. Siddharth ji has approved. Data extraction has commenced.",
        createdAt: "2026-10-02T16:30:00.000Z",
      },
    ],
  },

  // 6. Special Accounting & Bookkeeping Clean-up Assignment
  {
    id: "query-106",
    ticketNumber: "ACC-2026-614",
    companyId: "client-101",
    companyName: "Nexora Tech Private Limited",
    requestType: "accounting_assignment",
    title: "Special Assignment: Fixed Asset Register (FAR) Rebuilding & Physical Tagging",
    description:
      "Historical assets since 2021 lack barcode tagging and accurate depreciation schedules under Schedule II of Companies Act. Need complete asset verification, capitalized invoice audit, and updated FAR.",
    category: "Accounting & Bookkeeping",
    priority: "Medium",
    status: "in_review",
    postedBy: {
      name: "Rahul Sharma",
      email: "rahul.sharma@nexoratech.com",
      role: "client_team",
      designation: "Finance Lead",
    },
    assignedCfo: "CA Sudhakar Rao",
    assignedCfoEmail: "cfo.desk@virtualcfopractice.com",
    slaHours: 48,
    createdAt: "2026-10-06T09:00:00.000Z",
    updatedAt: "2026-10-06T14:00:00.000Z",
    tags: ["Fixed Assets", "Schedule II", "FAR Clean-up", "Depreciation"],
    assignmentDetails: {
      assignmentType: "Backlog Bookkeeping & Books Clean-up",
      scopeSummary:
        "Rebuilding comprehensive Fixed Asset Register with QR code tagging, cost breakdown (Plant, Machinery, Computers, Vehicles), residual value determination, and IT Act vs Companies Act depreciation calculation.",
      financialYearOrPeriod: "FY 2021-22 to FY 2025-26",
      keyDeliverables: [
        "Comprehensive Excel Fixed Asset Register (FAR) with Schedule II formula links",
        "Physical asset tagging log sheet",
        "Impairment & discarded asset write-off schedule",
      ],
      applicableActOrSection: "Companies Act 2013, Schedule II & AS-10 (PPE)",
    },
    cfoArrangement: {
      isSeparateArrangement: true,
      executionMode: "unassigned",
      engagementModel: "separate_sow_fixed",
      proposalStatus: "draft_proposal",
      commercials: {
        clientQuotedFee: 42000,
        internalCostOrPartnerFee: 28000,
        cfoOversightMargin: 14000,
        feeStructure: "fixed_lumpsum",
        paymentTerms: "50% Advance, 50% on final verified FAR delivery",
        currency: "INR",
      },
      milestones: [
        {
          id: "far-1",
          title: "Voucher & Invoice Tracing from Historical Tally Ledgers",
          targetDate: "2026-10-20",
          status: "pending",
        },
        {
          id: "far-2",
          title: "Physical Inspection & QR Tagging on Shop Floor",
          targetDate: "2026-10-28",
          status: "pending",
        },
      ],
      cfoSupervisionNotes:
        "Draft proposal prepared. Virtual CFO can either allocate 2 in-house articles (Self) or empanel CMA firm for physical count.",
    },
    messages: [
      {
        id: "msg-far-1",
        senderName: "Rahul Sharma",
        senderRole: "client_team",
        content:
          "Statutory auditor has flagged missing Fixed Asset Register in last year's CARO remarks. We need this sorted urgently before Q3.",
        createdAt: "2026-10-06T09:00:00.000Z",
      },
    ],
  },
];
