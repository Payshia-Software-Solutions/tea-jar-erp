"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchGrns, type GrnRow, cancelGrn } from "@/lib/api";
import { 
    AlertCircle, 
    Loader2, 
    PackageCheck, 
    Plus, 
    Search, 
    Printer, 
    XCircle, 
    MoreVertical 
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function GrnPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<GrnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [locations, setLocations] = useState<any[]>([]);
  const [locationId, setLocationId] = useState<string>("all");

  // Cancellation State
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [cancellingGrn, setCancellingGrn] = useState<GrnRow | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const locParam = locationId === "all" ? null : locationId;
      const grnRows = await fetchGrns("", locParam);
      setRows(Array.isArray(grnRows) ? grnRows : []);
    } catch (e: any) {
      toast({ title: "Error", description: e?.message || "Failed to load GRNs", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    import("@/lib/api").then(api => {
      api.fetchLocations().then(res => setLocations(Array.isArray(res) ? res : [])).catch(console.error);
    });
  }, []);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const grn = String(r.grn_number ?? "").toLowerCase();
      const supplier = String(r.supplier_name ?? "").toLowerCase();
      const po = String(r.po_number ?? "").toLowerCase();
      const loc = String((r as any).location_name ?? "").toLowerCase();
      return grn.includes(q) || supplier.includes(q) || po.includes(q) || loc.includes(q);
    });
  }, [rows, query]);

  const onPrint = (id: number) => {
    const url = `/inventory/grn/print/${encodeURIComponent(String(id))}?autoprint=1`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCancelGrn = async () => {
    if (!cancellingGrn || !cancelReason.trim()) {
        toast({ title: "Reason Required", description: "Please provide a reason for cancellation", variant: "destructive" });
        return;
    }

    setIsCancelling(true);
    try {
        await cancelGrn(cancellingGrn.id, cancelReason);
        toast({ title: "Cancelled", description: `GRN ${cancellingGrn.grn_number} has been cancelled.` });
        setIsCancelDialogOpen(false);
        setCancelReason("");
        setCancellingGrn(null);
        await load();
    } catch (e: any) {
        toast({ title: "Cancellation Failed", description: e.message, variant: "destructive" });
    } finally {
        setIsCancelling(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Goods Receive Notes</h1>
          <p className="text-muted-foreground mt-1">Receive stock, link to PO, and update average cost</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:inline-flex">
            {rows.length} GRNs
          </Badge>
          <Button asChild className="gap-2">
            <Link href="/inventory/grn/new">
              <Plus className="w-4 h-4" />
              New GRN
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search GRNs..." className="pl-9 h-11" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <select
            className="h-11 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
            value={locationId}
            onChange={e => setLocationId(e.target.value)}
          >
            <option value="all">All Locations</option>
            {locations.map((loc: any) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading GRNs...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <AlertCircle className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">No GRNs</h3>
                <p className="text-muted-foreground max-w-xs">{query ? "No results match your search." : "Create a GRN to receive stock."}</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>GRN</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="hidden md:table-cell">PO</TableHead>
                    <TableHead className="hidden md:table-cell">Received</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((g) => (
                    <TableRow key={g.id} className="hover:bg-muted/10 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <PackageCheck className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold">{g.grn_number}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">GRN ID: #{g.id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {g.location_name ? (
                          <Badge variant="outline" className="text-[10px] font-semibold">
                            {g.location_name}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{g.supplier_name ?? g.supplier_id}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        {g.po_number ? (
                          <Badge variant="outline" className="text-[10px]">
                            {g.po_number}
                          </Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {g.received_at ? new Date(String(g.received_at).replace(" ", "T")).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onPrint(g.id)} title="Print">
                                <Printer className="w-4 h-4" />
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
