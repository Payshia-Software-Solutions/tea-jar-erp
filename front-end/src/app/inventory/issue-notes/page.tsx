"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { fetchIssueNotes, type IssueNoteRow } from "@/lib/api/inventory";
import { Loader2, Plus, RefreshCcw, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function IssueNotesPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<IssueNoteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async (query = "") => {
    setLoading(true);
    try {
      const data = await fetchIssueNotes(query);
      setRows(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setRows([]);
      toast({ title: "Error", description: e?.message || "Failed to load issue notes", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    void load(search);
  };

  const badgeClass = (s: string) => {
    const v = String(s || "").toLowerCase();
    if (v === "issued") return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20";
    if (v === "cancelled") return "bg-rose-500/10 text-rose-700 border-rose-500/20";
    return "bg-amber-500/10 text-amber-700 border-amber-500/20";
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Issue Notes</h1>
          <p className="text-muted-foreground mt-1">Issue stock directly to production/cost centers (Kitchen, Buffet, etc.)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void load(search)} className="gap-2">
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </Button>
          <Button asChild className="gap-2">
            <Link href="/inventory/issue-notes/new">
              <Plus className="w-4 h-4" />
              New Issue Note
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search issue number or cost center..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button type="submit">Search</Button>
        </form>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Material Issues</CardTitle>
          <CardDescription>Records of bulk raw material issues to cost centers</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading issue notes...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">No issue notes found.</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Issue Number</TableHead>
                  <TableHead>Cost Center</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Qty Issued</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Issued At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/10">
                    <TableCell className="font-mono text-xs font-bold">#{r.id}</TableCell>
                    <TableCell className="font-semibold">{r.issue_number}</TableCell>
                    <TableCell className="font-medium">{(r as any).cost_center_name ?? r.cost_center}</TableCell>
                    <TableCell>{r.location_name ?? `ID: ${r.location_id}`}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={badgeClass(r.status)}>{r.status}</Badge>
                    </TableCell>
                    <TableCell>{r.total_qty_issued ? Number(r.total_qty_issued).toFixed(2) : "0.00"}</TableCell>
                    <TableCell className="font-semibold">
                      Rs. {r.total_amount ? Number(r.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.issued_at ? new Date(r.issued_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/inventory/issue-notes/${r.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
