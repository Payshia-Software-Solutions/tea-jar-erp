"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../../_components/report-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchLocations, 
  fetchItemWiseSalesReport, 
  fetchBrands,
  fetchItemCategories,
  fetchItemDepartments,
  fetchItemSections,
  fetchSuppliers,
  fetchCollections,
  type ServiceLocationRow 
} from "@/lib/api";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function firstDayOfMonth() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`;
}

function todayLocalDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

async function downloadExcel(filename: string, rows: Array<any>, totals: { qty: number; rev: number }, meta: { location: string; period: string }) {
  if (rows.length === 0) return;

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Item Wise Sales");

  // Title
  ws.mergeCells("A1:H1");
  const titleCell = ws.getCell("A1");
  titleCell.value = "Item Wise Sale Report";
  titleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: "FF1e293b" } };
  titleCell.alignment = { vertical: "middle", horizontal: "center" };

  // Meta
  ws.mergeCells("A2:H2");
  ws.getCell("A2").value = `Location: ${meta.location}`;
  ws.getCell("A2").font = { name: "Arial", size: 11, bold: true };
  ws.mergeCells("A3:H3");
  ws.getCell("A3").value = `Period: ${meta.period}`;
  ws.getCell("A3").font = { name: "Arial", size: 11, italic: true };

  ws.addRow([]); // Spacer

  // Header Row
  const headerRow = ws.addRow(["Item ID", "Description", "Type", "Category", "Brand", "Qty Sold", "Avg Unit Price", "Total Revenue"]);
  headerRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3b82f6" } }; // Blue bg
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" }
    };
  });

  // Rows
  rows.forEach((r) => {
    const avgPrice = Number(r.total_qty) > 0 ? Number(r.total_revenue) / Number(r.total_qty) : 0;
    const row = ws.addRow([
      r.item_id || "-",
      r.description || "-",
      r.item_type || "-",
      r.category_name || "-",
      r.brand_name || "-",
      Number(r.total_qty) || 0,
      avgPrice,
      Number(r.total_revenue) || 0
    ]);
    
    row.getCell(6).numFmt = '#,##0.00';
    row.getCell(7).numFmt = '#,##0.00';
    row.getCell(8).numFmt = '#,##0.00';
    
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = { top: { style: "thin", color: { argb: "FFEEEEEE" } }, bottom: { style: "thin", color: { argb: "FFEEEEEE" } } };
    });
  });

  // Totals
  const totalRow = ws.addRow(["", "", "", "", "Grand Total", totals.qty, "", totals.rev]);
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } };
  });
  totalRow.getCell(6).numFmt = '#,##0.00';
  totalRow.getCell(8).numFmt = '#,##0.00';

  // Columns Width
  ws.columns = [
    { width: 15 }, { width: 45 }, { width: 15 }, { width: 25 }, { width: 20 }, { width: 15 }, { width: 18 }, { width: 20 }
  ];

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), filename);
}

export default function ItemWiseSalesReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  // Master Data Options
  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);
  const [brands, setBrands] = useState<Array<{ value: string; label: string }>>([]);
  const [categories, setCategories] = useState<Array<{ value: string; label: string }>>([]);
  const [departments, setDepartments] = useState<Array<{ value: string; label: string }>>([]);
  const [sections, setSections] = useState<Array<{ value: string; label: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ value: string; label: string }>>([]);
  const [collections, setCollections] = useState<Array<{ value: string; label: string }>>([]);

  // Filters State
  const [locationId, setLocationId] = useState<string>(() => searchParams?.get("location_id") ?? "all");
  const [from, setFrom] = useState<string>(() => searchParams?.get("from") ?? firstDayOfMonth());
  const [to, setTo] = useState<string>(() => searchParams?.get("to") ?? todayLocalDate());
  const [brandId, setBrandId] = useState<string>(() => searchParams?.get("brand_id") ?? "");
  const [categoryId, setCategoryId] = useState<string>(() => searchParams?.get("category_id") ?? "");
  const [departmentId, setDepartmentId] = useState<string>(() => searchParams?.get("department_id") ?? "");
  const [sectionId, setSectionId] = useState<string>(() => searchParams?.get("section_id") ?? "");
  const [supplierId, setSupplierId] = useState<string>(() => searchParams?.get("supplier_id") ?? "");
  const [collectionId, setCollectionId] = useState<string>(() => searchParams?.get("collection_id") ?? "");

  const decodeToken = () => {
    try {
      const token = window.localStorage.getItem("auth_token");
      if (!token) return null;
      const part = token.split(".")[1];
      return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    } catch {
      return null;
    }
  };

  const loadMasterData = async () => {
    try {
      const [brandData, catData, depData, secData, supData, colData] = await Promise.all([
        fetchBrands(),
        fetchItemCategories(),
        fetchItemDepartments(),
        fetchItemSections(),
        fetchSuppliers(),
        fetchCollections()
      ]);

      setBrands([{ value: "", label: "All Brands" }, ...brandData.map((x: any) => ({ value: String(x.id), label: x.name }))]);
      setCategories([{ value: "", label: "All Categories" }, ...catData.map((x: any) => ({ value: String(x.id), label: x.name }))]);
      setDepartments([{ value: "", label: "All Departments" }, ...depData.map((x: any) => ({ value: String(x.id), label: x.name }))]);
      setSections([{ value: "", label: "All Sections" }, ...secData.map((x: any) => ({ value: String(x.id), label: x.name }))]);
      
      const supplierList = Array.isArray(supData?.data) ? supData.data : (Array.isArray(supData) ? supData : []);
      setSuppliers([{ value: "", label: "All Suppliers" }, ...supplierList.map((x: any) => ({ value: String(x.id), label: x.name }))]);
      
      setCollections([{ value: "", label: "All Collections" }, ...colData.map((x: any) => ({ value: String(x.id), label: x.name }))]);
    } catch (e) {
      console.error("Failed to load some master data", e);
    }
  };

  const loadLocations = async () => {
    const tokenJson: any = decodeToken();
    const role = String(tokenJson?.role ?? "");
    if (role === "Admin") {
      const locRows = await fetchLocations();
      const opts = Array.isArray(locRows)
        ? (locRows as ServiceLocationRow[])
            .map((l) => ({ value: String(l.id), label: String(l.name ?? "") }))
            .filter((o) => o.value !== "0" && o.label)
        : [];
      setLocations([{ value: "all", label: "All Locations" }, ...opts]);
      return;
    }
    const allowed = Array.isArray(tokenJson?.allowed_locations) ? tokenJson.allowed_locations : [];
    const opts = allowed
      .map((x: any) => ({ value: String(x?.id), label: String(x?.name ?? "") }))
      .filter((o: any) => Number(o.value) > 0 && o.label);
    setLocations([{ value: "all", label: "All Allowed Locations" }, ...opts]);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchItemWiseSalesReport({
        location_id: locationId === "all" ? "all" : locationId,
        from,
        to,
        brand_id: brandId || undefined,
        category_id: categoryId || undefined,
        department_id: departmentId || undefined,
        section_id: sectionId || undefined,
        supplier_id: supplierId || undefined,
        collection_id: collectionId || undefined,
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.all([loadLocations(), loadMasterData()]).then(() => void load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = useMemo(() => {
    let qty = 0;
    let rev = 0;
    for (const r of rows) {
      qty += Number(r.total_qty ?? 0);
      rev += Number(r.total_revenue ?? 0);
    }
    return { qty, rev };
  }, [rows]);

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    qs.set("location_id", locationId);
    qs.set("from", from);
    qs.set("to", to);
    if (brandId) qs.set("brand_id", brandId);
    if (categoryId) qs.set("category_id", categoryId);
    if (departmentId) qs.set("department_id", departmentId);
    if (sectionId) qs.set("section_id", sectionId);
    if (supplierId) qs.set("supplier_id", supplierId);
    if (collectionId) qs.set("collection_id", collectionId);
    return `/reports/sales/item-wise?${qs.toString()}`;
  }, [locationId, from, to, brandId, categoryId, departmentId, sectionId, supplierId, collectionId]);

  const locationLabel = useMemo(() => {
    return locations.find((o) => o.value === locationId)?.label ?? (locationId === "all" ? "All Locations" : locationId);
  }, [locations, locationId]);

  return (
    <ReportShell
      title="Item Wise Sale Report"
      subtitle="Detailed analysis of sales by individual items and their categories"
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1 text-sm">
          <div><span className="font-semibold">Location:</span> {locationLabel}</div>
          <div><span className="font-semibold">Period:</span> {from} to {to}</div>
        </div>
      }
    >
      {!isPrint ? (
        <Card className="border-none shadow-md overflow-hidden mb-6 bg-muted/10">
          <CardHeader className="border-b bg-muted/20 py-3">
            <CardTitle className="text-base font-semibold">Report Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Location</div>
                <SearchableSelect
                  value={locationId}
                  onValueChange={setLocationId}
                  options={locations}
                  placeholder="Select location..."
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">From Date</div>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">To Date</div>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
              </div>
              <div className="flex items-end">
                <Button className="w-full h-9" onClick={() => void load()} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Generate Report
                </Button>
              </div>

              {/* Advanced Classification Filters */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Department</div>
                <SearchableSelect value={departmentId} onValueChange={setDepartmentId} options={departments} placeholder="All Departments" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Section</div>
                <SearchableSelect value={sectionId} onValueChange={setSectionId} options={sections} placeholder="All Sections" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Category</div>
                <SearchableSelect value={categoryId} onValueChange={setCategoryId} options={categories} placeholder="All Categories" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Brand</div>
                <SearchableSelect value={brandId} onValueChange={setBrandId} options={brands} placeholder="All Brands" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Supplier</div>
                <SearchableSelect value={supplierId} onValueChange={setSupplierId} options={suppliers} placeholder="All Suppliers" />
              </div>
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">Collection</div>
                <SearchableSelect value={collectionId} onValueChange={setCollectionId} options={collections} placeholder="All Collections" />
              </div>
            </div>
            
            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-muted/50">
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="px-3 py-1 text-sm font-medium">Distinct Items: {rows.length}</Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-blue-200 bg-blue-50 text-blue-700">Total Qty Sold: {totals.qty.toLocaleString()}</Badge>
                <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-emerald-200 bg-emerald-50 text-emerald-700">Total Revenue: {money(totals.rev)}</Badge>
              </div>
              <Button variant="outline" size="sm" onClick={() => downloadExcel(`item-wise-sales-${from}-to-${to}.xlsx`, rows, totals, { location: locationLabel, period: `${from} to ${to}` })} disabled={loading || rows.length === 0}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 border-b">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Item ID</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Description</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Brand</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Qty Sold</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Avg Unit Price</th>
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="py-12 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2"/> Loading report data...</td></tr>
                ) : rows.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No sales data found for the selected criteria.</td></tr>
                ) : (
                  <>
                    {rows.map((r, i) => {
                      const avgPrice = Number(r.total_qty) > 0 ? Number(r.total_revenue) / Number(r.total_qty) : 0;
                      return (
                        <tr key={i} className="border-b hover:bg-muted/5 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground font-medium">{r.item_id || "-"}</td>
                          <td className="px-4 py-3 font-medium">{r.description}</td>
                          <td className="px-4 py-3"><Badge variant="outline" className="font-normal text-xs">{r.item_type}</Badge></td>
                          <td className="px-4 py-3 text-muted-foreground">{r.category_name || "-"}</td>
                          <td className="px-4 py-3 text-muted-foreground">{r.brand_name || "-"}</td>
                          <td className="px-4 py-3 text-right font-semibold text-blue-600">{Number(r.total_qty).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-muted-foreground">{money(avgPrice)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600">{money(Number(r.total_revenue))}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-muted/30 font-bold text-base">
                      <td colSpan={5} className="px-4 py-4 text-right uppercase tracking-wider">Grand Total</td>
                      <td className="px-4 py-4 text-right text-blue-700">{totals.qty.toLocaleString()}</td>
                      <td className="px-4 py-4"></td>
                      <td className="px-4 py-4 text-right text-emerald-700">{money(totals.rev)}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </ReportShell>
  );
}
