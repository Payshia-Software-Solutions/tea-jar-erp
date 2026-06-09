"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createRequisition, fetchLocations, fetchParts, type PartRow, type ServiceLocationRow , formatPartLabel } from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";
import { SearchableSelect } from "@/components/ui/searchable-select";

type Line = { part_id: string; qty_requested: string; notes?: string };

export default function NewStockRequestPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [locations, setLocations] = useState<ServiceLocationRow[]>([]);
  const [parts, setParts] = useState<PartRow[]>([]);
  const [fromLoc, setFromLoc] = useState<string>("");
  const [toLoc, setToLoc] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([{ part_id: "", qty_requested: "" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const [locs, items] = await Promise.all([fetchLocations(), fetchParts("")]);
        const cleanedLocs = Array.isArray(locs) ? (locs as any) : [];
        setLocations(cleanedLocs);
        setParts(Array.isArray(items) ? (items as any) : []);

        // Default To Location = current location context (if available).
        try {
          const ls = window.localStorage.getItem("location_id");
          const v = ls ? String(Number(ls)) : "";
          if (v) setToLoc(v);
        } catch {
          // ignore
        }

        // Default Requested From = first warehouse if present.
        try {
          const wh = cleanedLocs.find((l: any) => String(l.location_type || "").toLowerCase() === "warehouse");
          if (wh && wh.id) setFromLoc(String(wh.id));
        } catch {
          // ignore
        }
      } catch (e: any) {
        toast({ title: "Error", description: e?.message || "Failed to load data", variant: "destructive" });
      }
    };
    void run();
  }, []);

  const addLine = () => setLines((prev) => [...prev, { part_id: "", qty_requested: "" }]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));

  const locationOptions = useMemo(() => {
    return (locations ?? []).map((l) => ({
      value: String(l.id),
      label: `${l.name}${l.location_type ? ` (${l.location_type})` : ""}`,
      keywords: `${l.name} ${l.location_type ?? ""}`,
    }));
  }, [locations]);

  const partOptions = useMemo(() => {
    return (parts ?? []).map((p) => ({
      value: String(p.id),
      label: formatPartLabel(p),
      keywords: `${p.part_name} ${p.sku ?? ""} ${(p as any).part_number ?? ""} ${(p as any).barcode_number ?? ""}`,
    }));
  }, [parts]);

  const canSave = useMemo(() => {
    if (!toLoc) return false;
    return lines.some((l) => l.part_id && Number(l.qty_requested) > 0);
  }, [toLoc, lines]);

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        from_location_id: fromLoc ? Number(fromLoc) : undefined,
        to_location_id: Number(toLoc),
        notes: notes.trim() || undefined,
        items: lines
          .filter((l) => l.part_id && Number(l.qty_requested) > 0)
          .map((l) => ({
            part_id: Number(l.part_id),
            qty_requested: Number(l.qty_requested),
            notes: (l.notes ?? "").trim() || undefined,
          })),
      };
      await createRequisition(payload);
      toast({ title: "Created", description: "Stock request created." });
      router.push("/inventory/stock-requests");
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to create stock request", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">New Stock Request</h1>
          <p className="text-muted-foreground mt-1">Create a request from the destination location</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/inventory/stock-requests")}>Back</Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Header</CardTitle>
          <CardDescription>Preferred source and destination location</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Requested From (preferred source)</Label>
              <SearchableSelect
                value={fromLoc}
                onValueChange={setFromLoc}
                options={locationOptions}
                placeholder="Optional"
                searchPlaceholder="Search locations..."
              />
              <p className="text-xs text-muted-foreground">Optional. Helps warehouses choose where to dispatch from.</p>
            </div>
            <div className="space-y-2">
              <Label>To Location</Label>
              <SearchableSelect
                value={toLoc}
                onValueChange={setToLoc}
                options={locationOptions}
                placeholder="Select location..."
                searchPlaceholder="Search locations..."
              />
              <p className="text-xs text-muted-foreground">This is the location that needs the stock.</p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Notes</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-md overflow-hidden mt-6">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Items</CardTitle>
          <CardDescription>Requested quantities (can be partial fulfilled later)</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {lines.map((line, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-7 space-y-2">
                <Label>Item</Label>
                <SearchableSelect
                  value={line.part_id}
                  onValueChange={(val) => {
                    const next = [...lines];
                    next[idx] = { ...next[idx], part_id: val };
                    setLines(next);
                  }}
                  options={partOptions}
                  placeholder="Select item..."
                  searchPlaceholder="Search items..."
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Qty</Label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  value={line.qty_requested}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...next[idx], qty_requested: e.target.value };
                    setLines(next);
                  }}
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Line Notes</Label>
                <Input
                  value={line.notes ?? ""}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...next[idx], notes: e.target.value };
                    setLines(next);
                  }}
                  placeholder="Optional"
                />
              </div>
              <div className="md:col-span-1 flex justify-end">
                <Button variant="outline" size="icon" onClick={() => removeLine(idx)} disabled={lines.length === 1}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" className="gap-2" onClick={addLine}>
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
            <div className="flex flex-col items-end gap-1">
              {!canSave ? (
                <div className="text-xs text-muted-foreground">
                  {!toLoc ? "Select a To Location." : "Add at least one item with qty > 0."}
                </div>
              ) : null}
              <Button onClick={submit} disabled={!canSave || saving}>
                {saving ? "Saving..." : "Create Request"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
