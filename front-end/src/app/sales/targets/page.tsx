"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api, fetchLocations } from "@/lib/api";
import { Loader2, Target, MapPin, CalendarDays, Save, Trash2, Plus, PlusCircle, ArrowLeft } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const YEARS = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 2 + i);
const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default function SalesTargetsPage() {
  const { toast } = useToast();
  const [view, setView] = useState<'list' | 'form'>('list');
  const [targetList, setTargetList] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [locationId, setLocationId] = useState<number | null>(null);
  
  const d = new Date();
  const currMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  const [month, setMonth] = useState(currMonth);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [globalTarget, setGlobalTarget] = useState<string>("");
  const [collections, setCollections] = useState<{ id: number; name: string }[]>([]);
  const [collectionTargets, setCollectionTargets] = useState<Record<number, string>>({});

  useEffect(() => {
    fetchLocations().then((locs) => {
      const valid = locs.filter(l => l.id > 0);
      setLocations(valid);
      if (valid.length > 0) {
        setLocationId(valid[0].id);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (view === 'list') {
      const loadList = async () => {
        setListLoading(true);
        try {
          const res = await api('/api/salestarget/list');
          const data = await res.json();
          if (data.status === 'success') {
            setTargetList(data.data || []);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setListLoading(false);
        }
      };
      loadList();
    }
  }, [view]);

  useEffect(() => {
    if (!locationId || !month || view !== 'form') return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api(`/api/salestarget/get?location_id=${locationId}&month=${month}`);
        const data = await res.json();
        if (data.status === 'success') {
          setCollections(data.data.collections || []);
          setGlobalTarget(data.data.targets?.global ? String(data.data.targets.global) : "");
          const ct: Record<number, string> = {};
          if (data.data.targets?.collections) {
            for (const [k, v] of Object.entries(data.data.targets.collections)) {
              ct[Number(k)] = String(v);
            }
          }
          setCollectionTargets(ct);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [locationId, month, view]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        location_id: locationId,
        month,
        global: Number(globalTarget) || 0,
        collections: Object.fromEntries(
          Object.entries(collectionTargets).map(([k, v]) => [k, Number(v) || 0])
        )
      };
      
      const res = await api('/api/salestarget/save', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.status === 'success') {
        toast({ title: "Targets Saved", description: "Sales targets have been updated successfully." });
        setView('list'); // Return to list after save
      } else {
        throw new Error(data.message || "Failed to save");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
              <Target className="w-6 h-6 text-primary" />
              Sales Targets
            </h1>
            <p className="text-muted-foreground mt-1">Set monthly value-based sales targets per location and collection.</p>
          </div>
          {view === 'list' ? (
            <Button onClick={() => setView('form')} className="gap-2">
              <PlusCircle className="w-4 h-4" /> New Target
            </Button>
          ) : (
            <Button onClick={() => setView('list')} variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to List
            </Button>
          )}
        </div>

        {view === 'list' ? (
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Existing Targets</CardTitle>
              <CardDescription>Overview of targets set across locations</CardDescription>
            </CardHeader>
            <CardContent>
              {listLoading ? (
                <div className="flex justify-center py-10 text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading targets...
                </div>
              ) : targetList.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                  No targets configured yet. Click "New Target" to set up your first target.
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Global Target</TableHead>
                        <TableHead className="text-right">Collection Targets</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {targetList.map((t, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{t.location_name}</TableCell>
                          <TableCell>{t.target_month}</TableCell>
                          <TableCell className="text-right">{Number(t.global_target).toLocaleString(undefined, {minimumFractionDigits: 2})}</TableCell>
                          <TableCell className="text-right">{t.collection_count} Set</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => {
                                setLocationId(Number(t.location_id));
                                setMonth(t.target_month);
                                setView('form');
                              }}
                            >
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-none shadow-md">
            <CardHeader>
              <CardTitle>Target Configuration</CardTitle>
              <CardDescription>Select a location and month to configure targets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 space-y-2">
                <Label className="flex items-center gap-2"><MapPin className="w-4 h-4"/> Location</Label>
                <Select
                  value={locationId ? String(locationId) : ""}
                  onValueChange={(v) => setLocationId(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-2">
                <Label className="flex items-center gap-2"><CalendarDays className="w-4 h-4"/> Month</Label>
                <div className="flex gap-2">
                  <Select
                    value={month.split('-')[0]}
                    onValueChange={(y) => setMonth(`${y}-${month.split('-')[1]}`)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={month.split('-')[1]}
                    onValueChange={(m) => setMonth(`${month.split('-')[0]}-${m}`)}
                  >
                    <SelectTrigger className="flex-[2]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-10 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading targets...
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in">
                <div className="space-y-3 bg-muted/20 p-4 rounded-lg border">
                  <div>
                    <Label className="text-base font-semibold">Global Location Target</Label>
                    <p className="text-xs text-muted-foreground mb-3">Overall sales target for the entire location for the selected month.</p>
                  </div>
                  <div className="max-w-xs">
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      value={globalTarget} 
                      onChange={e => setGlobalTarget(e.target.value)} 
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label className="text-base font-semibold">Collection-Wise Targets (Optional)</Label>
                    <p className="text-xs text-muted-foreground mb-3">Set specific sales targets for individual product collections.</p>
                  </div>
                  
                  {Object.keys(collectionTargets).length === 0 && collections.length > 0 ? (
                    <div className="text-sm text-muted-foreground italic mb-4">No collection targets set yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                      {Object.keys(collectionTargets).map(colIdStr => {
                        const colId = Number(colIdStr);
                        const col = collections.find(c => c.id === colId);
                        if (!col) return null;
                        return (
                          <div key={col.id} className="flex items-center justify-between gap-3 p-3 rounded-md border shadow-sm bg-card">
                            <span className="text-sm font-medium truncate flex-1" title={col.name}>{col.name}</span>
                            <Input 
                              type="number" 
                              className="w-28 h-9 text-right" 
                              placeholder="0.00"
                              value={collectionTargets[col.id] || ""}
                              onChange={e => setCollectionTargets({...collectionTargets, [col.id]: e.target.value})}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => {
                                const newTargets = { ...collectionTargets };
                                delete newTargets[col.id];
                                setCollectionTargets(newTargets);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {collections.filter(c => !(c.id in collectionTargets)).length > 0 && (
                    <div className="flex items-center gap-3">
                      <Select
                        value=""
                        onValueChange={(v) => {
                          if (v) {
                            setCollectionTargets({...collectionTargets, [Number(v)]: ""});
                          }
                        }}
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue placeholder="Add collection target..." />
                        </SelectTrigger>
                        <SelectContent>
                          {collections.filter(c => !(c.id in collectionTargets)).map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={save} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Targets
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
