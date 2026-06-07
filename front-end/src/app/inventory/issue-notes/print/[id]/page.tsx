"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { fetchCompany, type CompanyRow } from "@/lib/api";
import { fetchIssueNote } from "@/lib/api/inventory";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft, Mail, MapPin, Phone } from "lucide-react";

function qtyFmt(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function IssueNotePrintPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id;
  const auto = searchParams?.get("autoprint") === "1";

  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<CompanyRow | null>(null);
  const [hdr, setHdr] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const printedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [comp, data] = await Promise.all([fetchCompany(), fetchIssueNote(String(id))]);
        setCompany((comp as any) ?? null);
        setHdr((data as any)?.issue_note ?? null);
        setItems(Array.isArray((data as any)?.items) ? (data as any).items : []);
      } catch (e) {
        console.error("Failed to load print data", e);
      } finally {
        setLoading(false);
      }
    };
    if (id) void run();
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

  useEffect(() => {
    if (!auto) return;
    if (loading) return;
    if (!hdr) return;
    if (printedRef.current) return;
    printedRef.current = true;
    const t = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(t);
  }, [auto, loading, hdr]);

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          html,
          body {
            background: #fff !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      <div className="print:hidden sticky top-0 z-10 bg-background/90 backdrop-blur border-b">
        <div className="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="font-semibold">Print Issue Note</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/inventory/issue-notes/${id}`)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-muted/20 min-h-screen py-8 print:bg-white print:py-0">
        <div className="mx-auto max-w-4xl px-4">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading issue note...
            </div>
          ) : !hdr ? (
            <div className="py-24 text-center text-muted-foreground">Issue note not found.</div>
          ) : (
            <div className="bg-white border shadow-sm rounded-md p-6 print:border-0 print:shadow-none print:rounded-none">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <div className="text-2xl font-bold leading-tight">{company?.name ?? "BizzFlow"}</div>
                  <div className="text-sm text-muted-foreground mt-1 space-y-1">
                    {company?.address ? <div className="leading-tight">{company.address}</div> : null}
                    {company?.phone ? (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{company.phone}</span>
                      </div>
                    ) : null}
                    {company?.email ? (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <span>{company.email}</span>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="text-right min-w-[240px]">
                  <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Material Issue Note</div>
                  <div className="text-sm text-muted-foreground mt-1">Issue No: <span className="font-semibold text-foreground">{hdr.issue_number}</span></div>
                  <div className="text-sm text-muted-foreground">Status: <span className="font-semibold text-foreground">{hdr.status}</span></div>
                  {hdr.created_at ? <div className="text-sm text-muted-foreground">Created: <span className="text-foreground">{new Date(hdr.created_at).toLocaleString()}</span></div> : null}
                  {hdr.issued_at ? <div className="text-sm text-muted-foreground">Issued: <span className="text-foreground">{new Date(hdr.issued_at).toLocaleString()}</span></div> : null}
                </div>
              </div>

              <div className="my-6 border-t" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Source Store / Location
                  </div>
                  <div className="font-semibold mt-1">{hdr.location_name ?? `ID: ${hdr.location_id}`}</div>
                </div>
                <div className="rounded-lg border p-3">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Cost Center / Destination
                  </div>
                  <div className="font-semibold mt-1">{hdr.cost_center_name ?? `ID: ${hdr.cost_center_id}`}</div>
                </div>
              </div>

              {hdr.notes ? (
                <div className="mt-4 text-sm">
                  <div className="text-xs text-muted-foreground">Notes</div>
                  <div className="whitespace-pre-wrap">{hdr.notes}</div>
                </div>
              ) : null}

              <div className="my-6 border-t" />

              <table className="w-full text-sm border border-collapse">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left p-2 border">Item</th>
                    <th className="text-left p-2 border">SKU</th>
                    <th className="text-left p-2 border">Batch</th>
                    <th className="text-left p-2 border">Unit</th>
                    <th className="text-right p-2 border">Unit Cost</th>
                    <th className="text-right p-2 border">Qty Issued</th>
                    <th className="text-right p-2 border">Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it, idx) => {
                    const qty = Number(it.qty_issued ?? 0);
                    const unit = Number(it.unit_cost ?? 0);
                    const amount = Number(it.line_total ?? qty * unit);
                    return (
                      <tr key={it.id ?? idx}>
                        <td className="p-2 border">{it.part_name ?? "-"}</td>
                        <td className="p-2 border text-muted-foreground">{it.sku ?? "-"}</td>
                        <td className="p-2 border text-muted-foreground">{it.batch_number ?? "Auto (FIFO)"}</td>
                        <td className="p-2 border text-muted-foreground">{it.unit ?? "-"}</td>
                        <td className="p-2 border text-right">Rs. {money(unit)}</td>
                        <td className="p-2 border text-right">{qtyFmt(qty)}</td>
                        <td className="p-2 border text-right font-semibold">Rs. {money(amount)}</td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td className="p-2 border text-right font-semibold" colSpan={5}>Total Qty</td>
                    <td className="p-2 border text-right font-semibold">{qtyFmt(totals.qty)}</td>
                    <td className="p-2 border" />
                  </tr>
                  <tr>
                    <td className="p-2 border text-right font-semibold" colSpan={6}>Total Value (COGS)</td>
                    <td className="p-2 border text-right font-semibold">Rs. {money(totals.value)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-12 grid grid-cols-2 gap-12 text-sm">
                <div>
                  <div className="border-t border-dashed pt-2 text-center text-muted-foreground">Issued / Prepared By</div>
                </div>
                <div>
                  <div className="border-t border-dashed pt-2 text-center text-muted-foreground">Received / Authorized By</div>
                </div>
              </div>

              <div className="mt-8 text-xs text-muted-foreground">
                Printed: {new Date().toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
