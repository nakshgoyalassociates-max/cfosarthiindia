import * as XLSX from "xlsx";
import {
  ExpenseProvisionCategory,
  ExpenseProvisionItem,
  PnlStatementData,
  PnlLineItem,
} from "../types";
import { cleanNumber, cleanText } from "./misExcelTemplateHelper";

export const PROVISION_CATEGORY_CONFIG: Record<
  ExpenseProvisionCategory,
  { label: string; shortLabel: string; pnlLineId: string; expenseGroup: string; badgeCls: string }
> = {
  cost_of_materials: {
    label: "Cost of Materials / Direct Costs",
    shortLabel: "Direct Costs / COGS",
    pnlLineId: "exp-cogs",
    expenseGroup: "Direct Costs",
    badgeCls: "text-amber-800 bg-amber-50 border-amber-300",
  },
  employee_benefits: {
    label: "Employee Benefits & Payroll",
    shortLabel: "Employee & Payroll",
    pnlLineId: "exp-emp",
    expenseGroup: "Employee Benefits Expense",
    badgeCls: "text-blue-800 bg-blue-50 border-blue-300",
  },
  cloud_infrastructure: {
    label: "Cloud & Technology Infrastructure",
    shortLabel: "Cloud & Tech Infra",
    pnlLineId: "exp-cloud",
    expenseGroup: "Cloud & Infrastructure Costs",
    badgeCls: "text-indigo-800 bg-indigo-50 border-indigo-300",
  },
  sales_marketing: {
    label: "Sales, BD & Marketing",
    shortLabel: "Sales & Marketing",
    pnlLineId: "exp-mktg",
    expenseGroup: "Sales & Marketing Costs",
    badgeCls: "text-purple-800 bg-purple-50 border-purple-300",
  },
  other_expenses: {
    label: "Admin, Utility, Legal & Audit",
    shortLabel: "Admin & Utilities",
    pnlLineId: "exp-admin",
    expenseGroup: "Other / Admin Expenses",
    badgeCls: "text-emerald-800 bg-emerald-50 border-emerald-300",
  },
  finance_costs: {
    label: "Finance Costs & Bank Interest",
    shortLabel: "Finance Costs",
    pnlLineId: "exp-fin",
    expenseGroup: "Finance Costs",
    badgeCls: "text-rose-800 bg-rose-50 border-rose-300",
  },
  tax_provision: {
    label: "Provision for Current Tax",
    shortLabel: "Tax Provision",
    pnlLineId: "tax-exp",
    expenseGroup: "Tax Expense",
    badgeCls: "text-slate-800 bg-slate-100 border-slate-300",
  },
};

/**
 * Default Expense Provisioning rows:
 * - Fixed Utility Expenses are present by default and directly editable.
 * - Every P&L Expense Head is listed so manual provision can be filled directly against each head.
 */
