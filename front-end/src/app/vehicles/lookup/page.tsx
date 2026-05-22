"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Car, 
  FileText, 
  ClipboardList, 
  Boxes, 
  CheckCircle2, 
  Calendar,
  AlertTriangle,
  FileCheck,
  Download,
  Loader2,
  ChevronLeft,
  Clock,
  ExternalLink,
  Info,
  Hash,
  Eye,
  Settings
} from 'lucide-react';
import { 
  fetchReportVehicles, 
  fetchVehicle, 
  fetchReportVehicleHistory, 
  fetchVehicleDocuments, 
  fetchOrderParts,
  contentUrl,
  type VehicleRow 
} from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format, isPast, differenceInDays } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Safe JSON parser for checklist items
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

function money(n: number) {
  return (Number.isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function VehicleLookupPage() {
  const { toast } = useToast();
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected Vehicle State
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [orderParts, setOrderParts] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  
  // Document Preview State
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Execute Search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }
    const doSearch = async () => {
      setIsSearching(true);
      setHasSearched(true);
      try {
        const data = await fetchReportVehicles({ q: debouncedQuery.trim() });
        setSearchResults(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setSearchResults([]);
        toast({ title: "Search Error", description: err?.message || "Failed to search vehicles.", variant: "destructive" });
      } finally {
        setIsSearching(false);
      }
    };
    void doSearch();
  }, [debouncedQuery, toast]);

  // Load selected vehicle details
  const loadVehicleDetails = useCallback(async (id: number) => {
    setIsLoadingDetails(true);
    try {
      // 1. Fetch concurrent base data
      const [vData, hData, dData] = await Promise.all([
        fetchVehicle(id).catch(() => null),
        fetchReportVehicleHistory({ vehicle_id: id }).catch(() => []),
        fetchVehicleDocuments(id).catch(() => [])
      ]);
      
      setVehicle(vData || null);
      setHistory(Array.isArray(hData) ? hData : []);
      setDocuments(Array.isArray(dData) ? dData : []);
      
      // 2. Fetch parts for all orders in history concurrently
      if (Array.isArray(hData) && hData.length > 0) {
        const partsPromises = hData.map(order => 
          fetchOrderParts(String(order.id)).catch(() => [])
        );
        const partsResults = await Promise.all(partsPromises);
        
        // Flatten and inject order info into each part line
        const allParts: any[] = [];
        partsResults.forEach((lines, index) => {
          if (Array.isArray(lines)) {
            const orderRef = hData[index];
            lines.forEach(line => {
              allParts.push({
                ...line,
                order_id: orderRef.id,
                order_date: orderRef.created_at,
                order_status: orderRef.status
              });
            });
          }
        });
        // Sort parts by newest order first
        allParts.sort((a, b) => new Date(String(b.order_date)).getTime() - new Date(String(a.order_date)).getTime());
        setOrderParts(allParts);
      } else {
        setOrderParts([]);
      }
      
    } catch (error) {
      toast({ title: "Error", description: "Failed to load complete vehicle profile.", variant: "destructive" });
    } finally {
      setIsLoadingDetails(false);
    }
  }, [toast]);

  // Trigger details fetch when selected
  useEffect(() => {
    if (selectedVehicleId) {
      void loadVehicleDetails(selectedVehicleId);
    }
  }, [selectedVehicleId, loadVehicleDetails]);

  // Computed data
  const completedRepairs = useMemo(() => {
    const list: any[] = [];
    history.forEach(order => {
      if (order.checklist_done_json) {
        const items = safeChecklistDone(order.checklist_done_json);
        items.forEach(item => {
          if (item.checked) {
            list.push({
              task: item.item,
              comment: item.comment,
              order_id: order.id,
              date: order.completed_at || order.created_at
            });
          }
        });
      }
    });
    // Sort newest first
    list.sort((a, b) => new Date(String(b.date)).getTime() - new Date(String(a.date)).getTime());
    return list;
  }, [history]);

  const handleClearSelection = () => {
    setSelectedVehicleId(null);
    setVehicle(null);
    setHistory([]);
    setOrderParts([]);
    setDocuments([]);
    // Optionally clear search to reset completely, but maybe better to keep the search results open
  };

  const getDocStatusBadge = (expiry: string | null, status: string = 'Active') => {
    if (status === 'Archived') return <Badge variant="secondary" className="bg-slate-200 text-slate-500">Archived</Badge>;
    if (!expiry) return <Badge variant="outline" className="bg-slate-100 text-slate-600">Permanent</Badge>;
    const date = new Date(expiry);
    const daysLeft = differenceInDays(date, new Date());
    if (isPast(date)) return <Badge className="bg-red-500">Expired</Badge>;
    if (daysLeft <= 30) return <Badge className="bg-amber-500">Expiring Soon</Badge>;
    return <Badge className="bg-emerald-500">Active</Badge>;
  };

  // -------------------------------------------------------------
  // RENDER SEARCH VIEW
  // -------------------------------------------------------------
  if (!selectedVehicleId) {
    return (
      <DashboardLayout fullWidth={true}>
        <div className="max-w-6xl mx-auto py-8">
          <div className="text-center mb-10 space-y-3">
            <div className="inline-flex p-4 bg-primary/5 rounded-3xl mb-2 ring-8 ring-primary/5">
              <Search className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-slate-50">Global Vehicle Lookup</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Search by make, model, VIN, or customer to instantly pull up complete histories, used parts, and service records.
            </p>
          </div>

          <div className="relative max-w-3xl mx-auto mb-12 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
            <Input 
              placeholder="Enter Make, Model, or VIN..." 
              className="pl-14 h-16 text-lg bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {isSearching && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-primary animate-spin" />
            )}
          </div>

          {hasSearched && (
            <div className="space-y-4">
              <h2 className="font-bold text-slate-700 dark:text-slate-300 px-2 flex items-center justify-between">
                <span>Search Results</span>
                <Badge variant="secondary">{searchResults.length} found</Badge>
              </h2>
              {searchResults.length === 0 ? (
                <div className="text-center py-20 bg-white/50 dark:bg-slate-950/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Car className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-lg font-bold text-slate-500">No vehicles match your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((res: any) => (
                    <Card 
                      key={res.id} 
                      className="cursor-pointer hover:shadow-lg hover:border-primary/30 transition-all active:scale-95 group overflow-hidden"
                      onClick={() => setSelectedVehicleId(res.id)}
                    >
                      <CardContent className="p-0">
                        <div className="p-5 flex items-start gap-4 border-b border-slate-100 dark:border-slate-900 bg-slate-50/50 dark:bg-slate-900/50">
                          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 group-hover:scale-110 transition-transform">
                            <Car className="w-6 h-6 text-primary opacity-70" />
                          </div>
                          <div>
                            <h3 className="font-black text-lg text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">
                              {res.make} {res.model}
                            </h3>
                            <p className="text-sm font-medium text-slate-500">{res.year || "Year N/A"}</p>
                          </div>
                        </div>
                        <div className="p-4 bg-white dark:bg-slate-950 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">VIN:</span>
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{res.vin || "---"}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Owner:</span>
                            <span className="font-medium text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                              {res.department_name || res.customer_name || "Internal"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // -------------------------------------------------------------
  // RENDER SELECTED VEHICLE DASHBOARD
  // -------------------------------------------------------------
  
  if (isLoadingDetails || !vehicle) {
    return (
      <DashboardLayout fullWidth={true}>
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-6" />
          <h2 className="text-xl font-black text-slate-700 dark:text-slate-300">Compiling Vehicle Profile...</h2>
          <p className="text-slate-500 mt-2">Loading master details, documents, and service histories.</p>
        </div>
      </DashboardLayout>
    );
  }

  const isOverdue = 
    (vehicle.next_service_date && new Date(vehicle.next_service_date) <= new Date()) || 
    (vehicle.next_service_mileage > 0 && vehicle.current_mileage >= vehicle.next_service_mileage);

  return (
    <DashboardLayout fullWidth={true}>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={handleClearSelection}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">
              {vehicle.make} {vehicle.model}
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-mono text-sm text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-md">VIN: {vehicle.vin}</span>
              <span className="text-sm font-medium text-slate-500">{vehicle.year || "N/A"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isOverdue && (
            <Badge variant="destructive" className="px-3 py-1.5 text-xs font-bold gap-1.5 uppercase shadow-md animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" /> Service Overdue
            </Badge>
          )}
          <Badge variant="outline" className="px-3 py-1.5 text-xs font-bold bg-white dark:bg-slate-950 border-slate-200 shadow-sm">
            Total Orders: {history.length}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="master" className="space-y-6">
        <ScrollArea className="w-full pb-2">
          <TabsList className="h-14 p-1.5 bg-slate-100/80 dark:bg-slate-900/50 rounded-2xl">
            <TabsTrigger value="master" className="rounded-xl px-6 font-bold gap-2 text-sm">
              <Info className="w-4 h-4" /> Master Details
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-6 font-bold gap-2 text-sm">
              <ClipboardList className="w-4 h-4" /> Service Records
            </TabsTrigger>
            <TabsTrigger value="repairs" className="rounded-xl px-6 font-bold gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4" /> Repairs & Tasks
            </TabsTrigger>
            <TabsTrigger value="parts" className="rounded-xl px-6 font-bold gap-2 text-sm">
              <Boxes className="w-4 h-4" /> Used Parts
            </TabsTrigger>
            <TabsTrigger value="docs" className="rounded-xl px-6 font-bold gap-2 text-sm">
              <FileCheck className="w-4 h-4" /> Documents
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        <TabsContent value="master" className="mt-0 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                    <Hash className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Current Mileage</p>
                    <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{vehicle.current_mileage?.toLocaleString() || 0} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Category / Type</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100">{vehicle.category || "Uncategorized"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{vehicle.work_type || "No work type"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                    <Car className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Owner / Driver</p>
                    <p className="text-lg font-black text-slate-800 dark:text-slate-100 truncate max-w-[150px]">
                      {vehicle.driver_name || vehicle.department_name || vehicle.customer_name || "Internal"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-400">Next Service</p>
                    {vehicle.next_service_date ? (
                      <p className="text-lg font-black text-slate-800 dark:text-slate-100">{format(new Date(vehicle.next_service_date), 'MMM d, yyyy')}</p>
                    ) : (
                      <p className="text-lg font-black text-slate-800 dark:text-slate-100">{vehicle.next_service_mileage?.toLocaleString() || "Not set"} km</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-none shadow-md bg-white dark:bg-slate-950">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Full Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-900">
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500 font-medium">System ID</span>
                    <span className="col-span-2 font-bold">#{vehicle.id}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500 font-medium">Fuel Capacity</span>
                    <span className="col-span-2 font-bold">{vehicle.fuel_capacity ? `${vehicle.fuel_capacity} Litres` : 'Not specified'}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500 font-medium">Data Source</span>
                    <span className="col-span-2 font-bold uppercase text-primary">
                      {vehicle.source === 'api' ? 'External Integration' : 'Manual Entry'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500 font-medium">Created On</span>
                    <span className="col-span-2 font-bold">
                      {vehicle.created_at ? format(new Date(String(vehicle.created_at).replace(" ", "T")), 'PPP') : '-'}
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500 font-medium">Ext. Location</span>
                    <span className="col-span-2 font-bold">{vehicle.external_location || '-'}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500 font-medium">Ext. Make/Model</span>
                    <span className="col-span-2 font-bold">
                      {vehicle.external_make ? `${vehicle.external_make} ${vehicle.external_model}` : '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500 font-medium">Service Interval</span>
                    <span className="col-span-2 font-bold">{vehicle.service_interval_mileage ? `${vehicle.service_interval_mileage} km` : 'Default'}</span>
                  </div>
                  <div className="grid grid-cols-3 text-sm">
                    <span className="text-slate-500 font-medium">Last Sync</span>
                    <span className="col-span-2 font-bold">
                      {vehicle.last_sync_at ? format(new Date(String(vehicle.last_sync_at).replace(" ", "T")), 'PPP p') : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-0 outline-none">
          <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" /> Service Records
                  </CardTitle>
                  <CardDescription>Chronological history of repair and maintenance orders.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {history.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Clock className="w-10 h-10 mx-auto text-slate-300 mb-4" />
                  <p>No service history found for this vehicle.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-4 px-6 font-bold">Order ID</TableHead>
                        <TableHead className="py-4 px-6 font-bold">Status & Location</TableHead>
                        <TableHead className="py-4 px-6 font-bold">Dates</TableHead>
                        <TableHead className="py-4 px-6 font-bold text-right">Parts Total</TableHead>
                        <TableHead className="py-4 px-6 font-bold text-right">View</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.map((r) => (
                        <TableRow key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <TableCell className="px-6 py-4">
                            <span className="font-bold text-slate-900 dark:text-slate-100">#{r.id}</span>
                            {r.job_type && <Badge variant="secondary" className="ml-2 text-[10px] uppercase font-bold">{r.job_type}</Badge>}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="font-semibold text-slate-700 dark:text-slate-300">{r.status || "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{r.location_name || "Primary Location"}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <div className="text-sm font-medium">Created: {r.created_at ? format(new Date(String(r.created_at).replace(" ", "T")), 'MMM d, yyyy') : "-"}</div>
                            <div className="text-xs text-muted-foreground">Done: {r.completed_at ? format(new Date(String(r.completed_at).replace(" ", "T")), 'MMM d, yyyy') : "Pending"}</div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">
                              Rs. {money(Number(r.parts_value ?? 0))}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <Button asChild variant="outline" size="sm" className="h-8 shadow-sm">
                              <a href={`/orders/${r.id}`} target="_blank" rel="noopener noreferrer">
                                Open <ExternalLink className="w-3 h-3 ml-1.5" />
                              </a>
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
        </TabsContent>

        <TabsContent value="repairs" className="mt-0 outline-none">
          <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" /> Completed Tasks
              </CardTitle>
              <CardDescription>Aggregated list of checklist items marked complete across all orders.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {completedRepairs.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <CheckCircle2 className="w-10 h-10 mx-auto text-slate-300 mb-4" />
                  <p>No completed checklist tasks found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-4 px-6 font-bold">Task Description</TableHead>
                        <TableHead className="py-4 px-6 font-bold">Technician Notes</TableHead>
                        <TableHead className="py-4 px-6 font-bold">Date Completed</TableHead>
                        <TableHead className="py-4 px-6 font-bold text-right">Order Ref</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedRepairs.map((task, i) => (
                        <TableRow key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <TableCell className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                            {task.task}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-slate-600 dark:text-slate-400 italic text-sm">
                            {task.comment || "No comments"}
                          </TableCell>
                          <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {task.date ? format(new Date(String(task.date).replace(" ", "T")), 'PPP') : "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <a href={`/orders/${task.order_id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold text-sm">
                              #{task.order_id}
                            </a>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="mt-0 outline-none">
          <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="text-lg flex items-center gap-2">
                <Boxes className="w-5 h-5 text-primary" /> Lifetime Used Parts
              </CardTitle>
              <CardDescription>Comprehensive list of materials and parts consumed by this vehicle.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {orderParts.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Boxes className="w-10 h-10 mx-auto text-slate-300 mb-4" />
                  <p>No parts have been issued to this vehicle.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-slate-50/30 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-900">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="py-4 px-6 font-bold">Item Description</TableHead>
                        <TableHead className="py-4 px-6 font-bold text-center">Qty</TableHead>
                        <TableHead className="py-4 px-6 font-bold text-right">Unit Price</TableHead>
                        <TableHead className="py-4 px-6 font-bold text-right">Line Total</TableHead>
                        <TableHead className="py-4 px-6 font-bold text-right">Order Ref</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orderParts.map((part) => (
                        <TableRow key={part.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                          <TableCell className="px-6 py-4">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{part.part_name || `Part #${part.part_id}`}</div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                              {part.sku ? `SKU: ${part.sku}` : `LINE ID: #${part.id}`}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-center font-bold text-slate-800 dark:text-slate-200">
                            {Number(part.quantity ?? 0).toLocaleString()} <span className="text-xs text-muted-foreground font-normal">{part.unit}</span>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right text-slate-600 dark:text-slate-400">
                            {part.unit_price !== null ? Number(part.unit_price).toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right font-bold text-slate-900 dark:text-slate-100">
                            Rs. {part.line_total !== null ? Number(part.line_total).toFixed(2) : "-"}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                              <a href={`/orders/${part.order_id}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold text-sm">
                                #{part.order_id}
                              </a>
                              <span className="text-[10px] text-slate-400">
                                {part.order_date ? format(new Date(String(part.order_date).replace(" ", "T")), 'MMM d, yyyy') : ""}
                              </span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="mt-0 outline-none">
          <Card className="border-none shadow-md overflow-hidden bg-white dark:bg-slate-950">
            <CardHeader className="border-b bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-primary" /> Compliance Documents
                  </CardTitle>
                  <CardDescription>View-only gallery of active and archived vehicle documents.</CardDescription>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-slate-900 border-slate-200">
                  {documents.length} Records
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {documents.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-4" />
                  <p>No compliance documents tracked for this vehicle.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50/30 dark:bg-slate-900/30 text-[11px] uppercase font-black text-slate-400 border-b">
                      <tr>
                        <th className="px-6 py-4">Document Type</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Expiry Date</th>
                        <th className="px-6 py-4">Number</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary/5 rounded-lg">
                                <FileText className="w-4 h-4 text-primary" />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-slate-100">{doc.document_type}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getDocStatusBadge(doc.expiry_date, doc.status)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-sm font-medium">
                                {doc.expiry_date ? format(new Date(doc.expiry_date), 'PPP') : "Permanent"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono text-slate-500 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                              {doc.document_number || "---"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {doc.file_path && (
                                <>
                                  <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg shadow-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                                    onClick={() => setPreviewDoc(doc)}
                                    title="Preview Document"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <a 
                                    href={contentUrl('documents', doc.file_path)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center h-9 w-9 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg shadow-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 transition-all"
                                    title="Download Attachment"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Document Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
          <DialogHeader className="p-6 border-b bg-slate-50/50 dark:bg-slate-900/50 flex-row items-center justify-between space-y-0">
            <div>
              <DialogTitle className="text-xl font-black flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {previewDoc?.document_type} Preview
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                {previewDoc?.document_number || "No Reference Number"} • {previewDoc?.expiry_date ? `Expires: ${format(new Date(previewDoc.expiry_date), 'PPP')}` : "Permanent Document"}
              </p>
            </div>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 dark:bg-slate-900 overflow-auto flex items-center justify-center p-4 relative">
            {previewDoc?.file_path && (
              <>
                {['jpg', 'jpeg', 'png', 'webp', 'gif'].some(ext => previewDoc.file_path.toLowerCase().endsWith(ext)) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={contentUrl('documents', previewDoc.file_path)} 
                    alt="Preview" 
                    className="max-w-full max-h-full object-contain rounded-lg shadow-md bg-white"
                  />
                ) : previewDoc.file_path.toLowerCase().endsWith('pdf') ? (
                  <iframe 
                    src={contentUrl('documents', previewDoc.file_path)} 
                    className="w-full h-full rounded-lg border-none bg-white shadow-md"
                    title="PDF Preview"
                  />
                ) : (
                  <div className="text-center p-10 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="font-bold text-slate-900 dark:text-slate-100">Preview Not Available</h3>
                    <p className="text-sm text-slate-500 mt-2">This file type cannot be previewed directly. Please download it to view.</p>
                    <Button 
                      type="button"
                      className="mt-6 shadow-md rounded-xl" 
                      onClick={() => window.open(contentUrl('documents', previewDoc.file_path), '_blank')}
                    >
                      <Download className="w-4 h-4 mr-2" /> Download File
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
