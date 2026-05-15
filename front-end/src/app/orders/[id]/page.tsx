// Fix build error
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  addOrderPart,
  contentUrl,
  deleteOrderPart,
  fetchOrder,
  fetchOrderParts,
  fetchParts,
  completeOrder,
  updateOrder,
  updateOrderRelease,
  updateOrderPart,
  type OrderPartRow,
  type PartRow,
  updateOrderDetails,
  fetchCategories,
  fetchChecklistTemplates,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  CalendarDays,
  Car,
  ChevronLeft,
  ClipboardList,
  Clock,
  Gauge,
  Hash,
  Loader2,
  CheckCircle2,
  Plus,
  Printer,
  Tag,
  Trash2,
  Boxes,
  MapPin,
  User,
  MessageSquare,
  FileText,
  Settings2,
} from "lucide-react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

function parseMysqlDatetime(value: any): Date | null {
  if (!value || typeof value !== "string") return null;
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function toInputDateTime(value: any): string {
  if (!value || typeof value !== "string") return "";
  const iso = value.includes("T") ? value : value.replace(" ", "T");
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function safeJsonArray(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

const statusStyles: Record<string, string> = {
  Pending: "bg-slate-100 text-slate-700",
  "In Progress": "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const priorityStyles: Record<string, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-blue-100 text-blue-800",
  High: "bg-amber-100 text-amber-900",
  Urgent: "bg-red-100 text-red-800",
};

type ChecklistDoneItem = { item: string; checked: boolean; comment?: string };

function safeChecklistDone(value: any): ChecklistDoneItem[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((v) => ({
        item: String((v as any)?.item ?? ""),
        checked: Boolean((v as any)?.checked ?? false),
        comment: (v as any)?.comment ? String((v as any).comment) : "",
      }))
      .filter((v) => v.item);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return safeChecklistDone(parsed);
      return [];
    } catch {
      return [];
    }
  }
  return [];
}

function timeRemaining(expectedAt: Date | null) {
  if (!expectedAt) return null;
  const ms = expectedAt.getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  const sign = ms < 0 ? -1 : 1;
  const abs = Math.abs(ms);
  const mins = Math.floor(abs / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const label = h > 0 ? `${h}h ${m}m` : `${m}m`;
  return sign < 0 ? `Overdue by ${label}` : `${label} remaining`;
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [partsUsed, setPartsUsed] = useState<OrderPartRow[]>([]);
  const [partsMaster, setPartsMaster] = useState<PartRow[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addPartId, setAddPartId] = useState<string>("");
  const [addQty, setAddQty] = useState<string>("1");
  const [savingPart, setSavingPart] = useState(false);
  const [checklistState, setChecklistState] = useState<ChecklistDoneItem[]>([]);
  const [completionNotes, setCompletionNotes] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [releaseTime, setReleaseTime] = useState("");
  const [savingRelease, setSavingRelease] = useState(false);
  const [editingLineId, setEditingLineId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState<string>("");
  const [selectedPart, setSelectedPart] = useState<PartRow | null>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [activeChecklistIdx, setActiveChecklistIdx] = useState<number | null>(null);

  // Edit Categories & Checklist
  const [isEditingCategories, setIsEditingCategories] = useState(false);
  const [isEditingChecklist, setIsEditingChecklist] = useState(false);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [allChecklistTemplates, setAllChecklistTemplates] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const [o, cats, templates] = await Promise.all([
          fetchOrder(String(id)),
          fetchCategories().catch(() => []),
          fetchChecklistTemplates().catch(() => []),
        ]);
        setOrder(o);
        setAllCategories(cats);
        setAllChecklistTemplates(templates);
        setSelectedCategories(o.categories || []);
        setSelectedChecklist(o.checklist || []);
      } catch (e: any) {
        setOrder(null);
        setError(e?.message || "Failed to load order");
      } finally {
        setLoading(false);
      }
    };
    if (id) void run();
  }, [id]);

  const data = useMemo(() => {
    const o: any = order || {};
    const createdAt = parseMysqlDatetime(o.created_at);
    const expectedAt = parseMysqlDatetime(o.expected_time);

    return {
      id: o.id ?? id,
      status: String(o.status || "Pending"),
      priority: String(o.priority || "Medium"),
      vehicleModel: String(o.vehicle_model || "Repair Order"),
      vehicleIdentifier: String(o.vehicle_identifier || ""),
      mileage: o.mileage ?? null,
      problem: String(o.problem_description || ""),
      comments: String(o.comments || ""),
      bay: String(o.location || ""),
      technician: String(o.technician || ""),
      createdAt,
      expectedAt,
      releaseAt: parseMysqlDatetime(o.release_time),
      releaseRaw: String(o.release_time || ""),
      categories: safeJsonArray(o.categories_json),
      checklist: safeJsonArray(o.checklist_json),
      checklistDone: safeChecklistDone(o.checklist_done_json),
      completionComments: String(o.completion_comments || ""),
      attachments: safeJsonArray(o.attachments_json),
    };
  }, [order, id]);

  // Re-sync selection state when dialogs open to ensure we don't lose existing data
  useEffect(() => {
    if (isEditingCategories) {
      setSelectedCategories(data.categories || []);
    }
  }, [isEditingCategories, data.categories]);

  useEffect(() => {
    if (isEditingChecklist) {
      setSelectedChecklist(data.checklist || []);
    }
  }, [isEditingChecklist, data.checklist]);

  const loadParts = async () => {
    if (!id) return;
    setPartsLoading(true);
    try {
      const [lines, master] = await Promise.all([fetchOrderParts(String(id)), fetchParts("")]);
      setPartsUsed(Array.isArray(lines) ? lines : []);
      setPartsMaster(Array.isArray(master) ? master : []);
    } catch (e: any) {
      setPartsUsed([]);
      toast({ title: "Inventory", description: e?.message || "Failed to load parts", variant: "destructive" });
    } finally {
      setPartsLoading(false);
    }
  };

  useEffect(() => {
    void loadParts();
  }, [id]);

  useEffect(() => {
    if (!addPartId) {
      setSelectedPart(null);
      setBatches([]);
      return;
    }
    const p = partsMaster.find((x) => String(x.id) === addPartId);
    setSelectedPart(p || null);

    if (p && (p.is_fifo || p.is_expiry)) {
      const run = async () => {
        setBatchesLoading(true);
        try {
          const res = await fetchPartBatches(p.id, order?.location_id || 1);
          setBatches(Array.isArray(res) ? res : []);
        } catch (e) {
          console.error("Failed to load batches", e);
          setBatches([]);
        } finally {
          setBatchesLoading(false);
        }
      };
      void run();
    } else {
      setBatches([]);
    }
  }, [addPartId, partsMaster, order?.location_id]);


  const remaining = useMemo(() => timeRemaining(data.expectedAt), [data.expectedAt]);
  const isLocked = data.status === "Completed" || data.status === "Cancelled";

  useEffect(() => {
    if (!isLocked) return;
    // Ensure any edit UIs are closed when the job becomes locked.
    setAddOpen(false);
    setCompleteOpen(false);
    setEditingLineId(null);
  }, [isLocked]);

  useEffect(() => {
    if (!order) return;
    const base = data.checklist.map((item) => ({
      item,
      checked: false,
      comment: "",
    }));
    if (data.checklistDone.length === 0) {
      setChecklistState(base);
    } else {
      const map = new Map(data.checklistDone.map((d) => [d.item, d]));
      const merged = base.map((b) => {
        const match = map.get(b.item);
        return match ? { ...b, checked: !!match.checked, comment: match.comment ?? "" } : b;
      });
      const extras = data.checklistDone.filter((d) => !data.checklist.includes(d.item));
      setChecklistState([...merged, ...extras]);
    }
    setCompletionNotes(data.completionComments || "");
    setReleaseTime(toInputDateTime(data.releaseRaw));
  }, [order, data.checklist, data.checklistDone, data.completionComments, data.releaseRaw]);

  const onPrint = () => {
    const url = `/orders/print/${encodeURIComponent(String(data.id))}?autoprint=1`;
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) router.push(url);
  };

  const onPrintCompletion = () => {
    const url = `/orders/completion-print/${encodeURIComponent(String(data.id))}?autoprint=1`;
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (!w) router.push(url);
  };

  const onUpdateDetails = async (payload: { categories?: string[]; checklist?: string[] }) => {
    if (!id || isUpdating) return;
    setIsUpdating(true);
    try {
      await updateOrderDetails(String(id), payload);
      const updated = await fetchOrder(String(id));
      setOrder(updated);
      toast({ 
        title: "Order Updated", 
        description: "Your changes have been saved successfully." 
      });
      setIsEditingCategories(false);
      setIsEditingChecklist(false);
    } catch (err: any) {
      toast({ 
        title: "Update Failed", 
        description: err.message || "Failed to update order details", 
        variant: "destructive" 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    if (isLocked) return;
    setCompleting(true);
    try {
      await completeOrder(String(id), {
        status: "Completed",
        checklist_done: checklistState,
        completion_comments: completionNotes,
      });
      setOrder((prev: any) => ({
        ...(prev || {}),
        status: "Completed",
        checklist_done_json: JSON.stringify(checklistState),
        completion_comments: completionNotes,
      }));
      setCompleteOpen(false);
      toast({ title: "Completed", description: "Order marked Completed." });
      const url = `/orders/completion-print/${encodeURIComponent(String(id))}?autoprint=1`;
      const w = window.open(url, "_blank", "noopener,noreferrer");
      if (!w) router.push(url);
    } catch (e: any) {
      toast({ title: "Complete failed", description: e?.message || "Failed to complete order", variant: "destructive" });
    } finally {
      setCompleting(false);
    }
  };

  const handleReleaseSave = async () => {
    if (!id) return;
    if (isLocked) {
      toast({ title: "Locked", description: "Completed jobs cannot be edited." });
      return;
    }
    setSavingRelease(true);
    try {
      const payload = releaseTime ? releaseTime : null;
      await updateOrderRelease(String(id), payload);
      setOrder((prev: any) => ({ ...(prev || {}), release_time: payload }));
      toast({ title: "Release time updated" });
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message || "Failed to update release time", variant: "destructive" });
    } finally {
      setSavingRelease(false);
    }
  };

  const totalParts = useMemo(() => {
    return partsUsed.reduce((sum, l) => sum + (l.line_total ? Number(l.line_total) : 0), 0);
  }, [partsUsed]);

  const checklistChecked = useMemo(() => checklistState.filter((c) => c.checked).length, [checklistState]);

  const openAddPart = () => {
    if (isLocked) {
      toast({ title: "Locked", description: "Completed jobs cannot be edited." });
      return;
    }
    setAddPartId("");
    setAddQty("1");
    setAddOpen(true);
  };

  const submitAddPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;
    const pid = Number(addPartId);
    const qty = Math.trunc(Number(addQty));
    if (!pid || qty <= 0) return;
    setSavingPart(true);
    try {
      await addOrderPart(String(id), { part_id: pid, quantity: qty });
      toast({ title: "Added", description: "Part issued to the order" });
      setAddOpen(false);
      await loadParts();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to add part", variant: "destructive" });
    } finally {
      setSavingPart(false);
    }
  };

  const startEditQty = (line: OrderPartRow) => {
    if (isLocked) {
      toast({ title: "Locked", description: "Completed jobs cannot be edited." });
      return;
    }
    setEditingLineId(line.id);
    setEditQty(String(line.quantity ?? ""));
  };

  const saveEditQty = async () => {
    if (!editingLineId) return;
    if (isLocked) return;
    const qty = Math.trunc(Number(editQty));
    if (qty <= 0) return;
    setSavingPart(true);
    try {
      await updateOrderPart(String(editingLineId), qty);
      toast({ title: "Updated", description: "Part quantity updated" });
      setEditingLineId(null);
      setEditQty("");
      await loadParts();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Update failed", variant: "destructive" });
    } finally {
      setSavingPart(false);
    }
  };

  const removeLine = async (line: OrderPartRow) => {
    if (isLocked) return;
    if (!confirm(`Remove "${line.part_name ?? "item"}" from this order? Stock will be returned.`)) return;
    setSavingPart(true);
    try {
      await deleteOrderPart(String(line.id));
      toast({ title: "Removed", description: "Part removed from the order" });
      await loadParts();
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Remove failed", variant: "destructive" });
    } finally {
      setSavingPart(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading order...
        </div>
      </DashboardLayout>
    );
  }

  if (!order || error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <AlertCircle className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Order Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {error ? error : `The repair order ID ${id} does not exist.`}
          </p>
          <Button onClick={() => router.push("/orders")}>Back to Queue</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
            onClick={() => router.back()}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            {!isLocked ? (
              <Button variant="outline" size="sm" className="gap-2" onClick={() => setCompleteOpen(true)}>
                <CheckCircle2 className="w-4 h-4" />
                Complete Job
              </Button>
            ) : null}
            {data.status === "Completed" && (
              <Button variant="default" size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={onPrintCompletion}>
                <FileText className="w-4 h-4" />
                Print Report
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={onPrint}>
              <Printer className="w-4 h-4" />
              Thermal
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="p-0">
                <div className="p-6 bg-gradient-to-br from-primary/10 via-background to-background border-b">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="p-3 bg-card border border-border/60 rounded-2xl shadow-sm dark:shadow-black/20 shrink-0">
                          <Car className="w-8 h-8 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-2xl font-bold tracking-tight truncate">{data.vehicleModel}</h1>
                            <Badge
                              variant="secondary"
                              className={cn(priorityStyles[data.priority] || "bg-slate-100 text-slate-700", "border-none")}
                            >
                              {data.priority}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground font-mono uppercase tracking-widest">
                            <span>Order</span>
                            <span>#{data.id}</span>
                          </div>
                          {data.vehicleIdentifier ? (
                            <div className="mt-1 text-xs text-muted-foreground truncate">{data.vehicleIdentifier}</div>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn(statusStyles[data.status] || "bg-slate-100 text-slate-700", "px-4 py-1 text-sm font-bold")}
                        >
                          {data.status}
                        </Badge>
                      </div>
                    </div>

                    {isLocked ? (
                      <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
                        This job is <span className="font-semibold text-foreground">{data.status}</span> and is locked for editing.
                      </div>
                    ) : null}

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 pt-2">
                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm dark:shadow-black/20">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          <Gauge className="w-3.5 h-3.5" />
                          Mileage
                        </div>
                        <div className="mt-1 text-sm font-bold">
                          {data.mileage ? `${Number(data.mileage).toLocaleString()} km` : "-"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm dark:shadow-black/20">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          <CalendarDays className="w-3.5 h-3.5" />
                          Created
                        </div>
                        <div className="mt-1 text-sm font-bold">
                          {data.createdAt ? format(data.createdAt, "MMM d, yyyy HH:mm") : "-"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm dark:shadow-black/20">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          <Clock className="w-3.5 h-3.5" />
                          Expected
                        </div>
                        <div className="mt-1 text-sm font-bold">
                          {data.expectedAt ? format(data.expectedAt, "MMM d, yyyy HH:mm") : "-"}
                        </div>
                        {remaining ? (
                          <div
                            className={cn(
                              "mt-1 text-xs",
                              remaining.startsWith("Overdue") ? "text-red-600 dark:text-red-300" : "text-muted-foreground"
                            )}
                          >
                            {remaining}
                          </div>
                        ) : null}
                      </div>

                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm dark:shadow-black/20">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          <MapPin className="w-3.5 h-3.5" />
                          Bay
                        </div>
                        <div className="mt-1 text-sm font-bold">
                          {data.bay ? data.bay : "Unassigned"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm dark:shadow-black/20">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          <User className="w-3.5 h-3.5" />
                          Technician
                        </div>
                        <div className="mt-1 text-sm font-bold">
                          {data.technician ? data.technician : "Unassigned"}
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm dark:shadow-black/20">
                        <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                          <Hash className="w-3.5 h-3.5" />
                          Checklist
                        </div>
                        <div className="mt-1 text-sm font-bold">{data.checklist.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-muted-foreground" />
                        Problem Description
                      </CardTitle>
                      <CardDescription>Reported issue for this repair order</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-xl border bg-muted/10 p-4 whitespace-pre-wrap min-h-[92px]">
                        {data.problem || "-"}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border shadow-none">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        Comments
                      </CardTitle>
                      <CardDescription>Optional notes captured during intake</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-xl border bg-muted/10 p-4 whitespace-pre-wrap min-h-[92px]">
                        {data.comments || "-"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <Card className="border shadow-none lg:col-span-5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-base">Categories</CardTitle>
                        <CardDescription>Tags for reporting and routing</CardDescription>
                      </div>
                      {!isLocked && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => setIsEditingCategories(true)}>
                          <Settings2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {data.categories.length ? (
                        <div className="flex flex-wrap gap-2">
                          {data.categories.map((c) => (
                            <Badge key={c} variant="secondary" className="rounded-full">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No categories</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border shadow-none lg:col-span-7">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <div>
                        <CardTitle className="text-base">Checklist</CardTitle>
                        <CardDescription>Items to verify for this repair</CardDescription>
                      </div>
                      {!isLocked && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary" onClick={() => setIsEditingChecklist(true)}>
                          <Settings2 className="w-4 h-4" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {checklistState.length ? (
                        <ScrollArea className="h-[240px] pr-3">
                          <div className="space-y-2">
                            {checklistState.map((c, idx) => (
                              <div key={`${c.item}-${idx}`} className="rounded-lg border bg-muted/5 p-3 space-y-2">
                                  <div 
                                    className={cn(
                                      "flex items-start justify-between gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                                      c.checked ? "bg-green-50/50 border-green-200 dark:bg-green-950/20 dark:border-green-900/50" : "bg-muted/5 hover:bg-muted/10"
                                    )}
                                    onClick={() => !isLocked && setActiveChecklistIdx(idx)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <Checkbox
                                        checked={c.checked}
                                        disabled={isLocked}
                                        onCheckedChange={(v) => {
                                          const next = [...checklistState];
                                          next[idx] = { ...next[idx], checked: Boolean(v) };
                                          setChecklistState(next);
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                      <div className="space-y-1">
                                        <div className="text-sm leading-tight font-medium">{c.item}</div>
                                        {c.comment && (
                                          <div className="text-xs text-muted-foreground line-clamp-1 italic">
                                            "{c.comment}"
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <MessageSquare className={cn("w-4 h-4 shrink-0 mt-0.5", c.comment ? "text-primary" : "text-muted-foreground/40")} />
                                  </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-sm text-muted-foreground">No checklist items</div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card className="border shadow-none">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-muted-foreground" />
                        Parts Used
                      </CardTitle>
                      <CardDescription>Items issued to this repair order (stock is deducted)</CardDescription>
                    </div>
                    {isLocked ? null : (
                      <Button onClick={openAddPart} className="gap-2" disabled={partsLoading || savingPart}>
                        <Plus className="w-4 h-4" />
                        Add Part
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {partsLoading ? (
                      <div className="flex items-center justify-center py-10 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Loading parts...
                      </div>
                    ) : partsUsed.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No parts issued yet</div>
                    ) : (
                      <div className="rounded-md border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow>
                              <TableHead>Item</TableHead>
                              <TableHead className="w-[120px]">Qty</TableHead>
                              <TableHead className="hidden md:table-cell w-[140px]">Unit Price</TableHead>
                              <TableHead className="w-[140px]">Total</TableHead>
                              {isLocked ? null : <TableHead className="text-right w-[120px]">Actions</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {partsUsed.map((l) => {
                              const isEditing = editingLineId === l.id;
                              return (
                                <TableRow key={l.id}>
                                  <TableCell>
                                    <div className="font-semibold">{l.part_name ?? `Part #${l.part_id}`}</div>
                                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                      {l.sku ? `SKU: ${l.sku}` : `LINE ID: #${l.id}`}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {isEditing ? (
                                      <Input value={editQty} onChange={(e) => setEditQty(e.target.value)} inputMode="numeric" />
                                    ) : (
                                      <div className="font-bold">
                                        {Number(l.quantity ?? 0).toLocaleString()} {l.unit ? <span className="text-xs text-muted-foreground font-normal">{l.unit}</span> : null}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell className="hidden md:table-cell">
                                    <span className="text-sm text-muted-foreground">{l.unit_price !== null ? Number(l.unit_price).toFixed(2) : "-"}</span>
                                  </TableCell>
                                  <TableCell className="font-semibold">
                                    {l.line_total !== null ? Number(l.line_total).toFixed(2) : "-"}
                                  </TableCell>
                                  {isLocked ? null : (
                                    <TableCell className="text-right">
                                      {isEditing ? (
                                        <div className="inline-flex items-center gap-2 justify-end">
                                          <Button size="sm" onClick={() => void saveEditQty()} disabled={savingPart}>Save</Button>
                                          <Button size="sm" variant="outline" onClick={() => setEditingLineId(null)} disabled={savingPart}>Cancel</Button>
                                        </div>
                                      ) : (
                                        <div className="inline-flex items-center gap-2 justify-end">
                                          <Button size="sm" variant="outline" onClick={() => startEditQty(l)} disabled={savingPart}>Edit</Button>
                                          <Button size="sm" variant="destructive" onClick={() => void removeLine(l)} disabled={savingPart}>
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })}
                            <TableRow>
                              <TableCell colSpan={3} className="text-right font-semibold">Total</TableCell>
                              <TableCell className="font-bold">{totalParts.toFixed(2)}</TableCell>
                              {isLocked ? null : <TableCell />}
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border shadow-none">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Attachments</CardTitle>
                    <CardDescription>Files uploaded to the content provider</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {data.attachments.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {data.attachments.map((fn) => (
                          <a
                            key={fn}
                            href={contentUrl('orders', fn)}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border bg-muted/5 px-3 py-2 text-sm hover:bg-muted/20 transition-colors"
                          >
                            {fn}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">No attachments</div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Release Time</CardTitle>
                <CardDescription>Set the planned release time (can differ from expected time)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLocked ? (
                  <div className="rounded-xl border bg-muted/10 p-4 text-sm">
                    {data.releaseAt ? format(data.releaseAt, "MMM d, yyyy HH:mm") : <span className="text-muted-foreground">Not set</span>}
                  </div>
                ) : (
                  <>
                    <Input
                      type="datetime-local"
                      value={releaseTime}
                      onChange={(e) => setReleaseTime(e.target.value)}
                    />
                    <Button className="w-full" onClick={handleReleaseSave} disabled={savingRelease}>
                      {savingRelease ? "Saving..." : "Save Release Time"}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-primary text-white overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg text-white">Expected Completion</CardTitle>
                <CardDescription className="text-white/70">Estimated deadline for this job</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-3xl font-bold leading-none">
                      {data.expectedAt ? format(data.expectedAt, "HH:mm") : "-"}
                    </p>
                    <p className="text-xs text-white/70 truncate mt-1">
                      {data.expectedAt ? format(data.expectedAt, "EEEE, MMM d") : "Not set"}
                    </p>
                    {remaining ? (
                      <p className="text-xs mt-2 text-white/80">{remaining}</p>
                    ) : null}
                    {data.releaseAt ? (
                      <p className="text-xs mt-2 text-white/80">
                        Release: {format(data.releaseAt, "MMM d, HH:mm")}
                      </p>
                    ) : null}
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="space-y-2">
                  <p className="text-[10px] uppercase font-bold text-white/60 tracking-widest">Status</p>
                  <p className="text-sm font-medium">{data.status}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
                <CardDescription>Print or go back to queue</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.status === "Completed" && (
                  <Button className="w-full gap-2 bg-primary hover:bg-primary/90" onClick={onPrintCompletion}>
                    <FileText className="w-4 h-4" />
                    Print Completion Report (A4)
                  </Button>
                )}
                <Button variant="outline" className="w-full gap-2 text-slate-600 border-slate-200" onClick={onPrint}>
                  <Printer className="w-4 h-4" />
                  Print Thermal Receipt
                </Button>
                <Button variant="outline" className="w-full gap-2" onClick={() => router.push("/orders")}>
                  <ChevronLeft className="w-4 h-4" />
                  Back to Orders
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <form onSubmit={submitAddPart}>
            <DialogHeader>
              <DialogTitle>Add Part</DialogTitle>
              <DialogDescription>Select an item and quantity to issue to this order.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Item</Label>
                <div className="col-span-3 space-y-2">
                  <Select value={addPartId} onValueChange={setAddPartId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select item..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-[280px]">
                      {partsMaster.map((p) => {
                         const stock = (p as any).location_stock_quantity ?? 0;
                         return (
                          <SelectItem key={p.id} value={String(p.id)}>
                            <div className="flex flex-col">
                              <span>{p.sku ? `${p.part_name} (${p.sku})` : p.part_name}</span>
                              {p.item_type !== 'Service' && (
                                <span className={cn("text-[10px] uppercase font-bold tracking-tighter", stock > 0 ? "text-green-600" : "text-red-500")}>
                                  Available: {Number(stock).toLocaleString()} {p.unit}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                         );
                      })}
                    </SelectContent>
                  </Select>
                  
                  {selectedPart && (
                    <div className="text-xs text-muted-foreground flex items-center justify-between px-1">
                      <span>Price: {Number(selectedPart.price).toFixed(2)}</span>
                      {selectedPart.unit && <span>Unit: {selectedPart.unit}</span>}
                    </div>
                  )}
                </div>
              </div>

              {batches.length > 0 && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right pt-2">Batches</Label>
                  <div className="col-span-3 border rounded-lg overflow-hidden bg-muted/5">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent h-8">
                          <TableHead className="text-[10px] h-8">Lot #</TableHead>
                          <TableHead className="text-[10px] h-8">Expiry</TableHead>
                          <TableHead className="text-[10px] h-8 text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {batches.map((b, idx) => (
                          <TableRow key={b.id || idx} className="h-8">
                            <TableCell className="text-[10px] py-1">{b.batch_number || "N/A"}</TableCell>
                            <TableCell className="text-[10px] py-1">{b.expiry_date || "N/A"}</TableCell>
                            <TableCell className="text-[10px] py-1 text-right font-bold">
                              {Number(b.quantity_on_hand).toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {batchesLoading && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div />
                  <div className="col-span-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking batch availability...
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="qty" className="text-right">Qty</Label>
                <Input
                  id="qty"
                  className="col-span-3"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value)}
                  inputMode="numeric"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingPart}>
                {savingPart && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={activeChecklistIdx !== null} onOpenChange={(v) => !v && setActiveChecklistIdx(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Checklist Item Details</DialogTitle>
            <DialogDescription>Update the status and add comments for this task.</DialogDescription>
          </DialogHeader>
          
          {activeChecklistIdx !== null && checklistState[activeChecklistIdx] && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/30">
                <div className="space-y-0.5">
                  <Label className="text-base">{checklistState[activeChecklistIdx].item}</Label>
                  <p className="text-xs text-muted-foreground">Mark this task as completed</p>
                </div>
                <Checkbox
                  className="h-6 w-6"
                  checked={checklistState[activeChecklistIdx].checked}
                  onCheckedChange={(v) => {
                    const next = [...checklistState];
                    next[activeChecklistIdx] = { ...next[activeChecklistIdx], checked: Boolean(v) };
                    setChecklistState(next);
                  }}
                />
              </div>

              <div className="space-y-3">
                <Label>Notes & Observations</Label>
                <Textarea
                  placeholder="E.g. Brake pads are 50% worn, suggested replacement in next service..."
                  value={checklistState[activeChecklistIdx].comment || ""}
                  rows={5}
                  className="resize-none"
                  onChange={(e) => {
                    const next = [...checklistState];
                    next[activeChecklistIdx] = { ...next[activeChecklistIdx], comment: e.target.value };
                    setChecklistState(next);
                  }}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button className="w-full" onClick={() => setActiveChecklistIdx(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Complete Job</DialogTitle>
            <DialogDescription>Confirm completion details and generate the A4 completion document.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm flex items-center justify-between">
              <span>Checklist checked</span>
              <span className="font-semibold">{checklistChecked} / {checklistState.length}</span>
            </div>
            <div className="space-y-2">
              <Label>Completion Notes</Label>
              <Textarea
                placeholder="Optional completion notes for the report..."
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCompleteOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleComplete} disabled={completing}>
              {completing ? "Completing..." : "Complete & Print"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Categories Dialog */}
      <Dialog open={isEditingCategories} onOpenChange={setIsEditingCategories}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Service Categories</DialogTitle>
            <DialogDescription>
              Select the service types applicable to this repair order.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 py-4 max-h-[300px] overflow-y-auto pr-2">
            {allCategories.map((cat) => (
              <div 
                key={cat.id} 
                className={cn(
                  "flex items-center gap-2 p-2 border rounded-md cursor-pointer transition-colors",
                  selectedCategories.includes(cat.name) 
                    ? "bg-primary/10 border-primary text-primary" 
                    : "hover:bg-slate-50 border-slate-100"
                )}
                onClick={() => {
                  setSelectedCategories(prev => 
                    prev.includes(cat.name) 
                      ? prev.filter(n => n !== cat.name) 
                      : [...prev, cat.name]
                  );
                }}
              >
                <div className={cn(
                  "w-4 h-4 rounded-sm border flex items-center justify-center",
                  selectedCategories.includes(cat.name) ? "bg-primary border-primary text-white" : "border-slate-300"
                )}>
                  {selectedCategories.includes(cat.name) && <CheckCircle2 className="w-3 h-3" />}
                </div>
                <span className="text-xs font-medium">{cat.name}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingCategories(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={() => onUpdateDetails({ categories: selectedCategories })} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Checklist Dialog */}
      <Dialog open={isEditingChecklist} onOpenChange={setIsEditingChecklist}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Technical Checklist</DialogTitle>
            <DialogDescription>
              Select additional inspection points from the master template.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2 py-4 max-h-[350px] overflow-y-auto pr-2">
            {allChecklistTemplates.map((item) => {
              const label = item.description || item.name || "Unnamed Item";
              const isAlreadySaved = data.checklist.includes(label);
              const isSelected = selectedChecklist.includes(label);
              
              return (
                <div 
                  key={item.id} 
                  className={cn(
                    "flex items-center gap-3 p-3 border rounded-md transition-colors",
                    isAlreadySaved 
                      ? "bg-slate-50 border-slate-200 opacity-80 cursor-not-allowed" 
                      : "cursor-pointer hover:bg-slate-50 border-slate-100",
                    isSelected && !isAlreadySaved ? "bg-primary/5 border-primary/40 text-primary" : ""
                  )}
                  onClick={() => {
                    if (isAlreadySaved) return;
                    setSelectedChecklist(prev => 
                      prev.includes(label) 
                        ? prev.filter(n => n !== label) 
                        : [...prev, label]
                    );
                  }}
                >
                  <div className={cn(
                    "w-5 h-5 rounded-sm border flex items-center justify-center shrink-0",
                    isSelected ? "bg-primary border-primary text-white" : "border-slate-300",
                    isAlreadySaved ? "bg-slate-400 border-slate-400" : ""
                  )}>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-xs font-bold uppercase tracking-tight",
                        isAlreadySaved ? "text-slate-500" : ""
                      )}>
                        {label}
                      </span>
                      {isAlreadySaved && (
                        <Badge variant="outline" className="text-[9px] h-3.5 px-1 bg-slate-100 text-slate-500 border-slate-300">
                          Saved
                        </Badge>
                      )}
                    </div>
                    {item.category && <p className="text-[10px] text-slate-500">{item.category}</p>}
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditingChecklist(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={() => onUpdateDetails({ checklist: selectedChecklist })} disabled={isUpdating}>
              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Update Checklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
