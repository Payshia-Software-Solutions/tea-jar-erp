"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { ReportShell } from "../../_components/report-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchCustomerStatement,
  fetchCustomers,
  type CustomerStatementResult
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

export default function CustomerStatementPage() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const isPrint = searchParams?.get("print") === "1";
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CustomerStatementResult>({ opening_balance: 0, transactions: [] });

  const [customers, setCustomers] = useState<Array<{ value: string; label: string }>>([]);

  const [customerId, setCustomerId] = useState<string>(() => searchParams?.get("customer_id") ?? "");
  const [from, setFrom] = useState<string>(() => searchParams?.get("from") ?? firstDayOfMonth());
  const [to, setTo] = useState<string>(() => searchParams?.get("to") ?? todayLocalDate());

  const loadCustomers = async () => {
    try {
      const custData = await fetchCustomers();
      setCustomers(custData.map((x: any) => ({ value: String(x.id), label: `${x.name} - ${x.phone || ''}` })));
    } catch (e) {
      console.error("Failed to load customers", e);
    }
  };

  const loadData = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const res = await fetchCustomerStatement({
        customer_id: customerId,
        from,
        to
      });
      setData(res);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to load statement", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (customerId) loadData();
  }, [customerId, from, to]);

  // Calculate Running Balance
  const rowsWithBalance = useMemo(() => {
    let currentBalance = Number(data.opening_balance) || 0;
    return data.transactions.map((tx) => {
      const debit = Number(tx.debit) || 0;
      const credit = Number(tx.credit) || 0;
      currentBalance = currentBalance + debit - credit;
      return { ...tx, runningBalance: currentBalance };
    });
  }, [data]);

  const closingBalance = rowsWithBalance.length > 0 
    ? rowsWithBalance[rowsWithBalance.length - 1].runningBalance 
    : (Number(data.opening_balance) || 0);

  const handleExportExcel = async () => {
    if (!customerId) return;
    try {
      const exportRows: any[] = [];
      
      exportRows.push({
        "Date": from,
        "Type": "Opening Balance",
        "Reference": "",
        "Description": "",
        "Debit": 0,
        "Credit": 0,
        "Balance": Number(data.opening_balance) || 0
      });

      rowsWithBalance.forEach(r => {
        exportRows.push({
          "Date": r.date,
          "Type": r.doc_type,
          "Reference": r.reference,
          "Description": r.description,
          "Debit": Number(r.debit) || 0,
          "Credit": Number(r.credit) || 0,
          "Balance": Number(r.runningBalance) || 0
        });
      });

      exportRows.push({
        "Date": to,
        "Type": "Closing Balance",
        "Reference": "",
        "Description": "",
        "Debit": 0,
        "Credit": 0,
        "Balance": closingBalance
      });

      const custName = customers.find(c => c.value === customerId)?.label?.split(' - ')[0] || "Customer";
      await downloadExcelGeneric(`Statement_${custName.replace(/\s+/g, '_')}_${from}_to_${to}.xlsx`, exportRows);
      toast({ title: "Success", description: "Excel file downloaded" });
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to export", variant: "destructive" });
    }
  };

  const custNameFull = customers.find((x) => x.value === customerId)?.label;
  const printMeta = customerId ? `Customer: ${custNameFull} | Period: ${from} to ${to}` : "Please select a customer";

  const totalDebits = rowsWithBalance.reduce((acc, r) => acc + (Number(r.debit) || 0), 0);
  const totalCredits = rowsWithBalance.reduce((acc, r) => acc + (Number(r.credit) || 0), 0);

  return (
    <ReportShell
      title="Customer Statement"
      subtitle="Detailed ledger of invoices, payments, and balances"
      printMeta={printMeta}
      actions={
        <>
          <Button variant="outline" onClick={handleExportExcel} disabled={!customerId || rowsWithBalance.length === 0} className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
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
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-medium text-destructive">Customer (Required)</label>
                <SearchableSelect options={customers} value={customerId} onValueChange={setCustomerId} placeholder="Select Customer..." />
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

      {!customerId ? (
        <div className="p-12 border bg-white rounded-md text-center text-muted-foreground shadow-sm">
          <p>Please select a customer from the dropdown above to view their statement.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-md shadow-sm overflow-auto">
          {loading ? (
            <div className="p-12 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4" />
              <p>Loading statement...</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-800 text-white print:bg-slate-800 print:text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold w-32">Date</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">Description</th>
                  <th className="px-4 py-3 font-semibold text-right">Debit (Invoice)</th>
                  <th className="px-4 py-3 font-semibold text-right text-emerald-300 print:text-emerald-300">Credit (Payment)</th>
                  <th className="px-4 py-3 font-semibold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {/* Opening Balance Row */}
                <tr className="bg-muted/40 font-medium border-b-2">
                  <td className="px-4 py-3 text-muted-foreground">{from}</td>
                  <td className="px-4 py-3 font-bold" colSpan={5}>OPENING BALANCE</td>
                  <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">{money(Number(data.opening_balance) || 0)}</td>
                </tr>

                {rowsWithBalance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">No transactions found in this period.</td>
                  </tr>
                ) : (
                  rowsWithBalance.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${row.doc_type === 'Invoice' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {row.doc_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">{row.reference}</td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{row.description}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{Number(row.debit) > 0 ? money(Number(row.debit)) : '-'}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-medium">{Number(row.credit) > 0 ? money(Number(row.credit)) : '-'}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-700">{money(Number(row.runningBalance))}</td>
                    </tr>
                  ))
                )}

                {/* Closing Balance Row */}
                <tr className="bg-muted/40 font-bold border-t-2 border-slate-300">
                  <td className="px-4 py-3 text-muted-foreground">{to}</td>
                  <td className="px-4 py-3 font-bold text-slate-800" colSpan={3}>CLOSING BALANCE</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600 text-xs">Total Debits:<br/>{money(totalDebits)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-600 text-xs">Total Credits:<br/>{money(totalCredits)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-lg text-slate-900">{money(closingBalance)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </ReportShell>
  );
}
