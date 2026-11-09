import * as XLSX from "xlsx";
import { ThreeMonthCashBudgetModel, WeeklyCashFlowLineItem } from "../types";

export function generate13WeekCashFlowExcel(
  model: ThreeMonthCashBudgetModel,
  companyName: string = "Company",
): string {
  const wb = XLSX.utils.book_new();

  // Create Grid rows
  const rows: any[] = [];

  // Header Banner
  rows.push(["VIRTUAL CFO 3-MONTH WEEKLY CASH FLOW BUDGET & LIQUIDITY PLANNER"]);
  rows.push([`Company: ${companyName}`]);
  rows.push([
    `Period: ${model.months.join(" • ")} | Starting Liquid Cash: ₹${model.startingCashBalance.toLocaleString("en-IN")} | Minimum Safe Buffer: ₹${model.minimumSafeBuffer.toLocaleString("en-IN")}`,
  ]);
  rows.push([]);

  // Table Column Headers:
  // Col 0: Section
  // Col 1: Category
  // Col 2: Line Item Name
  // Then for each week: [W1 Bud, W1 Act, W2 Bud, W2 Act, ...]
  const headerRow1 = ["Category", "Section", "Cash Flow Line Item"];
  const headerRow2 = ["", "", ""];

  model.weeks.forEach((w) => {
    headerRow1.push(`${w.monthName} - ${w.weekLabel} (${w.dateRange})`, "");
    headerRow2.push("Budget (₹)", "Actual (₹)");
  });

  rows.push(headerRow1);
  rows.push(headerRow2);

  // Inflows
  rows.push(["--- CASH INFLOWS ---"]);
  model.items
    .filter((it) => it.category === "inflow")
    .forEach((it) => {
      const rowData: any[] = ["Inflow", it.section, it.name];
      model.weeks.forEach((w) => {
        const data = it.weekly[w.id];
        rowData.push(data?.budget || 0);
        rowData.push(typeof data?.actual === "number" ? data.actual : "");
      });
      rows.push(rowData);
    });

  // Outflows
  rows.push([]);
  rows.push(["--- CASH OUTFLOWS ---"]);
  model.items
    .filter((it) => it.category === "outflow")
    .forEach((it) => {
      const rowData: any[] = ["Outflow", it.section, it.name];
      model.weeks.forEach((w) => {
        const data = it.weekly[w.id];
        rowData.push(data?.budget || 0);
        rowData.push(typeof data?.actual === "number" ? data.actual : "");
      });
      rows.push(rowData);
    });

  // Instructions Sheet
  const instructions = [
    ["HOW TO USE THIS 3-MONTH WEEKLY CASH FLOW WORKBOOK"],
    [""],
    ["1. Objective:"],
    ["   Track week-by-week cash movements against budget to identify liquidity deficits early."],
    [""],
    ["2. Account Manager Weekly Workflow:"],
    ["   - Update the 'Actual (₹)' column at the end of each weekly bank reconciliation."],
    ["   - Enter actual receipts from clients and actual disbursements made."],
    ["   - Save and re-upload into the Virtual CFO portal to update the management dashboard."],
    [""],
    ["3. Management Decision Triggers:"],
    [
      "   - If projected closing cash falls below the Minimum Safe Buffer, enact shortage mitigation actions.",
    ],
    ["   - Mitigation levers: Call overdue debtors, draw OD limit, or stagger vendor payouts."],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wsGuide = XLSX.utils.aoa_to_sheet(instructions);

  // Styling / Widths
  ws["!cols"] = [
    { wch: 12 },
    { wch: 20 },
    { wch: 45 },
    ...model.weeks.flatMap(() => [{ wch: 14 }, { wch: 14 }]),
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Weekly_Cash_Budget");
  XLSX.utils.book_append_sheet(wb, wsGuide, "Instructions");

  const sanitized = companyName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `${sanitized}_3Month_Weekly_Cash_Flow_Budget.xlsx`;
  XLSX.writeFile(wb, fileName);
  return fileName;
}

export interface ParsedWeeklyActualsResult {
  updatedCount: number;
  unmatchedItems: string[];
  updates: Array<{
    itemId: string;
    weekId: string;
    actual: number;
  }>;
}

export function parseWeeklyActualsFromExcel(
  file: File,
  model: ThreeMonthCashBudgetModel,
): Promise<ParsedWeeklyActualsResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName =
          workbook.SheetNames.find(
            (s) =>
              s.toLowerCase().includes("weekly") ||
              s.toLowerCase().includes("cash") ||
              s.toLowerCase().includes("budget"),
          ) || workbook.SheetNames[0];

        const worksheet = workbook.Sheets[sheetName];
        const rawJson: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const updates: Array<{ itemId: string; weekId: string; actual: number }> = [];
        const unmatchedItems: string[] = [];

        // Find header row containing week references or "Line Item"
        let headerRowIdx = -1;
        for (let r = 0; r < Math.min(10, rawJson.length); r++) {
          const row = rawJson[r];
          if (
            row &&
            row.some(
              (cell: any) =>
                typeof cell === "string" &&
                (cell.toLowerCase().includes("line item") ||
                  cell.toLowerCase().includes("particular")),
            )
          ) {
            headerRowIdx = r;
            break;
          }
        }

        if (headerRowIdx === -1) {
          // fallback to row 4
          headerRowIdx = 4;
        }

        // Map column indices for each week's actual column
        // Standard layout has Week 1 actual at col 4, Week 2 actual at col 6, etc.
        const weekColMap: Record<string, number> = {};
        model.weeks.forEach((w, idx) => {
          // Col 0: Category, Col 1: Section, Col 2: Name
          // Col 3: W1 Bud, Col 4: W1 Act, Col 5: W2 Bud, Col 6: W2 Act...
          const actCol = 3 + idx * 2 + 1;
          weekColMap[w.id] = actCol;
        });

        // Scan rows
        for (let r = headerRowIdx + 1; r < rawJson.length; r++) {
          const row = rawJson[r];
          if (!row || row.length === 0) continue;

          // Item name is usually at col 2 or col 0
          const itemName = String(row[2] || row[0] || "").trim();
          if (
            !itemName ||
            itemName.startsWith("---") ||
            itemName.toLowerCase().includes("budget") ||
            itemName.toLowerCase().includes("outflows") ||
            itemName.toLowerCase().includes("inflows")
          ) {
            continue;
          }

          // Match item
          const matchedItem = model.items.find(
            (it) =>
              it.name.toLowerCase().trim() === itemName.toLowerCase().trim() ||
              it.name.toLowerCase().includes(itemName.toLowerCase()) ||
              itemName.toLowerCase().includes(it.name.toLowerCase()),
          );

          if (!matchedItem) {
            unmatchedItems.push(itemName);
            continue;
          }

          // Extract actuals for each week
          model.weeks.forEach((w) => {
            const col = weekColMap[w.id];
            if (col !== undefined && row[col] !== undefined && row[col] !== "") {
              const val = Number(row[col]);
              if (!isNaN(val)) {
                updates.push({
                  itemId: matchedItem.id,
                  weekId: w.id,
                  actual: Math.max(0, val),
                });
              }
            }
          });
        }

        resolve({
          updatedCount: updates.length,
          unmatchedItems: Array.from(new Set(unmatchedItems)),
          updates,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}
