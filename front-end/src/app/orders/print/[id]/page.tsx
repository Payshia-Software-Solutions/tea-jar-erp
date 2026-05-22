"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { fetchOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, Printer, ArrowLeft } from "lucide-react";

function safeJsonArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(String);
      return [];
    } catch {
      return [];
    }
  }
  return [];
}

export default function OrderPrintPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const id = params?.id;
  const auto = searchParams?.get("autoprint") === "1";

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const printedRef = useRef(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const o = await fetchOrder(String(id));
        setOrder(o);
      } finally {
        setLoading(false);
      }
    };
    if (id) void run();
  }, [id]);

  const data = useMemo(() => {
    const o: any = order || {};
    const createdAt = typeof o.created_at === "string" ? o.created_at : "";
    const expectedAt = typeof o.expected_time === "string" ? o.expected_time : "";
    return {
      id: o.id ?? id,
      vehicleModel: o.vehicle_model ?? "",
      vehicleIdentifier: o.vehicle_identifier ?? "",
      mileage: o.mileage ?? "",
      priority: o.priority ?? "",
      status: o.status ?? "",
      createdAt,
      expectedAt,
      problem: o.problem_description ?? "",
      comments: o.comments ?? "",
      fromLocationName: o.from_location_name ?? "",
      toLocationName: o.location_name ?? "",
      categories: safeJsonArray(o.categories_json),
      checklist: safeJsonArray(o.checklist_json),
      attachments: safeJsonArray(o.attachments_json),
    };
  }, [order, id]);

  useEffect(() => {
    if (!auto) return;
    if (loading) return;
    if (!order) return;
    if (printedRef.current) return;
    printedRef.current = true;

    // Give the browser a tick to layout before printing.
    const t = window.setTimeout(() => window.print(), 250);
    return () => window.clearTimeout(t);
  }, [auto, loading, order]);

  return (
    <>
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 4mm;
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
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="font-semibold">Print Order</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push("/orders")}>
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
        <div className="mx-auto max-w-3xl px-4">
          {loading ? (
            <div className="flex items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading order...
            </div>
          ) : !order ? (
            <div className="py-24 text-center text-muted-foreground">Order not found.</div>
          ) : (
            <div className="mx-auto w-[72mm] max-w-full bg-white border shadow-sm rounded-md p-4 print:border-0 print:shadow-none print:rounded-none">
              <div className="text-center">
                <div className="font-bold text-base leading-tight">ServiceBay</div>
                <div className="text-[11px] text-muted-foreground">Repair Order Ticket</div>
              </div>

              <div className="my-3 border-t border-dashed" />

              <div className="text-[12px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order</span>
                  <span className="font-semibold">#{data.id}</span>
                </div>
                {data.createdAt ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span>{data.createdAt}</span>
                  </div>
                ) : null}
                {data.expectedAt ? (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected</span>
                    <span>{data.expectedAt}</span>
                  </div>
                ) : null}
              </div>

              <div className="my-3 border-t border-dashed" />

              <div className="text-[12px] space-y-2">
                {data.fromLocationName || data.toLocationName ? (
                  <div className="flex justify-between gap-3 p-1.5 border border-dashed rounded bg-slate-50/50">
                    {data.fromLocationName && (
                      <div>
                        <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">From</div>
                        <div className="font-semibold leading-tight">{data.fromLocationName}</div>
                      </div>
                    )}
                    {data.toLocationName && (
                      <div className="text-right">
                        <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">To</div>
                        <div className="font-semibold leading-tight">{data.toLocationName}</div>
                      </div>
                    )}
                  </div>
                ) : null}

                <div>
                  <div className="text-muted-foreground text-[11px]">Vehicle</div>
                  <div className="font-semibold leading-tight">{data.vehicleModel || "-"}</div>
                  {data.vehicleIdentifier ? (
                    <div className="text-[11px] text-muted-foreground leading-tight">
                      {data.vehicleIdentifier}
                    </div>
                  ) : null}
                </div>

                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-muted-foreground text-[11px]">Mileage</div>
                    <div className="font-semibold">{data.mileage ? `${data.mileage} km` : "-"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted-foreground text-[11px]">Priority</div>
                    <div className="font-semibold">{data.priority || "-"}</div>
                  </div>
                </div>

                <div>
                  <div className="text-muted-foreground text-[11px]">Problem</div>
                  <div className="whitespace-pre-wrap leading-tight">{data.problem || "-"}</div>
                </div>

                {data.comments ? (
                  <div>
                    <div className="text-muted-foreground text-[11px]">Comments</div>
                    <div className="whitespace-pre-wrap leading-tight">{data.comments}</div>
                  </div>
                ) : null}
              </div>

              {data.categories.length > 0 ? (
                <>
                  <div className="my-3 border-t border-dashed" />
                  <div className="text-[12px]">
                    <div className="text-muted-foreground text-[11px] mb-1">Categories</div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {data.categories.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}

              {data.checklist.length > 0 ? (
                <>
                  <div className="my-3 border-t border-dashed" />
                  <div className="text-[12px]">
                    <div className="text-muted-foreground text-[11px] mb-1">Checklist</div>
                    <ul className="space-y-1">
                      {data.checklist.map((c) => (
                        <li key={c} className="flex items-start gap-2">
                          <span className="mt-0.5">[ ]</span>
                          <span className="flex-1 leading-tight">{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}

              {data.attachments.length > 0 ? (
                <>
                  <div className="my-3 border-t border-dashed" />
                  <div className="text-[12px]">
                    <div className="text-muted-foreground text-[11px] mb-1">Attachments</div>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {data.attachments.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}

              <div className="my-3 border-t border-dashed" />

              <div className="text-center text-[11px] text-muted-foreground">
                BizFlow ERP System | Developed by Nebulink.com
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
