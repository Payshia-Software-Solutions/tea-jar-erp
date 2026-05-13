"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchDatabaseAudit, syncSchema, optimizeDatabase, createSchemaSnapshot, dropDatabaseTable } from "@/lib/api/reports";
import { 
  Database, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCcw, 
  Search, 
  Table as TableIcon,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Settings2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TableAudit = {
  name: string;
  live: {
    columns: Record<string, any>;
    indexes: Record<string, any>;
  } | null | "CORRUPTED";
  defined: {
    name: string;
    columns: Record<string, any>;
    indexes: Record<string, any>;
  } | null;
  error?: string;
};

export default function TableVerificationPage() {
  const { toast } = useToast();
  const [data, setData] = useState<TableAudit[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "healthy" | "mismatch" | "missing">("all");
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const d = await fetchDatabaseAudit();
      console.log("Audit data received:", d);
      if (d && d.tables) {
        setData(d.tables);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Audit load failed:", err);
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (tableName?: string) => {
    const msg = tableName 
      ? `Are you sure you want to verify and repair the table '${tableName}'?`
      : "Are you sure you want to verify and repair ALL system tables?";
    
    if (!confirm(msg)) return;

    setSyncing(tableName || "all");
    try {
      await syncSchema(tableName);
      toast({ title: "Success", description: "Table structure verified and updated." });
      void load();
    } catch (err) {
      toast({ title: "Sync Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  const handleDrop = async (tableName: string) => {
    if (!confirm(`CAUTION: This will attempt to FORCE DROP the table '${tableName}'. Any remaining data in this table will be PERMANENTLY LOST. Continue?`)) return;

    setSyncing(tableName);
    try {
        await dropDatabaseTable(tableName);
        toast({ title: "Success", description: `Table ${tableName} dropped successfully.` });
        void load();
    } catch (err) {
        toast({ title: "Drop Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
        setSyncing(null);
    }
  };

  const handleOptimize = async () => {
    if (!confirm("Are you sure you want to optimize the database? This will add recommended indexes to improve performance. Already existing indexes will be skipped.")) return;

    setSyncing("optimize");
    try {
      const results = await optimizeDatabase();
      toast({ 
        title: "Database Optimized", 
        description: Array.isArray(results) && results.length > 0 
          ? `Added ${results.length} missing indexes.` 
          : "Database is already optimized." 
      });
      void load();
    } catch (err) {
      toast({ title: "Optimization Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filteredData = useMemo(() => {
    if (!data) return [];
    const q = searchQuery.toLowerCase().trim();
    
    // 1. Filter by Search
    let filtered = q ? data.filter(t => 
      t.name.toLowerCase().includes(q) || 
      Object.keys(t.defined?.columns || {}).some(c => c.toLowerCase().includes(q))
    ) : [...data];

    // 2. Filter by Status
    if (filter !== "all") {
      filtered = filtered.filter(t => {
        const isMissing = !t.live;
        const liveCols = t.live ? Object.keys(t.live.columns) : [];
        const defCols = t.defined ? Object.keys(t.defined.columns) : [];
        const isMismatch = !isMissing && (liveCols.length !== defCols.length || defCols.some(c => !t.live?.columns[c]));
        
        if (filter === "missing") return isMissing;
        if (filter === "mismatch") return isMismatch;
        if (filter === "healthy") return !isMissing && !isMismatch;
        return true;
      });
    }

    // 3. Sort: Missing (0) > Mismatched (1) > Healthy (2)
    return filtered.sort((a, b) => {
      const getScore = (t: TableAudit) => {
        if (!t.live) return 0; // Missing (Highest Priority)
        if (t.live === "CORRUPTED") return 0.5; // Corrupted (High Priority)
        
        const liveCols = Object.keys(t.live.columns);
        const defCols = Object.keys(t.defined?.columns || {});
        const isMismatch = liveCols.length !== defCols.length || defCols.some(c => !t.live?.columns[c as any]);
        
        if (isMismatch) return 1; // Mismatch
        return 2; // OK
      };
      
      const scoreA = getScore(a);
      const scoreB = getScore(b);
      
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.name.localeCompare(b.name);
    });
  }, [data, searchQuery, filter]);

  const stats = useMemo(() => {
    if (!data) return { total: 0, missing: 0, mismatch: 0, ok: 0 };
    let missing = 0, mismatch = 0, ok = 0;
    for (const t of data) {
      if (!t.live) missing++;
      else if (t.live === "CORRUPTED") missing++;
      else if (!t.defined) mismatch++; // Unexpected table
      else {
        const liveCols = Object.keys(t.live.columns);
        const defCols = Object.keys(t.defined.columns);
        const isMismatch = liveCols.length !== defCols.length || defCols.some(c => !t.live?.columns[c as any]);
        if (isMismatch) mismatch++;
        else ok++;
      }
    }
    return { total: data.length, missing, mismatch, ok };
  }, [data]);

  const toggleTable = (name: string) => {
    const next = new Set(expandedTables);
    if (next.has(name)) next.delete(name);
    else next.add(name);
    setExpandedTables(next);
  };

  const handleSnapshot = async (tableName?: string) => {
    const msg = tableName 
      ? `Are you sure you want to update the definition for '${tableName}' from the live database structure?`
      : "Are you sure you want to update the ENTIRE system definition files from the current live database structure? This will modify server-side code.";
    
    if (!confirm(msg)) return;
    
    setSyncing(tableName || "snapshot");
    try {
      await createSchemaSnapshot(tableName);
      toast({ title: "Success", description: tableName ? `Definition for ${tableName} updated.` : "System definition file updated successfully." });
      void load();
    } catch (err) {
      toast({ title: "Update Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSyncing(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full pb-10 px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2 text-primary">
              <ShieldCheck className="w-8 h-8" />
              Table Verification
            </h1>
            <p className="text-muted-foreground mt-1">
              Verify database integrity against system-defined schema.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => void load()} disabled={loading} className="gap-2">
              <RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => void handleOptimize()} disabled={loading || !!syncing} className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
              <Database className={cn("w-4 h-4", syncing === "optimize" && "animate-spin")} />
              Optimize Database
            </Button>
            <Button variant="outline" onClick={() => void handleSnapshot()} disabled={loading || !!syncing} className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
              <RefreshCcw className={cn("w-4 h-4", syncing === "snapshot" && "animate-spin")} />
              Snapshot All to Schema
            </Button>
            <Button variant="default" onClick={() => void handleSync()} disabled={loading || !!syncing} className="gap-2 bg-primary">
              <Settings2 className={cn("w-4 h-4", syncing === "all" && "animate-spin")} />
              Repair All Tables
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold">{stats.total}</span>
              <span className="text-xs text-muted-foreground uppercase font-semibold">Total Tables</span>
            </CardContent>
          </Card>
          <Card className="bg-green-500/5 border-none shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold text-green-600">{stats.ok}</span>
              <span className="text-xs text-green-600/70 uppercase font-semibold">Healthy</span>
            </CardContent>
          </Card>
          <Card className={cn("border-none shadow-sm", stats.mismatch > 0 ? "bg-amber-500/5" : "bg-card/50")}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className={cn("text-2xl font-bold", stats.mismatch > 0 && "text-amber-600")}>{stats.mismatch}</span>
              <span className={cn("text-xs uppercase font-semibold", stats.mismatch > 0 ? "text-amber-600/70" : "text-muted-foreground")}>Mismatched</span>
            </CardContent>
          </Card>
          <Card className={cn("border-none shadow-sm", stats.missing > 0 ? "bg-red-500/5" : "bg-card/50")}>
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <span className={cn("text-2xl font-bold", stats.missing > 0 && "text-red-600")}>{stats.missing}</span>
              <span className={cn("text-xs uppercase font-semibold", stats.missing > 0 ? "text-red-600/70" : "text-muted-foreground")}>Missing</span>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Search tables or columns..." 
              className="pl-10 bg-background/50 border-none shadow-sm focus-visible:ring-1" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
             <Button 
                variant={filter === 'all' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('all')} 
                className="rounded-full px-4 h-9"
             >
                All ({stats.total})
             </Button>
             <Button 
                variant={filter === 'mismatch' ? 'default' : 'default'} 
                size="sm" 
                onClick={() => setFilter('mismatch')} 
                className={cn(
                  "rounded-full px-4 h-9 transition-all",
                  filter === 'mismatch' ? "bg-amber-600 hover:bg-amber-700" : "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                )}
             >
                Mismatched ({stats.mismatch})
             </Button>
             <Button 
                variant={filter === 'missing' ? 'default' : 'default'} 
                size="sm" 
                onClick={() => setFilter('missing')} 
                className={cn(
                  "rounded-full px-4 h-9 transition-all",
                  filter === 'missing' ? "bg-red-600 hover:bg-red-700" : "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                )}
             >
                Missing ({stats.missing})
             </Button>
             <Button 
                variant={filter === 'healthy' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setFilter('healthy')} 
                className="rounded-full px-4 h-9"
             >
                Healthy ({stats.ok})
             </Button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCcw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Auditing database schema...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 border-2 border-dashed rounded-xl">
              <p className="text-muted-foreground">No tables found matching your search.</p>
            </div>
          ) : (
            filteredData.map((table) => {
              const isCorrupted = table.live === "CORRUPTED";
              const isMissing = !table.live;
              const liveCols = (table.live && !isCorrupted) ? Object.keys(table.live.columns) : [];
              const defCols = table.defined ? Object.keys(table.defined.columns) : [];
              const missingCols = defCols.filter(c => !liveCols.includes(c));
              const isMismatch = missingCols.length > 0 && !isCorrupted && !isMissing;
              const isHealthy = !isMissing && !isMismatch && !isCorrupted;

              return (
                <Card key={table.name} className="overflow-hidden border-none shadow-sm">
                  <div className="flex items-center justify-between p-4 bg-card/30">
                    <div className="flex items-center gap-4">
                      <button onClick={() => toggleTable(table.name)} className="p-1 hover:bg-accent rounded">
                        {expandedTables.has(table.name) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TableIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{table.name}</h3>
                        <div className="flex gap-2 mt-0.5">
                          {isMissing ? (
                            <Badge variant="destructive" className="text-[10px] uppercase">Missing Table</Badge>
                          ) : isCorrupted ? (
                            <Badge variant="destructive" className="text-[10px] uppercase animate-pulse">Corrupted / Engine Error</Badge>
                          ) : isMismatch ? (
                            <Badge variant="outline" className="text-[10px] uppercase text-amber-600 border-amber-600/20 bg-amber-600/5">Structure Mismatch</Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] uppercase text-green-600 border-green-600/20 bg-green-600/5">Verified Healthy</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCorrupted && (
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          className="gap-2"
                          onClick={() => void handleDrop(table.name)}
                          disabled={!!syncing}
                        >
                          {syncing === table.name ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />}
                          Force Drop
                        </Button>
                      )}
                      {!isHealthy && !isCorrupted && (
                        <Button 
                          size="sm" 
                          variant="secondary" 
                          className="bg-primary/10 text-primary hover:bg-primary/20"
                          onClick={() => void handleSync(table.name)}
                          disabled={!!syncing}
                        >
                          {syncing === table.name ? <RefreshCcw className="w-3 h-3 animate-spin mr-2" /> : <ShieldCheck className="w-3 h-3 mr-2" />}
                          {isMissing ? "Create Table" : "Update Structure"}
                        </Button>
                      )}
                      {!isHealthy && table.live && (
                         <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-primary/20 text-primary hover:bg-primary/5"
                          onClick={() => void handleSnapshot(table.name)}
                          disabled={!!syncing}
                        >
                          {syncing === table.name ? <RefreshCcw className="w-3 h-3 animate-spin mr-2" /> : <Database className="w-3 h-3 mr-2" />}
                          Update Definition
                        </Button>
                      )}
                    </div>
                  </div>

                  {expandedTables.has(table.name) && (
                    <CardContent className="p-4 border-t bg-background/20">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <Database className="w-3 h-3" />
                            Live Structure
                          </h4>
                          {isMissing ? (
                            <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 flex items-center gap-3 text-red-600">
                              <ShieldAlert className="w-5 h-5" />
                              <span className="text-sm font-medium">Table does not exist in the database.</span>
                            </div>
                          ) : isCorrupted ? (
                            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
                               <div className="flex items-center gap-3 text-red-600">
                                <ShieldAlert className="w-5 h-5" />
                                <span className="text-sm font-bold uppercase tracking-tight">Database Engine Error</span>
                              </div>
                              <p className="text-[11px] text-red-500/80 font-mono bg-white/50 p-2 rounded border border-red-200">
                                {table.error || "Table exists in metadata but could not be read by the engine (MariaDB Error 1932). This usually indicates a corrupted .ibd file or an orphaned table."}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {liveCols.map(c => (
                                <div key={c} className="flex items-center justify-between p-2 rounded bg-background/50 text-xs">
                                  <span className="font-mono">{c}</span>
                                  <span className="text-muted-foreground">{(table.live as any).columns[c].Type}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                            <Settings2 className="w-3 h-3" />
                            Defined Schema
                          </h4>
                          <div className="space-y-1.5">
                            {defCols.map(c => {
                              const missing = isMissing || !liveCols.includes(c);
                              return (
                                <div key={c} className={cn(
                                  "flex items-center justify-between p-2 rounded text-xs",
                                  missing ? "bg-amber-500/10 border border-amber-500/20 text-amber-700" : "bg-background/50"
                                )}>
                                  <span className="font-mono flex items-center gap-2">
                                    {c}
                                    {missing && <AlertTriangle className="w-3 h-3" />}
                                  </span>
                                  <span className="opacity-70">{table.defined?.columns[c].Type}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
