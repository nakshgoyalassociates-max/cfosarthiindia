import { MonthlyExecutiveReport } from "../types";

export const INITIAL_EXECUTIVE_REPORTS: Record<string, MonthlyExecutiveReport[]> = {
  "client-101": [
    {
      id: "rep-101-2026-09",
      companyId: "client-101",
      month: "September 2026",
      monthKey: "2026-09",
      title: "CFO Desk Executive Summary & Financial Observations — September 2026",
      summaryPoints: [
        "Top-Line Revenue & Growth: Gross monthly revenue reached ₹58.40 Lakhs in September 2026 (+7.2% MoM growth), supported by enterprise SaaS renewals and strong USD-INR realization.",
        "Operating Profitability: Operating EBITDA expanded to ₹14.07 Lakhs (24.1% EBITDA margin) with Net Profit (PAT) at ₹8.90 Lakhs, driven by cloud infrastructure optimization.",
        "Treasury & Cash Runway: Liquid cash and bank reserves stand at ₹1.45 Crores against a net monthly burn of ₹17.60 Lakhs, ensuring 8.2 months of comfortable operational runway.",
        "Working Capital & Receivables (DSO): Net working capital stands at ₹1.85 Crores with trade receivables DSO improving to 41 days; ₹4.60 Lakhs aged beyond 60 days is under active CFO collection follow-up.",
        "Statutory Compliance & Section 43B(h) Alert: 91.4% of statutory filings are completed on schedule with 100% GSTR-2B ITC match; MSME vendor balances of ₹2.80 Lakhs require clearance before 28th September.",
      ],
      executiveSummary:
        "1. Top-Line Revenue & Growth: Gross monthly revenue reached ₹58.40 Lakhs in September 2026 (+7.2% MoM growth), supported by enterprise SaaS renewals and strong USD-INR realization.\n2. Operating Profitability: Operating EBITDA expanded to ₹14.07 Lakhs (24.1% EBITDA margin) with Net Profit (PAT) at ₹8.90 Lakhs, driven by cloud infrastructure optimization.\n3. Treasury & Cash Runway: Liquid cash and bank reserves stand at ₹1.45 Crores against a net monthly burn of ₹17.60 Lakhs, ensuring 8.2 months of comfortable operational runway.\n4. Working Capital & Receivables (DSO): Net working capital stands at ₹1.85 Crores with trade receivables DSO improving to 41 days; ₹4.60 Lakhs aged beyond 60 days is under active CFO collection follow-up.\n5. Statutory Compliance & Section 43B(h) Alert: 91.4% of statutory filings are completed on schedule with 100% GSTR-2B ITC match; MSME vendor balances of ₹2.80 Lakhs require clearance before 28th September.",
      observations: [
        {
          id: "obs-1",
          category: "Cash & Treasury",
          observation:
            "Liquid cash reserves of ₹1.45 Cr provide an 8.2-month runway. Debt-service coverage remains optimal with zero external long-term debt.",
          impact: "positive",
          recommendation:
            "Park surplus operating liquidity (₹35L) in overnight / liquid sweep mutual funds yielding 6.8% annualized.",
          source: "cfo_modified",
        },
        {
          id: "obs-2",
          category: "Tax & Compliance",
          observation:
            "MSME vendor balances of ₹2.80L are approaching the statutory 45-day threshold under Section 43B(h) of the Income Tax Act.",
          impact: "critical",
          recommendation:
            "Ensure banking release of ₹2.80L prior to 28th September to prevent statutory disallowance in taxable profit computation.",
          source: "ai_generated",
        },
        {
          id: "obs-3",
          category: "Revenue & Margin",
          observation:
            "Gross profit margin stabilized at 58.2% vs 55.0% annual budgeted target due to favorable USD-INR exchange realization on export contracts.",
          impact: "positive",
          recommendation:
            "Lock in forward forex hedges on upcoming Q3 recurring SaaS billings ($42,000 receivable in October).",
          source: "ai_generated",
        },
        {
          id: "obs-4",
          category: "Cost & Budget",
          observation:
            "GPU cluster hosting expenses exceeded budget by 8.4% (₹2.45L vs ₹2.26L budget) following unexpected LLM training load during client POCs.",
          impact: "watch",
          recommendation:
            "Transition development workloads to reserved compute instances to recover the 8% cost variance in October.",
          source: "cfo_modified",
        },
        {
          id: "obs-5",
          category: "Working Capital & Debtors",
          observation:
            "Debtor DSO stands at 41 days with ₹4.60L outstanding past 60 days across 3 enterprise accounts.",
          impact: "watch",
          recommendation:
            "Issue CFO balance confirmation and payment reminder notices to the 3 enterprise accounts before 25th September.",
          source: "ai_generated",
        },
      ],
      cfoDirectives: [
        "Release Section 43B(h) MSME payments of ₹2.80L through automated NEFT batch by September 28th.",
        "Authorize CFO sign-off on GSTR-3B draft return before the 20th September statutory deadline.",
        "Initiate debtor collection drive for 3 enterprise accounts aging past 60 days (₹4.60L total outstanding).",
      ],
      financialHighlights: {
        revenue: "₹58.40 Lakhs",
        ebitda: "₹14.07 Lakhs (24.1%)",
        cashRunway: "8.2 Months",
        complianceScore: "91.4% Filed",
      },
      aiGeneratedAt: "2026-09-18T09:15:00.000Z",
      cfoSavedAt: "2026-09-18T10:30:00.000Z",
      status: "published",
      authorName: "Virtual CFO",
      authorRole: "Virtual CFO & Partner, Goyal & Associates",
      publishedAt: "2026-09-18T10:30:00.000Z",
      updatedAt: "2026-09-18T10:30:00.000Z",
    },
    {
      id: "rep-101-2026-08",
      companyId: "client-101",
      month: "August 2026",
      monthKey: "2026-08",
      title: "CFO Desk Executive Summary & Financial Observations — August 2026",
      summaryPoints: [
        "Top-Line Revenue: August 2026 closed with gross revenue of ₹54.50 Lakhs (+6.5% MoM) and Net Profit (PAT) of ₹7.80 Lakhs.",
        "Working Capital Cycle: Core receivable DSO shortened from 48 days to 41 days following accelerated collections from top domestic IT clients.",
        "Statutory Filings: 100% of Q1 ROC, GST, and TDS statutory dues were filed on schedule with zero unmatched GSTR-2B input credits.",
        "Cash Runway: Liquid reserves of ₹1.38 Crores maintained 7.9 months of operational runway.",
      ],
      executiveSummary:
        "1. Top-Line Revenue: August 2026 closed with gross revenue of ₹54.50 Lakhs (+6.5% MoM) and Net Profit (PAT) of ₹7.80 Lakhs.\n2. Working Capital Cycle: Core receivable DSO shortened from 48 days to 41 days following accelerated collections from top domestic IT clients.\n3. Statutory Filings: 100% of Q1 ROC, GST, and TDS statutory dues were filed on schedule with zero unmatched GSTR-2B input credits.\n4. Cash Runway: Liquid reserves of ₹1.38 Crores maintained 7.9 months of operational runway.",
      observations: [
        {
          id: "obs-101-aug-1",
          category: "Revenue & Margin",
          observation:
            "Revenue expanded 6.5% MoM driven by new enterprise annual licensing renewals.",
          impact: "positive",
          recommendation:
            "Continue up-selling multi-year contract renewals with upfront annual billing.",
          source: "ai_generated",
        },
        {
          id: "obs-101-aug-2",
          category: "Tax & Compliance",
          observation:
            "100% matched GSTR-2B input tax credits utilized against August outward liabilities.",
          impact: "positive",
          recommendation:
            "Maintain the 10th of every month automated vendor ITC reconciliation protocol.",
          source: "ai_generated",
        },
        {
          id: "obs-101-aug-3",
          category: "Working Capital & Debtors",
          observation:
            "Debtor DSO dropped to 41 days, outperforming the company benchmark of 45 days.",
          impact: "positive",
          recommendation: "Sustain structured 7-day payment reminder cadences for key accounts.",
          source: "cfo_modified",
        },
      ],
      cfoDirectives: [
        "Reconcile advance tax instalment payment challan (Q2) with Form 26AS.",
        "Finalize statutory audit draft schedules for FY 2025-26 board presentation.",
      ],
      financialHighlights: {
        revenue: "₹54.50 Lakhs",
        ebitda: "₹12.80 Lakhs (23.5%)",
        cashRunway: "7.9 Months",
        complianceScore: "100% Filed",
      },
      aiGeneratedAt: "2026-08-20T10:00:00.000Z",
      cfoSavedAt: "2026-08-20T11:00:00.000Z",
      status: "published",
      authorName: "Virtual CFO",
      authorRole: "Virtual CFO & Partner, Goyal & Associates",
      publishedAt: "2026-08-20T11:00:00.000Z",
      updatedAt: "2026-08-20T11:00:00.000Z",
    },
  ],
  "client-102": [
    {
      id: "rep-102-2026-09",
      companyId: "client-102",
      month: "September 2026",
      monthKey: "2026-09",
      title: "CFO Desk Executive Summary & Financial Observations — September 2026",
      summaryPoints: [
        "Revenue & Freight Volumes: Apex Global Logistics generated ₹92.10 Lakhs in monthly freight revenue with operating EBITDA at ₹16.50 Lakhs (17.9% margin).",
        "Working Capital & Bank Limits: Cash Credit (CC) limits utilized at 62% with ₹45 Lakhs unutilized headroom ahead of Q3 festive freight demand.",
        "Receivables & DSO Watch: Trade receivables DSO stands at 51 days with ₹14.50 Lakhs aged beyond 90 days requiring escalated collection.",
        "MSME & TDS Compliance: Transporter PAN verification under Sec 194C and ₹4.50 Lakhs MSME payables > 45 days require urgent clearance.",
      ],
      executiveSummary:
        "1. Revenue & Freight Volumes: Apex Global Logistics generated ₹92.10 Lakhs in monthly freight revenue with operating EBITDA at ₹16.50 Lakhs (17.9% margin).\n2. Working Capital & Bank Limits: Cash Credit (CC) limits utilized at 62% with ₹45 Lakhs unutilized headroom ahead of Q3 festive freight demand.\n3. Receivables & DSO Watch: Trade receivables DSO stands at 51 days with ₹14.50 Lakhs aged beyond 90 days requiring escalated collection.\n4. MSME & TDS Compliance: Transporter PAN verification under Sec 194C and ₹4.50 Lakhs MSME payables > 45 days require urgent clearance.",
      observations: [
        {
          id: "obs-102-1",
          category: "Cash & Treasury",
          observation:
            "Working capital overdraft headroom stands at ₹45 Lakhs with 6.9 months cash runway.",
          impact: "positive",
          recommendation:
            "Secure additional temporary festival line of ₹20L for Q3 peak freight demand.",
          source: "ai_generated",
        },
        {
          id: "obs-102-2",
          category: "Tax & Compliance",
          observation:
            "Transporter payables of ₹4.50L are nearing the 45-day MSME Section 43B(h) limit; 3 fleet sub-contractor PANs require Sec 194C validation.",
          impact: "critical",
          recommendation:
            "Clear ₹4.50L MSME dues and validate sub-contractor PANs before filing 26Q.",
          source: "cfo_modified",
        },
        {
          id: "obs-102-3",
          category: "Working Capital & Debtors",
          observation:
            "DSO stands at 51 days with ₹14.5L tied up in container freight debtors over 90 days.",
          impact: "watch",
          recommendation:
            "Submit monthly debtor ageing certificate and initiate recovery notices for >90d accounts.",
          source: "ai_generated",
        },
      ],
      cfoDirectives: [
        "Complete fleet commercial insurance renewals before 30th September.",
        "Submit monthly Stock & Book Debts Drawing Power statement to Axis Bank SME desk by 20th September.",
        "Clear ₹4.50L overdue MSME transporter bills to protect Section 43B(h) deduction.",
      ],
      financialHighlights: {
        revenue: "₹92.10 Lakhs",
        ebitda: "₹16.50 Lakhs (17.9%)",
        cashRunway: "6.9 Months",
        complianceScore: "88.9% Filed",
      },
      aiGeneratedAt: "2026-09-17T08:30:00.000Z",
      cfoSavedAt: "2026-09-17T09:00:00.000Z",
      status: "published",
      authorName: "Virtual CFO",
      authorRole: "Virtual CFO & Partner, Goyal & Associates",
      publishedAt: "2026-09-17T09:00:00.000Z",
      updatedAt: "2026-09-17T09:00:00.000Z",
    },
  ],
  "client-103": [
    {
      id: "rep-103-2026-09",
      companyId: "client-103",
      month: "September 2026",
      monthKey: "2026-09",
      title: "CFO Desk Executive Summary & Financial Observations — September 2026",
      summaryPoints: [
        "Revenue & Diagnostics Margin: Zenith HealthTech achieved ₹38.50 Lakhs monthly revenue (+9.4% MoM) with a strong 26.8% EBITDA margin.",
        "Cash Runway & Liquidity: Liquid cash reserves of ₹95.00 Lakhs provide 8.2 months of comfortable runway at ₹11.60 Lakhs monthly burn.",
        "Clean Receivables Cycle: Hospital & B2B lab collections are operating at a 31-day DSO with zero receivables overdue beyond 90 days.",
        "Statutory & LLP Governance: 94.3% compliances filed on time; LLP Form 8 Statement of Account & Solvency is scheduled for dual sign-off before 28th September.",
      ],
      executiveSummary:
        "1. Revenue & Diagnostics Margin: Zenith HealthTech achieved ₹38.50 Lakhs monthly revenue (+9.4% MoM) with a strong 26.8% EBITDA margin.\n2. Cash Runway & Liquidity: Liquid cash reserves of ₹95.00 Lakhs provide 8.2 months of comfortable runway at ₹11.60 Lakhs monthly burn.\n3. Clean Receivables Cycle: Hospital & B2B lab collections are operating at a 31-day DSO with zero receivables overdue beyond 90 days.\n4. Statutory & LLP Governance: 94.3% compliances filed on time; LLP Form 8 Statement of Account & Solvency is scheduled for dual sign-off before 28th September.",
      observations: [
        {
          id: "obs-103-1",
          category: "Revenue & Margin",
          observation:
            "Diagnostic reagent procurement optimization improved gross margin by 180 bps to 64.5%.",
          impact: "positive",
          recommendation: "Lock in annual rate contracts with top 3 reagent suppliers for Q3-Q4.",
          source: "ai_generated",
        },
        {
          id: "obs-103-2",
          category: "Tax & Compliance",
          observation:
            "LLP Form 8 Statement of Account & Solvency draft is ready for designated partner and CFO sign-off.",
          impact: "watch",
          recommendation: "Complete DSC verification and file Form 8 prior to 28th September.",
          source: "cfo_modified",
        },
      ],
      cfoDirectives: [
        "Complete dual signature on LLP Form 8 Statement of Account & Solvency by 28th September.",
        "Compile R&D patent documentation for Section 35(2AB) tax deduction schedule.",
      ],
      financialHighlights: {
        revenue: "₹38.50 Lakhs",
        ebitda: "₹10.32 Lakhs (26.8%)",
        cashRunway: "8.2 Months",
        complianceScore: "94.3% Filed",
      },
      aiGeneratedAt: "2026-09-18T08:00:00.000Z",
      cfoSavedAt: "2026-09-18T09:10:00.000Z",
      status: "published",
      authorName: "Virtual CFO",
      authorRole: "Virtual CFO & Partner, Goyal & Associates",
      publishedAt: "2026-09-18T09:10:00.000Z",
      updatedAt: "2026-09-18T09:10:00.000Z",
    },
  ],
};