export const INITIAL_EXPENSE_PROVISIONS: ExpenseProvisionItem[] = [
  {
    id: "prov-util-fixed-1",
    expenseHead: "Fixed Utility Expense — Electricity, Water & Power Charges",
    category: "other_expenses",
    month: "September 2026",
    amount: 45000, // ₹0.45 Lakhs default (editable)
    remarks: "Default monthly utility provision (Electricity & Water bills) — editable",
    vendorOrPayee: "Utility Board / BESCOM",
    voucherRef: "PROV-UTIL-01",
    addedBy: "Default Fixed Utility",
    addedAt: "2026-09-25",
    status: "active",
    isDefaultFixedUtility: true,
    isCoreExpenseHead: true,
  },
  {
    id: "prov-util-fixed-2",
    expenseHead: "Fixed Utility Expense — Office Rent, Internet, Telecom & Maintenance",
    category: "other_expenses",
    month: "September 2026",
    amount: 65000, // ₹0.65 Lakhs default (editable)
    remarks: "Default monthly fixed utility & facility maintenance accrual — editable",
    vendorOrPayee: "Facility / ISP / Landlord",
    voucherRef: "PROV-UTIL-02",
    addedBy: "Default Fixed Utility",
    addedAt: "2026-09-25",
    status: "active",
    isDefaultFixedUtility: true,
    isCoreExpenseHead: true,
  },
  {
    id: "prov-head-cogs",
    expenseHead: "Direct Operational Costs & Third-Party API Gateway Charges",
    category: "cost_of_materials",
    month: "September 2026",
    amount: 0,
    remarks: "Manual provision against Direct Operational Costs / COGS",
    vendorOrPayee: "Direct Vendors",
    voucherRef: "PROV-EXP-01",
    addedBy: "Expense Head Provision",
    addedAt: "2026-09-25",
    status: "active",
    isCoreExpenseHead: true,
  },
  {
    id: "prov-head-emp",
    expenseHead: "Employee Benefit Expenses (Payroll, Bonus & Incentives)",
    category: "employee_benefits",
    month: "September 2026",
    amount: 180000, // ₹1.80 Lakhs
    remarks: "Accrued Q2 variable bonus, incentives & statutory PF/ESI",
    vendorOrPayee: "Employee Payroll Pool",
    voucherRef: "PROV-EXP-02",
    addedBy: "Expense Head Provision",
    addedAt: "2026-09-25",
    status: "active",
    isCoreExpenseHead: true,
  },
  {
    id: "prov-head-cloud",
    expenseHead: "Cloud Computing, AI Model Inference & Hosting Infrastructure",
    category: "cloud_infrastructure",
    month: "September 2026",
    amount: 120000, // ₹1.20 Lakhs
    remarks: "Unbilled September AWS / cloud GPU cluster & SaaS consumption",
    vendorOrPayee: "AWS / Cloud Providers",
    voucherRef: "PROV-EXP-03",
    addedBy: "Expense Head Provision",
    addedAt: "2026-09-25",
    status: "active",
    isCoreExpenseHead: true,
  },
  {
    id: "prov-head-sales",
    expenseHead: "Sales Promotion, Digital Marketing & Enterprise Conferences",
    category: "sales_marketing",
    month: "September 2026",
    amount: 0,
    remarks: "Manual provision against Sales & Marketing head",
    vendorOrPayee: "Marketing Agencies",
    voucherRef: "PROV-EXP-04",
    addedBy: "Expense Head Provision",
    addedAt: "2026-09-25",
    status: "active",
    isCoreExpenseHead: true,
  },
  {
    id: "prov-head-admin",
    expenseHead: "Administrative, Statutory Audit, Legal & CFO Retainership",
    category: "other_expenses",
    month: "September 2026",
    amount: 150000, // ₹1.50 Lakhs
    remarks: "Monthly statutory audit fee & professional retainer provision",
    vendorOrPayee: "CA Singhal & Co / Consultants",
    voucherRef: "PROV-EXP-05",
    addedBy: "Expense Head Provision",
    addedAt: "2026-09-25",
    status: "active",
    isCoreExpenseHead: true,
  },
  {
    id: "prov-head-fin",
    expenseHead: "Finance Costs (Bank Loan Interest & OD Processing Accrual)",
    category: "finance_costs",
    month: "September 2026",
    amount: 0,
    remarks: "Manual provision against Finance Costs & Interest head",
    vendorOrPayee: "Bank / Lenders",
    voucherRef: "PROV-EXP-06",
    addedBy: "Expense Head Provision",
    addedAt: "2026-09-25",
    status: "active",
    isCoreExpenseHead: true,
  },
  {
    id: "prov-head-tax",
    expenseHead: "Current Tax Expense (Corporate Advance Tax Provision)",
    category: "tax_provision",
    month: "September 2026",
    amount: 0,
    remarks: "Manual provision against Corporate Tax Expense head",
    vendorOrPayee: "Income Tax Dept",
    voucherRef: "PROV-EXP-07",
    addedBy: "Expense Head Provision",
    addedAt: "2026-09-25",
    status: "active",
    isCoreExpenseHead: true,
  },
];

export const STANDARD_FIXED_PROVISIONS: {
  expenseHead: string;
  category: ExpenseProvisionCategory;
  amount: number;
  vendorOrPayee: string;
  remarks: string;
  isDefaultFixedUtility?: boolean;
}[] = INITIAL_EXPENSE_PROVISIONS.map((p) => ({
  expenseHead: p.expenseHead,
  category: p.category,
  amount: p.amount,
  vendorOrPayee: p.vendorOrPayee || "",
  remarks: p.remarks || "",
  isDefaultFixedUtility: p.isDefaultFixedUtility,
}));

