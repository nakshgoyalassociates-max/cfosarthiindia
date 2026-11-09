import * as XLSX from "xlsx";
import { BudgetLineItem, BudgetMonthKey } from "../types";
import { calculateItemVariance, CATEGORY_DEFINITIONS } from "../data/mockBudgetData";

export interface ParsedExcelRow {
  code: string;
  name: string;
  category?: string;
  budget?: number;
  actual: number;
  notes?: string;
  matchedItemId?: string;
  matchStatus: "matched" | "not_found" | "invalid_number";
  calculatedVariance?: number;
  calculatedVariancePercent?: number;
  isBreach?: boolean;
}

/**
 * Generates and downloads a pre-formatted Excel template for entering monthly actual figures
 */
export function generateBudgetTemplateExcel(
  items: BudgetLineItem[],
  monthKey: BudgetMonthKey,
  monthLabel: string,
  companyName: string,
) {
  const headers = [
    "Line Item Code",
    "Line Item Name",
    "Budget Category",
    "Sub Category",
    `Budget Amount (${monthLabel})`,
    `Actual Amount (${monthLabel}) - ENTER HERE`,
    "Operational Notes / Variance Reason",
  ];

  const rows = items.map((item) => {
    const monthData = item.monthly[monthKey] || { budget: 0, actual: 0 };
    return [
      item.code,
      item.name,
      CATEGORY_DEFINITIONS[item.category]?.shortName || item.category,
      item.subCategory,
      monthData.budget,
      monthData.actual > 0 ? monthData.actual : "", // prefill if already entered or blank
      monthData.notes || "",
    ];
  });

  const wsData = [
    [`${companyName} - Monthly Actuals Input Template (${monthLabel})`],
    [
      'Instructions: Enter your actual figures in the "Actual Amount" column. Do not change Line Item Code.',
    ],
    [],
    headers,
    ...rows,
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column widths
  ws["!cols"] = [
    { wch: 15 }, // Code
    { wch: 45 }, // Name
    { wch: 22 }, // Category
    { wch: 22 }, // Sub Category
    { wch: 18 }, // Budget
    { wch: 24 }, // Actual
    { wch: 40 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Actuals_${monthKey.toUpperCase()}`);

  const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Actuals_Template_${monthKey.toUpperCase()}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export const MAX_EXCEL_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Parses an uploaded Excel file (.xlsx, .xls, .csv) and matches rows against current budget line items
 */
export async function parseActualsFromExcel(
  file: File,
  targetMonthKey: BudgetMonthKey,
  currentItems: BudgetLineItem[],
): Promise<{
  rows: ParsedExcelRow[];
  totalRows: number;
  matchedCount: number;
  unmatchedCount: number;
  breachCount: number;
}> {
  if (file.size > MAX_EXCEL_FILE_SIZE_BYTES) {
    throw new Error(
      `File exceeds maximum size of 5 MB (uploaded: ${(file.size / (1024 * 1024)).toFixed(2)} MB). Please upload a smaller spreadsheet.`,
    );
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("The uploaded Excel file contains no readable sheets.");
        }

        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        // Convert to array of arrays to handle varied header row positions
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

        if (!rawRows || rawRows.length === 0) {
          throw new Error("The uploaded file is empty.");
        }

        // Find header row containing "Code" or "Actual" or "Name"
        let headerRowIndex = -1;
        let codeColIndex = -1;
        let nameColIndex = -1;
        let actualColIndex = -1;
        let notesColIndex = -1;
        let budgetColIndex = -1;

        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const row = rawRows[i];
          if (!Array.isArray(row)) continue;

          let rowCodeCol = -1;
          let rowNameCol = -1;
          let rowActualCol = -1;
          let rowNotesCol = -1;
          let rowBudgetCol = -1;

          for (let j = 0; j < row.length; j++) {
            const cellText = String(row[j] || "")
              .trim()
              .toLowerCase();
            if (!cellText) continue;
            // Ignore long instruction sentences
            if (cellText.startsWith("instructions:") || cellText.length > 60) continue;

            if (cellText.includes("code") && rowCodeCol === -1) {
              rowCodeCol = j;
            } else if (
              (cellText.includes("actual") ||
                cellText.includes("actuals") ||
                cellText.includes("realized")) &&
              rowActualCol === -1
            ) {
              rowActualCol = j;
            } else if (
              (cellText.includes("item name") ||
                cellText.includes("line item") ||
                cellText.includes("description") ||
                cellText === "name") &&
              rowNameCol === -1
            ) {
              rowNameCol = j;
            } else if (
              cellText.includes("note") ||
              cellText.includes("remark") ||
              cellText.includes("reason")
            ) {
              rowNotesCol = j;
            } else if (cellText.includes("budget")) {
              rowBudgetCol = j;
            }
          }

          if (rowActualCol !== -1 && (rowCodeCol !== -1 || rowNameCol !== -1)) {
            headerRowIndex = i;
            codeColIndex = rowCodeCol;
            nameColIndex = rowNameCol;
            actualColIndex = rowActualCol;
            notesColIndex = rowNotesCol;
            budgetColIndex = rowBudgetCol;
            break;
          }
        }

        // Reject files whose headers don't match the expected template columns
        if (
          headerRowIndex === -1 ||
          actualColIndex === -1 ||
          (codeColIndex === -1 && nameColIndex === -1)
        ) {
          throw new Error(
            'Template Column Mismatch: The uploaded sheet does not match the expected template columns. Required columns: "Line Item Code" (or "Line Item Name") and "Actual Amount". Please download and use the official Excel Template.',
          );
        }

        const parsedRows: ParsedExcelRow[] = [];
        let matchedCount = 0;
        let unmatchedCount = 0;
        let breachCount = 0;

        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          const rawCode = codeColIndex !== -1 ? String(row[codeColIndex] || "").trim() : "";
          const rawName = nameColIndex !== -1 ? String(row[nameColIndex] || "").trim() : "";
          const rawActual = actualColIndex !== -1 ? row[actualColIndex] : "";
          const rawNotes = notesColIndex !== -1 ? String(row[notesColIndex] || "").trim() : "";

          // Skip completely empty spacer rows
          if (!rawCode && !rawName && (rawActual === "" || rawActual === undefined)) {
            continue;
          }

          // Convert actual to clean number (removing commas, currency symbols)
          let numActual = 0;
          let isValidNumber = true;

          if (typeof rawActual === "number") {
            numActual = rawActual;
          } else if (typeof rawActual === "string") {
            const cleaned = rawActual.replace(/[₹$,\s]/g, "");
            if (cleaned === "") {
              numActual = 0;
            } else {
              const parsed = parseFloat(cleaned);
              if (isNaN(parsed)) {
                isValidNumber = false;
              } else {
                numActual = parsed;
              }
            }
          }

          // Match against current budget items
          let matchedItem: BudgetLineItem | undefined;
          if (rawCode) {
            matchedItem = currentItems.find(
              (it) => it.code.toLowerCase() === rawCode.toLowerCase(),
            );
          }
          if (!matchedItem && rawName) {
            matchedItem = currentItems.find(
              (it) =>
                it.name.toLowerCase() === rawName.toLowerCase() ||
                it.name.toLowerCase().includes(rawName.toLowerCase()) ||
                rawName.toLowerCase().includes(it.name.toLowerCase()),
            );
          }

          let matchStatus: "matched" | "not_found" | "invalid_number" = "not_found";
          let calcVariance = 0;
          let calcVariancePercent = 0;
          let isBreach = false;

          if (!isValidNumber) {
            matchStatus = "invalid_number";
            unmatchedCount++;
          } else if (matchedItem) {
            matchStatus = "matched";
            matchedCount++;
            const budgetVal = matchedItem.monthly[targetMonthKey]?.budget || 0;
            calcVariance = numActual - budgetVal;
            calcVariancePercent = budgetVal > 0 ? (calcVariance / budgetVal) * 100 : 0;
            if (Math.abs(calcVariancePercent) > 5) {
              isBreach = true;
              breachCount++;
            }
          } else {
            matchStatus = "not_found";
            unmatchedCount++;
          }

          parsedRows.push({
            code: matchedItem?.code || rawCode,
            name: matchedItem?.name || rawName || "Unidentified Row",
            category: matchedItem?.category,
            budget: matchedItem ? matchedItem.monthly[targetMonthKey]?.budget || 0 : undefined,
            actual: numActual,
            notes: rawNotes,
            matchedItemId: matchedItem?.id,
            matchStatus,
            calculatedVariance: calcVariance,
            calculatedVariancePercent: calcVariancePercent,
            isBreach,
          });
        }

        resolve({
          rows: parsedRows,
          totalRows: parsedRows.length,
          matchedCount,
          unmatchedCount,
          breachCount,
        });
      } catch (err: any) {
        reject(
          new Error(err?.message || "Failed to process Excel workbook. Please verify format."),
        );
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed reading file from browser memory."));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Exports complete variance report with highlighted breaches and summary metrics
 */
export function exportVarianceReportExcel(
  items: BudgetLineItem[],
  monthKey: BudgetMonthKey,
  monthLabel: string,
  companyName: string,
) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Detailed Variance Matrix
  const detailedHeaders = [
    "Code",
    "Category",
    "Sub-Category",
    "Line Item Name",
    `Budget (₹)`,
    `Actual (₹)`,
    `Variance Amount (₹)`,
    `Variance %`,
    `Variance Type`,
    `Breach Status (>5%)`,
    "Operational Notes",
  ];

  const detailedRows = items.map((item) => {
    const vr = calculateItemVariance(item, monthKey);
    return [
      item.code,
      CATEGORY_DEFINITIONS[item.category]?.name || item.category,
      item.subCategory,
      item.name,
      vr.budget,
      vr.actual,
      vr.varianceAmount,
      Number(vr.variancePercent.toFixed(2)),
      vr.varianceType.toUpperCase(),
      vr.isExceeding5Percent ? `BREACH (${vr.alertBadgeText})` : "On Track (±5%)",
      item.monthly[monthKey]?.notes || "",
    ];
  });

  const wsDetailed = XLSX.utils.aoa_to_sheet([
    [`${companyName} - Comprehensive Monthly Budget Variance Report`],
    [`Reporting Period: ${monthLabel} | Variance Threshold: ±5.0%`],
    [],
    detailedHeaders,
    ...detailedRows,
  ]);

  wsDetailed["!cols"] = [
    { wch: 12 },
    { wch: 25 },
    { wch: 20 },
    { wch: 42 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 14 },
    { wch: 16 },
    { wch: 30 },
    { wch: 35 },
  ];

  XLSX.utils.book_append_sheet(wb, wsDetailed, `Variance_${monthKey.toUpperCase()}`);

  const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Variance_Report_${monthKey.toUpperCase()}.xlsx`;
  XLSX.writeFile(wb, filename);
}
