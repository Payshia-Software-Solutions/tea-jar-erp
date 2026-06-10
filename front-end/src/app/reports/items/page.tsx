"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../_components/report-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { fetchBrands, fetchReportItems, fetchSuppliers, type BrandRow, type SupplierRow } from "@/lib/api";
import { Download, FileSpreadsheet, ExternalLink, Loader2 } from "lucide-react";
import { downloadExcelGeneric as downloadCsv } from "@/lib/excel-export";

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function ItemReportPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<any[]>([]);

  const [query, setQuery] = useState("");
  const [brandId, setBrandId] = useState<string>("");
  const [supplierId, setSupplierId] = useState<string>("");
  const [active, setActive] = useState<string>("");

  const [brands, setBrands] = useState<Array<{ value: string; label: string }>>([]);
  const [suppliers, setSuppliers] = useState<Array<{ value: string; label: string; keywords?: string }>>([]);

  const loadMasters = async () => {
    try {
      const [b, s] = await Promise.all([fetchBrands(""), fetchSuppliers("")]);
      const bRows = Array.isArray(b) ? (b as BrandRow[]) : [];
      const sRows = Array.isArray(s) ? (s as SupplierRow[]) : [];
      setBrands([{ value: "", label: "All Brands" }, ...bRows.map((x) => ({ value: String(x.id), label: String(x.name ?? "") }))]);
      setSuppliers([
        { value: "", label: "All Suppliers" },
        ...sRows.map((x) => ({ value: String(x.id), label: String(x.name ?? ""), keywords: `${x.email ?? ""} ${x.phone ?? ""}` })),
      ]);
    } catch {
      setBrands([{ value: "", label: "All Brands" }]);
      setSuppliers([{ value: "", label: "All Suppliers" }]);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchReportItems({
        q: query.trim() || undefined,
        brandId: brandId ? Number(brandId) : undefined,
        supplierId: supplierId ? Number(supplierId) : undefined,
        active: active === "" ? -1 : (active === "1" ? 1 : 0),
      });
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load item report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadMasters().then(() => load());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeOptions = useMemo(
    () => [
      { value: "", label: "All" },
      { value: "1", label: "Active" },
      { value: "0", label: "Inactive" },
    ],
    []
  );

  const printHref = useMemo(() => {
    const qs = new URLSearchParams();
    qs.set("print", "1");
    qs.set("autoprint", "1");
    if (query.trim()) qs.set("q", query.trim());
    if (brandId) qs.set("brand_id", brandId);
    if (supplierId) qs.set("supplier_id", supplierId);
    if (active === "0" || active === "1") qs.set("active", active);
    return `/reports/items?${qs.toString()}`;
  }, [query, brandId, supplierId, active]);

  return (
    <ReportShell
      title="Item Report (Filters)"
      subtitle="Filter item master by brand, supplier and active status."
      actions={
        <>
          <Button asChild variant="outline"><Link href={printHref} target="_blank">Print</Link></Button>
          <Button asChild><Link href={printHref} target="_blank">Export PDF</Link></Button>
        </>
      }
      printMeta={
        <div className="space-y-1">
          {query.trim() ? <div><span className="font-semibold">Search:</span> {query.trim()}</div> : null}
          {brandId ? <div><span className="font-semibold">Brand ID:</span> {brandId}</div> : null}
          {supplierId ? <div><span className="font-semibold">Supplier ID:</span> {supplierId}</div> : null}
          {active === "0" || active === "1" ? <div><span className="font-semibold">Active:</span> {active === "1" ? "Yes" : "No"}</div> : null}
          <div><span className="font-semibold">Items:</span> {rows.length}</div>
        </div>
      }
    >
      {!isPrint ? (
        <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Filters</CardTitle>
          <CardDescription>Search and master filters</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-5">
              <div className="text-xs text-muted-foreground mb-1">Search</div>
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, SKU, part no, barcode..." />
            </div>
            <div className="md:col-span-3">
              <div className="text-xs text-muted-foreground mb-1">Brand</div>
              <SearchableSelect value={brandId} onValueChange={setBrandId} options={brands} placeholder="All Brands" searchPlaceholder="Search brands..." />
            </div>
            <div className="md:col-span-3">
              <div className="text-xs text-muted-foreground mb-1">Supplier</div>
              <SearchableSelect value={supplierId} onValueChange={setSupplierId} options={suppliers} placeholder="All Suppliers" searchPlaceholder="Search suppliers..." />
            </div>
            <div className="md:col-span-1">
              <div className="text-xs text-muted-foreground mb-1">Active</div>
              <SearchableSelect value={active} onValueChange={setActive} options={activeOptions} placeholder="All" searchPlaceholder="Search..." />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Items: {rows.length}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => downloadCsv("items-report.csv", rows)} disabled={loading || rows.length === 0}>
                <FileSpreadsheet className="w-4 h-4" />
                Export Excel
              </Button>
              <Button onClick={() => void load()} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Run
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      ) : null}

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Items</CardTitle>
          <CardDescription>Open item master page from the link</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="w-5 h-5 inline-block animate-spin mr-2" />
              Loading...
            </div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">No results.</div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left px-4 py-3">Item</th>
                    <th className="text-left px-4 py-3">Brand</th>
                    <th className="text-left px-4 py-3">SKU</th>
                    <th className="text-left px-4 py-3">Unit</th>
                    <th className="text-right px-4 py-3">Cost</th>
                    <th className="text-right px-4 py-3">Sell</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr key={r.id} className="border-t hover:bg-muted/10">
                      <td className="px-4 py-3 font-medium">
                        <div>{r.part_name ?? "-"}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {r.part_number ? `Part#: ${r.part_number} • ` : ""}
                          {r.barcode_number ? `Barcode: ${r.barcode_number}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{r.brand_name ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.sku ?? "-"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.unit ?? "-"}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground tabular-nums">{money(Number(r.cost_price ?? 0))}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{money(Number(r.price ?? 0))}</td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8" title="Open item">
                          <Link href={`/inventory/items/${encodeURIComponent(String(r.id))}`} target="_blank">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </ReportShell>
  );
}