/**
 * Ensures all default Fixed Utility rows and Core P&L Expense Heads are always present
 * in the provisions list while preserving user edits and custom rows.
 */
export function ensureDefaultExpenseHeadProvisions(
  existing?: ExpenseProvisionItem[],
  currentMonth: string = "September 2026",
): ExpenseProvisionItem[] {
  if (!existing || existing.length === 0) {
    return INITIAL_EXPENSE_PROVISIONS.map((item) => ({
      ...item,
      month: currentMonth,
    }));
  }

  // Check if the list already has our structured default heads
  const hasStructuredDefaults = existing.some(
    (p) => p.id.startsWith("prov-util-fixed") || p.id.startsWith("prov-head-"),
  );

  if (hasStructuredDefaults) {
    // Ensure any missing default head is included
    const existingById = new Map(existing.map((p) => [p.id, p]));
    const mergedDefaults = INITIAL_EXPENSE_PROVISIONS.map((def) => {
      const found = existingById.get(def.id);
      if (found) {
        existingById.delete(def.id);
        return found;
      }
      return { ...def, month: currentMonth };
    });
    return [...mergedDefaults, ...Array.from(existingById.values())];
  }

  // Migrate legacy 4-item list smoothly into the structured Expense Head + Fixed Utility table
  return INITIAL_EXPENSE_PROVISIONS.map((def) => ({
    ...def,
    month: currentMonth,
  }));
}

/**
 * Merges uploaded Excel provision rows into the Expense Head + Fixed Utility list
 */
export function mergeUploadedProvisionsWithHeads(
  currentList: ExpenseProvisionItem[],
  uploadedItems: ExpenseProvisionItem[],
  mode: "append" | "replace",
): ExpenseProvisionItem[] {
  const baseList =
    mode === "replace"
      ? INITIAL_EXPENSE_PROVISIONS.map((d) => ({ ...d, amount: 0 }))
      : [...currentList];

  const result = baseList.map((item) => ({ ...item }));
  const unmatchedUploads: ExpenseProvisionItem[] = [];

  uploadedItems.forEach((up) => {
    const upHeadLower = up.expenseHead.trim().toLowerCase();
    const matchIdx = result.findIndex((existing) => {
      const exLower = existing.expenseHead.trim().toLowerCase();
      if (exLower === upHeadLower) return true;
      if (
        existing.isDefaultFixedUtility &&
        upHeadLower.includes("utility") &&
        ((exLower.includes("electricity") && upHeadLower.includes("electricity")) ||
          (exLower.includes("rent") && upHeadLower.includes("rent")))
      ) {
        return true;
      }
      return false;
    });

    if (matchIdx !== -1) {
      result[matchIdx] = {
        ...result[matchIdx],
        amount: up.amount,
        remarks: up.remarks || result[matchIdx].remarks,
        vendorOrPayee: up.vendorOrPayee || result[matchIdx].vendorOrPayee,
        month: up.month || result[matchIdx].month,
        status: "active",
      };
    } else if (up.amount > 0) {
      unmatchedUploads.push(up);
    }
  });

  return [...result, ...unmatchedUploads];
}

const CATEGORY_SHEET_LABEL: Record<ExpenseProvisionCategory, string> = {
  cost_of_materials: "Cost of Materials",
  employee_benefits: "Employee Benefits",
  cloud_infrastructure: "Cloud & Infrastructure",
  sales_marketing: "Sales & Marketing",
  other_expenses: "Other Expenses",
  finance_costs: "Finance Costs",
  tax_provision: "Tax Provision",
};

/**
 * Downloads a simple, standardized Excel template for uploading expense provisions
 * pre-filled with Fixed Utility Expenses (default & editable) and each P&L Expense Head.
 */
