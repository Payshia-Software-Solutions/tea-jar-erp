import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function downloadExcelGeneric(
  filename: string,
  rows: Array<Record<string, any>>
) {
  if (!rows || rows.length === 0) return;

  const actualFilename = filename.replace(/\.csv$/i, '.xlsx');
  const title = actualFilename.replace(/\.xlsx$/i, '').replace(/[-_]/g, ' ').toUpperCase();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Report");

  const cols = Object.keys(rows[0]);

  // Title
  const titleSpan = Math.max(cols.length, 3);
  ws.mergeCells(1, 1, 1, titleSpan);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = title + " REPORT";
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1e293b" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  ws.addRow([]); // Spacer

  // Header
  const formatHeader = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  const headerRow = ws.addRow(cols.map(formatHeader));
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3b82f6" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
  });

  // Rows
  rows.forEach((r) => {
    const rowValues = cols.map(c => {
      let v = r[c];
      if (v === null || v === undefined || v === "") return "-";
      if (!isNaN(Number(v))) return Number(v);
      return String(v);
    });
    
    const row = ws.addRow(rowValues);
    row.eachCell({ includeEmpty: true }, (cell) => {
      if (typeof cell.value === 'number') {
        if (!Number.isInteger(cell.value)) cell.numFmt = '#,##0.00';
      }
      cell.border = { top: { style: "thin", color: { argb: "FFEEEEEE" } }, bottom: { style: "thin", color: { argb: "FFEEEEEE" } } };
    });
  });

  // Simple auto-width
  ws.columns.forEach((column) => {
    column.width = 20;
  });

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), actualFilename);
}
