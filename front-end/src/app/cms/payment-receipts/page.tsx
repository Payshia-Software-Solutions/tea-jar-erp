"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { fetchPaymentReceipts, cancelPaymentReceipt, fetchLocations } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Receipt, ExternalLink, Loader2, Banknote, CreditCard, Building2, Printer, XCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { DataTablePagination } from "@/components/data-table-pagination";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const METHOD_COLORS: Record<string, string> = {
  Cash: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
  Card: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400",
  "Bank Transfer": "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-400",
  Cheque: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400",
};

const METHOD_ICON: Record<string, React.ReactNode> = {
  Cash: <Banknote className="w-3 h-3" />,
  Card: <CreditCard className="w-3 h-3" />,
  "Bank Transfer": <Building2 className="w-3 h-3" />,
  Cheque: <Receipt className="w-3 h-3" />,
};

export default function PaymentReceiptsPage() {
  const { toast } = useToast();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [method, setMethod] = useState("");
  const [locationId, setLocationId] = useState<string>("all");
  const [locations, setLocations] = useState<any[]>([]);
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(20);

  // Cancellation State
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellingReceipt, setCancellingReceipt] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      // In a real paginated scenario, you'd fetch based on page/limit
      // For now, I'll update the API call to pass these
      const res = await fetchPaymentReceipts({ 
        method: method || undefined, 
        location_id: locationId || undefined,
        from_date: fromDate || undefined, 
        to_date: toDate || undefined,
        page,
        limit
      });
      
      // If the API returns { data, total }, use that. If just array, use that.
      if (Array.isArray(res)) {
        setReceipts(res);
        setTotal(res.length);
      } else {
        setReceipts(res.data || []);
        setTotal(res.total || 0);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReceipt = async () => {
    if (!cancellingReceipt || !cancelReason.trim()) {
        toast({ title: "Reason Required", description: "Please provide a reason for cancellation", variant: "destructive" });
        return;
    }

    setIsCancelling(true);
    try {
        await cancelPaymentReceipt(cancellingReceipt.id, cancelReason);
        toast({ title: "Cancelled", description: `Receipt ${cancellingReceipt.receipt_no} has been cancelled.` });
        setIsCancelDialogOpen(false);
        setCancelReason("");
        setCancellingReceipt(null);
        await load();
    } catch (e: any) {
        toast({ title: "Cancellation Failed", description: e.message, variant: "destructive" });
    } finally {
        setIsCancelling(false);
    }
  };

  useEffect(() => {
    fetchLocations().then(res => setLocations(Array.isArray(res) ? res : [])).catch(console.error);
  }, []);

  useEffect(() => { setPage(1); load(); }, [method, locationId, fromDate, toDate, limit]);
  useEffect(() => { load(); }, [page]);

  const filtered = receipts.filter(r => {
    const s = search.toLowerCase();
    return !search ||
      (r.receipt_no && r.receipt_no.toLowerCase().includes(s)) ||
      (r.invoice_no && r.invoice_no.toLowerCase().includes(s)) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(s));
  });

  const totalPages = Math.ceil(total / limit);
  const totalAmount = receipts.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  return (
    <DashboardLayout>
      <div className="p-3 space-y-3 w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Payment Receipts</h1>
            <p className="text-muted-foreground text-sm mt-1">Track all recorded payments across invoices</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-base px-4 py-1.5 font-bold">
              Total: LKR {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </Badge>
            <Link href="/cms/payment-receipts/new">
              <Button className="bg-primary hover:bg-primary/90 font-bold gap-2">
                <Banknote className="w-4 h-4" />
                Record Payment
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-3">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search receipt no, invoice, customer..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
                value={method}
                onChange={e => setMethod(e.target.value)}
              >
                <option value="">All Methods</option>
                <option>Cash</option>
                <option>Card</option>
                <option>Bank Transfer</option>
                <option>Cheque</option>
              </select>
              <select
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
                value={locationId}
                onChange={e => setLocationId(e.target.value)}
              >
                <option value="all">All Locations</option>
                {locations.map((loc: any) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
              <Input type="date" className="w-38" placeholder="From" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              <Input type="date" className="w-38" placeholder="To" value={toDate} onChange={e => setToDate(e.target.value)} />
              <Button variant="outline" onClick={() => { setSearch(""); setMethod(""); setLocationId("all"); setFromDate(""); setToDate(""); }}>Clear</Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-auto">
            {loading ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : receipts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
                <Receipt className="w-10 h-10 opacity-30" />
                <p className="text-sm">No payment receipts found</p>
              </div>
            ) : (
              <div className="flex flex-col">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Receipt No.</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Invoice No.</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Location</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Customer</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Method</th>
                      <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Date</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Amount (LKR)</th>
                      <th className="text-right px-4 py-3 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, idx) => (
                      <tr key={r.id} className={`border-b border-border/50 hover:bg-muted/20 transition-colors ${idx % 2 === 0 ? '' : 'bg-muted/10'}`}>
                        <td className="px-4 py-3 font-mono font-bold text-primary">{r.receipt_no}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{r.invoice_no}</td>
                        <td className="px-4 py-3 font-medium text-muted-foreground">
                          {locations.find(loc => loc.id == r.location_id)?.name || `Location ${r.location_id || 'N/A'}`}
                        </td>
                        <td className="px-4 py-3 font-medium">{r.customer_name}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${METHOD_COLORS[r.payment_method] || 'bg-muted text-foreground'}`}>
                            {METHOD_ICON[r.payment_method]}
                            {r.payment_method}
                          </span>
                          {r.cheque_no_last6 && (
                            <span className="ml-2 text-xs text-amber-600 font-mono">#{r.cheque_no_last6}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{new Date(r.payment_date).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">{Number(r.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-4 py-3 text-right flex justify-end gap-1">
                          <Link href={`/cms/payment-receipts/${r.id}/print`} target="_blank">
                            <Button variant="ghost" size="sm" className="text-xs text-primary">
                              <Printer className="w-3 h-3 mr-1" /> Print
                            </Button>
                          </Link>
                          <Link href={`/cms/invoices/${r.invoice_id}/view`}>
                            <Button variant="ghost" size="sm" className="text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" /> Invoice
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <DataTablePagination 
              currentPage={page}
              totalPages={totalPages}
              pageSize={limit}
              totalItems={total}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
