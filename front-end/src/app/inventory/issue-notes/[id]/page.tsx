"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { fetchIssueNote, commitIssueNote, cancelIssueNote } from "@/lib/api/inventory";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Printer } from "lucide-react";

function qtyFmt(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function badgeClass(s: string) {
  const v = String(s || "").toLowerCase();
  if (v === "issued") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
  if (v === "cancelled") return "bg-rose-500/10 text-rose-700 border-rose-500/20";
  return "bg-amber-500/10 text-amber-700 border-amber-500/20";
}

export default function IssueNoteViewPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [hdr, setHdr] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchIssueNote(String(id));
      setHdr(data?.issue_note ?? null);
      setItems(Array.isArray(data?.items) ? data.items : []);
    } catch (e: any) {
      setHdr(null);
      setItems([]);
      toast({ title: "Error", description: e?.message || "Failed to load issue note", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  const totals = useMemo(() => {
    let qty = 0;
    let value = 0;
    for (const it of items) {
      const q = Number(it.qty_issued ?? 0);
      const unit = Number(it.unit_cost ?? 0);
      if (Number.isFinite(qty)) qty += q;
      if (Number.isFinite(q) && Number.isFinite(unit)) value += q * unit;
    }
    return { qty, value: Math.round(value * 100) / 100 };
  }, [items]);

  const handleCommit = async () => {
    if (!id) return;
    setProcessing(true);
    try {
      await commitIssueNote(id);
      toast({ title: "Issued", description: "Material issue note committed successfully." });
      void load();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to commit issue note", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    const ok = window.confirm("Are you sure you want to cancel this issue note? This will revert all stock deductions.");
    if (!ok) return;
    setProcessing(true);
    try {
      await cancelIssueNote(id);
      toast({ title: "Cancelled", description: "Issue note cancelled successfully." });
      void load();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to cancel issue note", variant: "destructive" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={() => router.push("/inventory/issue-notes")}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Issue Note Details</h1>
            <p className="text-muted-foreground mt-1">Material issue note and operational expense record</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hdr && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => window.open(`/inventory/issue-notes/print/${id}`, "_blank")}
            >
              <Printer className="w-4 h-4" />
              Print A4
            </Button>
          )}

          {hdr && hdr.status === "Draft" && (
            <Button 
              variant="outline" 
              onClick={handleCommit} 
              disabled={processing}
              className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Commit & Issue
            </Button>
          )}

          {hdr && hdr.status === "Issued" && (
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              disabled={processing}
              className="gap-2 border-rose-500/30 text-rose-600 hover:bg-rose-50"
            >
              <XCircle className="w-4 h-4" />
              Cancel Issue
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading details...
        </div>
      ) : !hdr ? (
        <div className="py-24 text-center text-muted-foreground">Issue note not found.</div>
      ) : (
        <>
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg">{hdr.issue_number}</CardTitle>
                  <CardDescription>
                    Source Store: <span className="font-medium text-foreground">{hdr.location_name ?? `ID: ${hdr.location_id}`}</span> |{" "}
                    Cost Center: <span className="font-semibold text-primary">{hdr.cost_center_name ?? `ID: ${hdr.cost_center_id}`}</span>
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className={badgeClass(hdr.status)}>{hdr.status}</Badge>
                  <div className="text-right text-xs text-muted-foreground">
                    <div>Created At: <span className="text-foreground">{new Date(hdr.created_at).toLocaleString()}</span></div>
                    {hdr.issued_at ? <div>Issued At: <span className="text-foreground">{new Date(hdr.issued_at).toLocaleString()}</span></div> : null}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {hdr.notes ? (
                <div className="text-sm">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="whitespace-pre-wrap">{hdr.notes}</div>
                </div>
              ) : null}
              <div className="text-sm text-muted-foreground">
                Total Qty: <span className="font-semibold text-foreground">{qtyFmt(totals.qty)}</span> | Total Value (COGS):{" "}
                <span className="font-bold text-foreground">Rs. {money(totals.value)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md overflow-hidden mt-6">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-lg">Ingredient details</CardTitle>
              <CardDescription>Consumable inventory components issued to cost center</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Qty Issued</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it, idx) => {
                    const qty = Number(it.qty_issued ?? 0);
                    const unit = Number(it.unit_cost ?? 0);
                    const amount = Number(it.line_total ?? qty * unit);
                    return (
                      <TableRow key={it.id ?? idx} className="hover:bg-muted/10">
                        <TableCell className="font-medium">{it.part_name ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{it.sku ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{it.batch_number ?? "Auto (FIFO)"}</TableCell>
                        <TableCell className="text-muted-foreground">{it.unit ?? "-"}</TableCell>
                        <TableCell className="text-right">Rs. {money(unit)}</TableCell>
                        <TableCell className="text-right font-semibold">{qtyFmt(qty)}</TableCell>
                        <TableCell className="text-right font-semibold">Rs. {money(amount)}</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-semibold">Totals</TableCell>
                    <TableCell className="text-right font-semibold">{qtyFmt(totals.qty)}</TableCell>
                    <TableCell className="text-right font-semibold">Rs. {money(totals.value)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
