"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../../_components/report-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchLocations, 
  fetchCreditSalesSummary,
  fetchCustomers,
  type ServiceLocationRow,
  type CreditSaleSummaryRow
} from "@/lib/api";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
import { downloadExcelGeneric } from "@/lib/excel-export";

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

export default function CreditSaleSummaryPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<CreditSaleSummaryRow[]>([]);

  // Master Data Options
  const [locations, setLocations] = useState<Array<{ value: string; label: string }>>([]);
  const [customers, setCustomers] = useState<Array<{ value: string; label: string }>>([]);

  // Filters State
  const [locationId, setLocationId] = useState<string>(() => searchParams?.get("location_id") ?? "all");
  const [customerId, setCustomerId] = useState<string>(() => searchParams?.get("customer_id") ?? "all");
  const [from, setFrom] = useState<string>(() => searchParams?.get("from") ?? firstDayOfMonth());
  const [to, setTo] = useState<string>(() => searchParams?.get("to") ?? todayLocalDate());

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
      const custData = await fetchCustomers();
      setCustomers([{ value: "all", label: "All Customers" }, ...custData.map((x: any) => ({ value: String(x.id), label: `${x.name} - ${x.phone || ''}` }))]);
    } catch (e) {
      console.error("Failed to load customers", e);
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

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchCreditSalesSummary({
        location_id: locationId,
        customer_id: customerId,
        from,
        to
      });
      setRows(data);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load report", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
    loadMasterData();
  }, []);

  useEffect(() => {
    loadData();
  }, [locationId, customerId, from, to]);

  const handleExportExcel = async () => {
    try {
      // Re-map array to have nicer columns for Excel
      const exportRows = rows.map(r => ({
        "Invoice No": r.invoice_no,
        "Issue Date": r.issue_date,
        "Customer Name": r.customer_name || "-",
        "Location": r.location_name || "-",
        "Grand Total": Number(r.grand_total) || 0,
        "Paid Amount": Number(r.paid_amount) || 0,
        "Balance": Number(r.balance) || 0,
        "Credit Days": Number(r.credit_days) || 0
      }));

      // Add Grand Totals
      const totalGrand = rows.reduce((acc, curr) => acc + Number(curr.grand_total), 0);
      const totalPaid = rows.reduce((acc, curr) => acc + Number(curr.paid_amount), 0);
      const totalBalance = rows.reduce((acc, curr) => acc + Number(curr.balance), 0);

      exportRows.push({
        "Invoice No": "GRAND TOTAL",
        "Issue Date": "",
        "Customer Name": "",
        "Location": "",
        "Grand Total": totalGrand,
        "Paid Amount": totalPaid,
        "Balance": totalBalance,
        "Credit Days": 0
      });

      await downloadExcelGeneric(`Credit_Sales_Summary_${from}_to_${to}.xlsx`, exportRows);
      toast({ title: "Success", description: "Excel file downloaded" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to export", variant: "destructive" });
    }
  };

  const currentLocName = locations.find((x) => x.value === locationId)?.label || "All Locations";
  const printMeta = `Location: ${currentLocName} | Period: ${from} to ${to}`;

  const totalGrand = rows.reduce((acc, curr) => acc + Number(curr.grand_total), 0);
  const totalPaid = rows.reduce((acc, curr) => acc + Number(curr.paid_amount), 0);
  const totalBalance = rows.reduce((acc, curr) => acc + Number(curr.balance), 0);

  return (
    <ReportShell
      title="Credit Sale Summary"
      subtitle="Outstanding balances and credit days count"
      printMeta={printMeta}
      actions={
        <>
          <Button variant="outline" onClick={handleExportExcel} className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
            <FileSpreadsheet className="w-4 h-4" />
            Export Excel
          </Button>
        </>
      }
    >
      <div className="print:hidden space-y-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Location</label>
                <SearchableSelect options={locations} value={locationId} onValueChange={setLocationId} placeholder="All Locations" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Customer</label>
                <SearchableSelect options={customers} value={customerId} onValueChange={setCustomerId} placeholder="All Customers" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">From Date</label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} onClick={(e) => { try { (e.target as any).showPicker(); } catch {} }} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">To Date</label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} onClick={(e) => { try { (e.target as any).showPicker(); } catch {} }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white border rounded-md shadow-sm overflow-auto">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading credit sales...</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice No</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Location</th>
                <th className="px-4 py-3 font-medium text-right">Grand Total</th>
                <th className="px-4 py-3 font-medium text-right text-emerald-600">Paid Amount</th>
                <th className="px-4 py-3 font-medium text-right text-destructive">Balance Due</th>
                <th className="px-4 py-3 font-medium text-center">Credit Days</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">No unpaid credit sales found for the selected criteria.</td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{row.invoice_no}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.issue_date}</td>
                    <td className="px-4 py-3">{row.customer_name || '-'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">{row.location_name || '-'}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{money(Number(row.grand_total))}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{money(Number(row.paid_amount))}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-destructive">{money(Number(row.balance))}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full ${Number(row.credit_days) > 30 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                        {row.credit_days} Days
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot className="bg-muted/40 font-bold border-t-2">
                <tr>
                  <td colSpan={3} className="px-4 py-3">GRAND TOTAL</td>
                  <td className="hidden sm:table-cell"></td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(totalGrand)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-600">{money(totalPaid)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-destructive">{money(totalBalance)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </ReportShell>
  );
}
