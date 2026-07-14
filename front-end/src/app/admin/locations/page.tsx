"use client"

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { deleteLocation, fetchLocations, ServiceLocation } from "@/lib/api";
import { Loader2, MapPin, Plus, Trash2, Pencil, Search, Copy, Check } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminLocationsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<ServiceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchLocations();
      setRows(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      String(r.id).includes(q) ||
      (r.address ?? "").toLowerCase().includes(q) ||
      (r.phone ?? "").toLowerCase().includes(q)
    );
  }, [rows, query]);

  const remove = async (id: number) => {
    if (!confirm("Delete this location? This will remove all associated service bay data.")) return;
    try {
      await deleteLocation(String(id));
      toast({ title: "Deleted", description: "Location deleted" });
      await load();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const copyKioskUrl = (id: number) => {
    // Determine the kiosk domain (for now default to localhost or an example)
    // You can update this domain later when deploying
    const url = `http://localhost:5173/?loc=${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({ title: "Copied!", description: "Kiosk URL copied to clipboard" });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Service Locations
          </h1>
          <p className="text-muted-foreground mt-1">Configure your centers, factories, and warehouses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-primary/5 border-primary/20 text-primary">
            {rows.length} Total
          </Badge>
          <Link href="/admin/locations/new">
            <Button className="gap-2 bg-primary">
              <Plus className="w-4 h-4" />
              New Location
            </Button>
          </Link>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Location Directory</CardTitle>
              <CardDescription>Managed sites and their operational capabilities.</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-3" />
              <Input
                className="pl-9"
                placeholder="Search locations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Syncing location data...</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[90px]">ID</TableHead>
                  <TableHead>Location Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capabilities</TableHead>
                  <TableHead>Kiosk URL</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/10 transition-colors">
                    <TableCell className="font-mono text-xs font-bold text-muted-foreground">#{r.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{r.name}</span>
                        <span className="text-xs text-muted-foreground">{r.address || "No address provided"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="secondary" className="capitalize">
                         {r.location_type || "service"}
                       </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className={r.is_pos_active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-400 border-slate-200"}>
                                {r.is_pos_active ? "POS" : "NO POS"}
                            </Badge>
                            <Badge variant="outline" className={r.allow_production ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-slate-50 text-slate-400 border-slate-200"}>
                                {r.allow_production ? "PRODUCTION" : "NO PROD"}
                            </Badge>
                        </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">?loc={r.id}</code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          onClick={() => copyKioskUrl(r.id)}
                          title="Copy Full Kiosk URL"
                        >
                          {copiedId === r.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <Link href={`/admin/locations/${r.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-primary hover:bg-primary/10 transition-all">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 transition-all"
                          onClick={() => void remove(r.id)}
                          disabled={r.id === 1}
                          title={r.id === 1 ? "Default location cannot be deleted" : "Delete"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-20 text-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                         <MapPin className="w-12 h-12 text-muted/30 mb-2" />
                         <p className="italic">No locations matching your search.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