export function downloadProvisionsExcelTemplate(
  companyName: string = "Nexora Innovations",
  month: string = "September 2026",
  currentProvisions?: ExpenseProvisionItem[],
) {
  const wb = XLSX.utils.book_new();
  const rowsToExport =
    currentProvisions && currentProvisions.length > 0
      ? currentProvisions
      : INITIAL_EXPENSE_PROVISIONS;

  const headers: (string | number)[][] = [
    [`${companyName} - MIS EXPENSE PROVISIONING TEMPLATE (${month})`],
    [
      "Instructions: Fill or edit the 'Manual Provision Amount (₹)' against each Expense Head. Fixed Utility Expenses are included by default and editable. Upload this sheet back to update P&L provisions.",
    ],
    [
      "Allowed Categories: 'Cost of Materials', 'Employee Benefits', 'Cloud & Infrastructure', 'Sales & Marketing', 'Other Expenses', 'Finance Costs', 'Tax Provision'",
    ],
    [],
    [
      "Expense Head",
      "Category",
      "Head Type",
      "Manual Provision Amount (₹)",
      "Month",
      "Remarks / Basis",
    ],
    ...rowsToExport.map((p) => [
      p.expenseHead,
      CATEGORY_SHEET_LABEL[p.category] || "Other Expenses",
      p.isDefaultFixedUtility ? "Fixed Utility (Default & Editable)" : "P&L Expense Head",
      p.amount,
      p.month || month,
      p.remarks || "",
    ]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(headers);

  ws["!cols"] = [{ wch: 56 }, { wch: 24 }, { wch: 30 }, { wch: 26 }, { wch: 18 }, { wch: 48 }];

  XLSX.utils.book_append_sheet(wb, ws, "Expense Provisions");

  const fileName = `MIS_Expense_Provisions_Template_${companyName.replace(/\s+/g, "_")}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

/**
 * Parses an uploaded provisions spreadsheet (Excel or CSV)
 */
export async function parseProvisionsExcel(file: File): Promise<ExpenseProvisionItem[]> {
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });

  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("Uploaded workbook does not contain any sheets.");
  }

  const ws = wb.Sheets[firstSheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  if (rows.length < 2) {
    throw new Error("Sheet is empty or has insufficient rows.");
  }

  // Find header row (looks for "Expense Head" or "Category" or "Amount")
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const rowStr = rows[i].map((c) => String(c).toLowerCase()).join(" ");
    if (
      (rowStr.includes("expense") || rowStr.includes("head") || rowStr.includes("particular")) &&
      (rowStr.includes("amount") || rowStr.includes("category") || rowStr.includes("provision"))
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0;
  }

  const headerRow = rows[headerIndex].map((c) => String(c).toLowerCase().trim());

  const colIdx = {
    head: headerRow.findIndex(
      (h) =>
        h.includes("head") ||
        h.includes("particular") ||
        h.includes("name") ||
        h.includes("expense"),
    ),
    category: headerRow.findIndex(
      (h) =>
        h.includes("category") ||
        h.includes("group") ||
        (h.includes("type") && !h.includes("head type")),
    ),
    headType: headerRow.findIndex((h) => h.includes("head type")),
    month: headerRow.findIndex((h) => h.includes("month") || h.includes("period")),
    amount: headerRow.findIndex(
      (h) =>
        h.includes("amount") ||
        h.includes("provision") ||
        h.includes("value") ||
        h.includes("inr") ||
        h.includes("₹"),
    ),
    vendor: headerRow.findIndex(
      (h) => h.includes("vendor") || h.includes("payee") || h.includes("party"),
    ),
    voucher: headerRow.findIndex(
      (h) => h.includes("voucher") || h.includes("ref") || h.includes("jv"),
    ),
    remarks: headerRow.findIndex(
      (h) =>
        h.includes("remark") ||
        h.includes("note") ||
        h.includes("basis") ||
        h.includes("reason") ||
        h.includes("justification"),
    ),
  };

  const parsedItems: ExpenseProvisionItem[] = [];

  for (let r = headerIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const head = colIdx.head !== -1 ? cleanText(row[colIdx.head]) : cleanText(row[0]);
    if (
      !head ||
      head.toLowerCase().startsWith("total") ||
      head.toLowerCase().startsWith("instruction") ||
      head.toLowerCase().startsWith("allowed categories")
    ) {
      continue;
    }

    const rawCategory = colIdx.category !== -1 ? cleanText(row[colIdx.category]).toLowerCase() : "";
    const headLower = head.toLowerCase();
    let category: ExpenseProvisionCategory = "other_expenses";

    if (
      rawCategory.includes("material") ||
      rawCategory.includes("cogs") ||
      rawCategory.includes("direct") ||
      headLower.includes("direct operational") ||
      headLower.includes("cost of material")
    ) {
      category = "cost_of_materials";
    } else if (
      rawCategory.includes("employee") ||
      rawCategory.includes("salary") ||
      rawCategory.includes("payroll") ||
      rawCategory.includes("benefit") ||
      headLower.includes("employee") ||
      headLower.includes("payroll")
    ) {
      category = "employee_benefits";
    } else if (
      rawCategory.includes("cloud") ||
      rawCategory.includes("hosting") ||
      rawCategory.includes("infra") ||
      rawCategory.includes("aws") ||
      headLower.includes("cloud") ||
      headLower.includes("hosting")
    ) {
      category = "cloud_infrastructure";
    } else if (
      rawCategory.includes("sales") ||
      rawCategory.includes("marketing") ||
      rawCategory.includes("commission") ||
      headLower.includes("sales promotion") ||
      headLower.includes("marketing")
    ) {
      category = "sales_marketing";
    } else if (
      rawCategory.includes("finance") ||
      rawCategory.includes("interest") ||
      rawCategory.includes("bank") ||
      headLower.includes("finance cost")
    ) {
      category = "finance_costs";
    } else if (
      rawCategory.includes("tax") ||
      headLower.includes("tax expense") ||
      headLower.includes("tax provision")
    ) {
      category = "tax_provision";
    }

    const month =
      colIdx.month !== -1 && cleanText(row[colIdx.month])
        ? cleanText(row[colIdx.month])
        : "September 2026";
    const amount =
      colIdx.amount !== -1
        ? Math.max(0, cleanNumber(row[colIdx.amount]))
        : Math.max(0, cleanNumber(row[3]));

    const headTypeStr = colIdx.headType !== -1 ? cleanText(row[colIdx.headType]).toLowerCase() : "";
    const isDefaultFixedUtility =
      headTypeStr.includes("utility") || headLower.includes("fixed utility");

    const vendor = colIdx.vendor !== -1 ? cleanText(row[colIdx.vendor]) : undefined;
    const voucher = colIdx.voucher !== -1 ? cleanText(row[colIdx.voucher]) : undefined;
    const remarks = colIdx.remarks !== -1 ? cleanText(row[colIdx.remarks]) : undefined;

    parsedItems.push({
      id: `prov-upload-${Date.now()}-${r}`,
      expenseHead: head,
      category,
      month,
      amount,
      vendorOrPayee: vendor || undefined,
      voucherRef: voucher || undefined,
      remarks: remarks || undefined,
      addedBy: "Excel Template Upload",
      addedAt: new Date().toISOString().split("T")[0],
      status: "active",
      isDefaultFixedUtility,
      isCoreExpenseHead: true,
    });
  }

  if (parsedItems.length === 0) {
    throw new Error("No valid provision line items could be parsed from the sheet. Check columns.");
  }

  return parsedItems;
}

/**
 * Recalculates P&L statement by applying active expense provisions to raw books
 */
export function calculateAdjustedPnlStatement(
  rawPnl: PnlStatementData,
  provisions: ExpenseProvisionItem[],
  includeProvisions: boolean,
): {
  adjustedPnl: PnlStatementData;
  totalProvisionsAmount: number;
  provisionsByCategory: Record<ExpenseProvisionCategory, number>;
  provisionsByMonth: Record<string, number>;
  activeProvisionsList: ExpenseProvisionItem[];
} {
  const activeProvisions = (provisions || []).filter((p) => p.status === "active");

  const provisionsByCategory: Record<ExpenseProvisionCategory, number> = {
    cost_of_materials: 0,
    employee_benefits: 0,
    cloud_infrastructure: 0,
    sales_marketing: 0,
    other_expenses: 0,
    finance_costs: 0,
    tax_provision: 0,
  };

  const provisionsByMonth: Record<string, number> = {};
  let totalProvisionsAmount = 0;

  activeProvisions.forEach((prov) => {
    const amt = prov.amount || 0;
    totalProvisionsAmount += amt;
    provisionsByCategory[prov.category] = (provisionsByCategory[prov.category] || 0) + amt;
    provisionsByMonth[prov.month] = (provisionsByMonth[prov.month] || 0) + amt;
  });

  if (!includeProvisions || totalProvisionsAmount === 0) {
    return {
      adjustedPnl: rawPnl,
      totalProvisionsAmount,
      provisionsByCategory,
      provisionsByMonth,
      activeProvisionsList: activeProvisions,
    };
  }

  const currentMonthKey = rawPnl.currentMonthKey || "September 2026";
  // Apply provisions matching currentMonthKey, or all active provisions if month matches/is default
  const currentMonthProvisions = activeProvisions.filter(
    (p) => !p.month || p.month === currentMonthKey,
  );

  const currProvByCat: Record<ExpenseProvisionCategory, number> = {
    cost_of_materials: 0,
    employee_benefits: 0,
    cloud_infrastructure: 0,
    sales_marketing: 0,
    other_expenses: 0,
    finance_costs: 0,
    tax_provision: 0,
  };

  currentMonthProvisions.forEach((p) => {
    currProvByCat[p.category] = (currProvByCat[p.category] || 0) + (p.amount || 0);
  });

  // Calculate adjusted current month expenses
  const adjExpenses = {
    costOfMaterialsOrDirectCosts:
      rawPnl.expenses.costOfMaterialsOrDirectCosts + currProvByCat.cost_of_materials,
    employeeBenefitsExpense:
      rawPnl.expenses.employeeBenefitsExpense + currProvByCat.employee_benefits,
    cloudAndInfrastructureCosts:
      (rawPnl.expenses.cloudAndInfrastructureCosts || 0) + currProvByCat.cloud_infrastructure,
    salesAndMarketingCosts:
      (rawPnl.expenses.salesAndMarketingCosts || 0) + currProvByCat.sales_marketing,
    otherExpenses: rawPnl.expenses.otherExpenses + currProvByCat.other_expenses,
    financeCosts: rawPnl.expenses.financeCosts + currProvByCat.finance_costs,
    depreciationAndAmortization: rawPnl.expenses.depreciationAndAmortization,
    totalExpenses: 0,
  };

  adjExpenses.totalExpenses =
    adjExpenses.costOfMaterialsOrDirectCosts +
    adjExpenses.employeeBenefitsExpense +
    adjExpenses.cloudAndInfrastructureCosts +
    adjExpenses.salesAndMarketingCosts +
    adjExpenses.otherExpenses +
    adjExpenses.financeCosts +
    adjExpenses.depreciationAndAmortization;

  const rev = rawPnl.income.revenueFromOperations || 1;
  const grossProfit = rev - adjExpenses.costOfMaterialsOrDirectCosts;
  const grossMarginPercent = Number(((grossProfit / rev) * 100).toFixed(1));

  // EBITDA = Total Income - Operating Expenses (excluding Finance costs & Depreciation)
  const operatingExpenses =
    adjExpenses.costOfMaterialsOrDirectCosts +
    adjExpenses.employeeBenefitsExpense +
    adjExpenses.cloudAndInfrastructureCosts +
    adjExpenses.salesAndMarketingCosts +
    adjExpenses.otherExpenses;

  const ebitda = rawPnl.income.totalIncome - operatingExpenses;
  const ebitdaMarginPercent = Number(((ebitda / rev) * 100).toFixed(1));

  const pbt = ebitda - adjExpenses.financeCosts - adjExpenses.depreciationAndAmortization;
  const pbtMarginPercent = Number(((pbt / rev) * 100).toFixed(1));

  const currentTax = rawPnl.profitability.currentTax + currProvByCat.tax_provision;
  const pat = pbt - currentTax - (rawPnl.profitability.deferredTax || 0);
  const patMarginPercent = Number(((pat / rev) * 100).toFixed(1));

  // Clone and adjust line items for multi-month table
  const adjLineItems: PnlLineItem[] = (rawPnl.lineItems || []).map((item) => {
    let addCurr = 0;
    let addYtd = 0;
    let noteAddition = "";
    const pLower = item.particulars.toLowerCase();

    if (
      item.id === "exp-cogs" ||
      pLower.includes("cost of material") ||
      pLower.includes("direct operational")
    ) {
      addCurr = currProvByCat.cost_of_materials;
      addYtd = provisionsByCategory.cost_of_materials;
      noteAddition = addCurr
        ? `Includes ₹${(addCurr / 100000).toFixed(2)}L direct cost provision`
        : "";
    } else if (item.id === "exp-emp" || pLower.includes("employee")) {
      addCurr = currProvByCat.employee_benefits;
      addYtd = provisionsByCategory.employee_benefits;
      noteAddition = addCurr
        ? `Includes ₹${(addCurr / 100000).toFixed(2)}L payroll/incentive provision`
        : "";
    } else if (item.id === "exp-cloud" || pLower.includes("cloud")) {
      addCurr = currProvByCat.cloud_infrastructure;
      addYtd = provisionsByCategory.cloud_infrastructure;
      noteAddition = addCurr
        ? `Includes ₹${(addCurr / 100000).toFixed(2)}L cloud unbilled accrual`
        : "";
    } else if (
      item.id === "exp-sales" ||
      item.id === "exp-mktg" ||
      pLower.includes("marketing") ||
      pLower.includes("sales promotion")
    ) {
      addCurr = currProvByCat.sales_marketing;
      addYtd = provisionsByCategory.sales_marketing;
      noteAddition = addCurr
        ? `Includes ₹${(addCurr / 100000).toFixed(2)}L marketing provision`
        : "";
    } else if (
      item.id === "exp-other" ||
      item.id === "exp-admin" ||
      pLower.includes("other expenses") ||
      pLower.includes("administrative")
    ) {
      addCurr = currProvByCat.other_expenses;
      addYtd = provisionsByCategory.other_expenses;
      noteAddition = addCurr
        ? `Includes ₹${(addCurr / 100000).toFixed(2)}L fixed utility & admin provisions`
        : "";
    } else if (item.id === "exp-fin" || pLower.includes("finance costs")) {
      addCurr = currProvByCat.finance_costs;
      addYtd = provisionsByCategory.finance_costs;
      noteAddition = addCurr ? `Includes ₹${(addCurr / 100000).toFixed(2)}L interest accrual` : "";
    } else if (item.id === "tax-exp" || pLower.includes("current tax")) {
      addCurr = currProvByCat.tax_provision;
      addYtd = provisionsByCategory.tax_provision;
      noteAddition = addCurr ? `Includes ₹${(addCurr / 100000).toFixed(2)}L tax provision` : "";
    }

    if (item.id === "ebitda-sub") {
      const ebitdaDiff = ebitda - rawPnl.profitability.ebitda;
      const varianceVsPrev = ebitda - item.previousMonth;
      const varianceVsPrevPct =
        item.previousMonth !== 0
          ? Number(((varianceVsPrev / Math.abs(item.previousMonth)) * 100).toFixed(1))
          : 0;
      return {
        ...item,
        currentMonth: ebitda,
        ytdCurrentYear: item.ytdCurrentYear + ebitdaDiff,
        varianceVsPrevious: varianceVsPrev,
        varianceVsPreviousPct: varianceVsPrevPct,
        momGrowthPct: varianceVsPrevPct,
        varianceRemarks: `Adjusted with provisions (-₹${(Math.abs(ebitdaDiff) / 100000).toFixed(2)}L)`,
        monthlyBreakdown: {
          ...(item.monthlyBreakdown || {}),
          [currentMonthKey]: ebitda,
        },
      };
    }

    if (item.id === "tot-exp" || pLower.includes("total expenses")) {
      const totDiff = adjExpenses.totalExpenses - rawPnl.expenses.totalExpenses;
      const varianceVsPrev = adjExpenses.totalExpenses - item.previousMonth;
      const varianceVsPrevPct =
        item.previousMonth !== 0
          ? Number(((varianceVsPrev / Math.abs(item.previousMonth)) * 100).toFixed(1))
          : 0;
      return {
        ...item,
        currentMonth: adjExpenses.totalExpenses,
        ytdCurrentYear: item.ytdCurrentYear + totDiff,
        varianceVsPrevious: varianceVsPrev,
        varianceVsPreviousPct: varianceVsPrevPct,
        momGrowthPct: varianceVsPrevPct,
        varianceRemarks: `Total includes ₹${(totDiff / 100000).toFixed(2)}L expense provisions`,
        monthlyBreakdown: {
          ...(item.monthlyBreakdown || {}),
          [currentMonthKey]: adjExpenses.totalExpenses,
        },
      };
    }

    if (item.id === "pbt-total") {
      const pbtDiff = pbt - rawPnl.profitability.pbt;
      const varianceVsPrev = pbt - item.previousMonth;
      const varianceVsPrevPct =
        item.previousMonth !== 0
          ? Number(((varianceVsPrev / Math.abs(item.previousMonth)) * 100).toFixed(1))
          : 0;
      return {
        ...item,
        currentMonth: pbt,
        ytdCurrentYear: item.ytdCurrentYear + pbtDiff,
        varianceVsPrevious: varianceVsPrev,
        varianceVsPreviousPct: varianceVsPrevPct,
        momGrowthPct: varianceVsPrevPct,
        varianceRemarks: `Adjusted PBT after expense provisions`,
        monthlyBreakdown: {
          ...(item.monthlyBreakdown || {}),
          [currentMonthKey]: pbt,
        },
      };
    }

    if (item.id === "pat-final") {
      const patDiff = pat - rawPnl.profitability.pat;
      const varianceVsPrev = pat - item.previousMonth;
      const varianceVsPrevPct =
        item.previousMonth !== 0
          ? Number(((varianceVsPrev / Math.abs(item.previousMonth)) * 100).toFixed(1))
          : 0;
      return {
        ...item,
        currentMonth: pat,
        ytdCurrentYear: item.ytdCurrentYear + patDiff,
        varianceVsPrevious: varianceVsPrev,
        varianceVsPreviousPct: varianceVsPrevPct,
        momGrowthPct: varianceVsPrevPct,
        varianceRemarks: `Adjusted Net PAT after ₹${(totalProvisionsAmount / 100000).toFixed(2)}L provisions`,
        monthlyBreakdown: {
          ...(item.monthlyBreakdown || {}),
          [currentMonthKey]: pat,
        },
      };
    }

    if (addCurr || addYtd) {
      const newCurr = item.currentMonth + addCurr;
      const newYtd = item.ytdCurrentYear + addYtd;
      const varianceVsPrev = newCurr - item.previousMonth;
      const varianceVsPrevPct =
        item.previousMonth !== 0
          ? Number(((varianceVsPrev / Math.abs(item.previousMonth)) * 100).toFixed(1))
          : 0;
      const updatedBreakdown = { ...(item.monthlyBreakdown || {}) };
      if (updatedBreakdown[currentMonthKey] !== undefined) {
        updatedBreakdown[currentMonthKey] += addCurr;
      }
      return {
        ...item,
        currentMonth: newCurr,
        ytdCurrentYear: newYtd,
        varianceVsPrevious: varianceVsPrev,
        varianceVsPreviousPct: varianceVsPrevPct,
        momGrowthPct: varianceVsPrevPct,
        varianceRemarks: noteAddition || item.varianceRemarks,
        monthlyBreakdown: updatedBreakdown,
      };
    }

    return item;
  });

  const adjustedPnl: PnlStatementData = {
    ...rawPnl,
    expenses: adjExpenses,
    profitability: {
      ...rawPnl.profitability,
      grossProfit,
      grossMarginPercent,
      ebitda,
      ebitdaMarginPercent,
      pbt,
      pbtMarginPercent,
      currentTax,
      pat,
      patMarginPercent,
    },
    lineItems: adjLineItems,
  };

  return {
    adjustedPnl,
    totalProvisionsAmount,
    provisionsByCategory,
    provisionsByMonth,
    activeProvisionsList: activeProvisions,
  };
}
