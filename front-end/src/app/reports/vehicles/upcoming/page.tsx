"use client";

import React, { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { api, syncMorningMileage, updateVehicleSchedule } from "@/lib/api";
import { format } from "date-fns";
import { AlertCircle, AlertTriangle, Loader2, Calendar, Hash, Car, Wrench, RefreshCw, Search, Download, CalendarPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

export default function UpcomingServicesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncTotal, setSyncTotal] = useState(0);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [scheduleDialogVehicle, setScheduleDialogVehicle] = useState<any>(null);
  const [scheduleMileage, setScheduleMileage] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const cancelSyncRef = useRef(false);
  const { toast } = useToast();
  const router = useRouter();

  const getVehicleStatus = (vehicle: any) => {
    const nsDate = vehicle.next_service_date ? new Date(vehicle.next_service_date) : null;
    const mileageToUse = vehicle.morning_mileage || vehicle.current_mileage || 0;
    const isOverdue = 
      (nsDate && nsDate <= new Date()) || 
      (vehicle.next_service_mileage > 0 && mileageToUse >= vehicle.next_service_mileage);
    if (isOverdue) return "OVERDUE";

    const isDueSoon = 
      (nsDate && (nsDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) <= 14) || 
      (vehicle.next_service_mileage > 0 && vehicle.next_service_mileage - mileageToUse <= 500);
    if (isDueSoon) return "DUE_SOON";

    return "UP_TO_DATE";
  };

  const fetchUpcoming = async () => {
    setLoading(true);
    try {
      const res = await api('/api/vehicle/all');
      const data = await res.json();
      if (data.status === 'success') {
        const sorted = (data.data || []).sort((a: any, b: any) => {
          const wA = getVehicleStatus(a) === "OVERDUE" ? 1 : getVehicleStatus(a) === "DUE_SOON" ? 2 : 3;
          const wB = getVehicleStatus(b) === "OVERDUE" ? 1 : getVehicleStatus(b) === "DUE_SOON" ? 2 : 3;
          return wA - wB;
        });
        setVehicles(sorted);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load upcoming services", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const handleSyncMileage = async () => {
    if (vehicles.length === 0) return;
    
    setSyncing(true);
    setSyncProgress(0);
    cancelSyncRef.current = false;
    
    const vehicleIds = vehicles.map(v => v.id);
    setSyncTotal(vehicleIds.length);

    try {
      const chunkSize = 50;
      let totalUpdated = 0;
      
      for (let i = 0; i < vehicleIds.length; i += chunkSize) {
        if (cancelSyncRef.current) {
          toast({ title: "Sync Cancelled", description: `Stopped after syncing ${totalUpdated} vehicles.` });
          break;
        }
        
        const chunk = vehicleIds.slice(i, i + chunkSize);
        const res = await syncMorningMileage(chunk);
        totalUpdated += (res.data?.updated || 0);
        setSyncProgress(Math.min(i + chunkSize, vehicleIds.length));
      }

      if (!cancelSyncRef.current) {
        toast({ title: "Sync Complete", description: `Morning mileage synced for ${totalUpdated} vehicles.` });
      }
      fetchUpcoming(); // refresh the list
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err.message || "Failed to sync.", variant: "destructive" });
    } finally {
      setSyncing(false);
      setTimeout(() => { setSyncProgress(0); setSyncTotal(0); }, 2000);
    }
  };

  const handleSyncSingleVehicle = async (vehicle: any) => {
    setSyncingId(vehicle.id);
    try {
      await syncMorningMileage([vehicle.id]);
      toast({ title: "Sync Complete", description: `Mileage updated for ${vehicle.plate_number || vehicle.vin || 'vehicle'}.` });
      fetchUpcoming(); // refresh the list
    } catch (err: any) {
      toast({ title: "Sync Failed", description: err.message || "Failed to sync.", variant: "destructive" });
    } finally {
      setSyncingId(null);
    }
  };

  const handleCreateBooking = (vehicle: any) => {
    const currentMileage = vehicle.morning_mileage || vehicle.current_mileage || 0;
    router.push(`/orders/new?vehicle_id=${vehicle.id}&job_type=Service+Booking&mileage=${currentMileage}`);
  };

  const openScheduleDialog = (vehicle: any) => {
    setScheduleDialogVehicle(vehicle);
    setScheduleMileage(vehicle.next_service_mileage || "");
    setScheduleDate(vehicle.next_service_date ? vehicle.next_service_date.split(" ")[0] : "");
  };

  const handleSaveSchedule = async () => {
    if (!scheduleDialogVehicle) return;
    setSavingSchedule(true);
    try {
      await updateVehicleSchedule(scheduleDialogVehicle.id, {
        next_service_mileage: scheduleMileage,
        next_service_date: scheduleDate
      });
      toast({ title: "Success", description: "Service schedule updated successfully." });
      setScheduleDialogVehicle(null);
      fetchUpcoming(); // refresh data
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update schedule.", variant: "destructive" });
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleExportCSV = () => {
    if (filteredVehicles.length === 0) {
      toast({ title: "Nothing to export", description: "No vehicles match the current filters.", variant: "destructive" });
      return;
    }

    const headers = ["Vehicle Number", "Make", "Model", "VIN", "Status", "Current Mileage", "Next Service Mileage", "Next Service Date", "Owner"];
    const rows = filteredVehicles.map(v => {
      const status = getVehicleStatus(v);
      const currentMileage = v.morning_mileage || v.current_mileage || 0;
      const nextDate = v.next_service_date ? format(new Date(v.next_service_date), "yyyy-MM-dd") : "N/A";
      const owner = v.customer_name || v.department_name || "Internal";
      
      return [
        v.plate_number || v.vin || "N/A",
        v.make || "N/A",
        v.model || "N/A",
        v.vin || "N/A",
        status,
        currentMileage,
        v.next_service_mileage || "N/A",
        nextDate,
        owner
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Fleet_Service_Schedule_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const uniqueDepartments = Array.from(new Set(vehicles.map(v => v.customer_name || v.department_name || "Internal"))).sort();

  const filteredVehicles = vehicles.filter(v => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (v.plate_number?.toLowerCase() || "").includes(query) ||
      (v.vin?.toLowerCase() || "").includes(query) ||
      (v.make?.toLowerCase() || "").includes(query) ||
      (v.model?.toLowerCase() || "").includes(query);
      
    if (!matchesSearch) return false;
    
    if (statusFilter !== "ALL") {
      const status = getVehicleStatus(v);
      if (statusFilter === "OVERDUE" && status !== "OVERDUE") return false;
      if (statusFilter === "DUE_SOON" && status !== "DUE_SOON") return false;
      if (statusFilter === "UP_TO_DATE" && status !== "UP_TO_DATE") return false;
    }

    if (deptFilter !== "ALL") {
      const owner = v.customer_name || v.department_name || "Internal";
      if (owner !== deptFilter) return false;
    }
    
    return true;
  });

  const getStatusBadge = (vehicle: any) => {
    const status = getVehicleStatus(vehicle);
    if (status === "OVERDUE") return <Badge variant="destructive" className="gap-1 uppercase text-[10px] py-0.5"><AlertTriangle className="w-3 h-3" /> Overdue</Badge>;
    if (status === "DUE_SOON") return <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 gap-1 uppercase text-[10px] py-0.5"><AlertCircle className="w-3 h-3" /> Due Soon</Badge>;
    return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 uppercase text-[10px] py-0.5">Up to Date</Badge>;
  };

  return (
    <DashboardLayout fullWidth={true}>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">Fleet Service Schedule</h1>
          <p className="text-muted-foreground mt-1">Monitor the live mileage and upcoming service targets for every vehicle in your fleet.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {syncing && (
            <Button variant="ghost" size="sm" onClick={() => (cancelSyncRef.current = true)} className="text-muted-foreground hover:text-destructive">
              Cancel
            </Button>
          )}
          <Button 
            variant="outline" 
            className="gap-2 bg-white shadow-sm w-full sm:w-auto relative overflow-hidden" 
            onClick={handleSyncMileage} 
            disabled={syncing || loading}
          >
            {syncing && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-primary/10 transition-all duration-300" 
                style={{ width: `${syncTotal > 0 ? (syncProgress / syncTotal) * 100 : 0}%` }} 
              />
            )}
            <span className="relative flex items-center gap-2">
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              {syncing ? `Syncing... ${syncProgress} / ${syncTotal}` : "Sync Live Mileage"}
            </span>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search by Vehicle No, VIN, Make..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40 h-10">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="OVERDUE">Overdue</SelectItem>
              <SelectItem value="DUE_SOON">Due Soon</SelectItem>
              <SelectItem value="UP_TO_DATE">Up to Date</SelectItem>
            </SelectContent>
          </Select>
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-full sm:w-48 h-10">
              <SelectValue placeholder="Filter by Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Departments</SelectItem>
              {uniqueDepartments.map(dept => (
                <SelectItem key={dept} value={dept as string}>{dept as string}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-full sm:w-auto shrink-0 justify-end">
          <Button variant="outline" className="gap-2 h-10" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card className="border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none rounded-2xl bg-white dark:bg-slate-950 overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32">
              <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20 mb-4" />
              <p className="text-muted-foreground font-medium animate-pulse">Analyzing fleet data...</p>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center px-6">
              <div className="p-5 bg-slate-100 dark:bg-slate-900 rounded-3xl mb-6 ring-8 ring-slate-50 dark:ring-slate-900/50">
                <Car className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">No vehicles found!</h3>
              <p className="text-slate-500 max-w-sm mt-2">There are currently no vehicles registered in the system.</p>
              
              <div className="mt-10 p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-left max-w-lg w-full shadow-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                  <Wrench className="w-3 h-3" /> How Automatic Scheduling Works
                </h4>
                <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed"><strong className="text-slate-900 dark:text-slate-100 font-bold">Due Soon:</strong> A vehicle appears here automatically when it gets within <strong>500 km</strong> of its next scheduled mileage, or within <strong>14 days</strong> of its next service date.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed"><strong className="text-slate-900 dark:text-slate-100 font-bold">Overdue:</strong> A vehicle is flagged as overdue immediately when it surpasses its scheduled mileage or date.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="py-5 font-bold text-slate-700 dark:text-slate-300">Vehicle Profile</TableHead>
                    <TableHead className="py-5 font-bold text-slate-700 dark:text-slate-300">Status</TableHead>
                    <TableHead className="py-5 font-bold text-slate-700 dark:text-slate-300">Service Schedule</TableHead>
                    <TableHead className="py-5 font-bold text-slate-700 dark:text-slate-300">Owner / Dept</TableHead>
                    <TableHead className="py-5 font-bold text-slate-700 dark:text-slate-300 text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-slate-500">
                        No vehicles found matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map((v) => (
                      <TableRow key={v.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all border-b border-slate-100 dark:border-slate-900">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10">
                              <Car className="w-6 h-6 text-primary opacity-60" />
                            </div>
                            <div>
                              <p className="font-black tracking-tight text-base text-slate-900 dark:text-slate-100">{v.plate_number || v.vin || "No Vehicle ID"}</p>
                              <p className="text-[11px] font-mono text-slate-500 mt-0.5">{v.make} {v.model}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(v)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Hash className="w-3.5 h-3.5" />
                              <span className="font-mono tracking-tighter">
                                {(v.morning_mileage || v.current_mileage || 0).toLocaleString()} / {v.next_service_mileage?.toLocaleString() || "N/A"} mi
                              </span>
                              {v.mileage_sync_status === 'failed' && (
                                <AlertTriangle 
                                  className="w-3.5 h-3.5 text-red-500 ml-1" 
                                  title="Mileage sync failed. Value might be outdated." 
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>
                                {v.next_service_date ? format(new Date(v.next_service_date), "MMM d, yyyy") : "No Date Set"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {v.customer_name ? (
                             <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                               {v.customer_name}
                             </Badge>
                          ) : (
                             <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                               {v.department_name || "Internal"}
                             </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end gap-2 items-center">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 w-8 p-0"
                              title="Set Schedule"
                              onClick={() => openScheduleDialog(v)}
                            >
                              <CalendarPlus className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 w-8 p-0"
                              title="Sync live mileage for this vehicle"
                              onClick={() => handleSyncSingleVehicle(v)}
                              disabled={syncingId === v.id || syncing}
                            >
                              {syncingId === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 text-slate-500" />}
                            </Button>
                            <Button 
                              size="sm" 
                              className="gap-2 bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95 h-8"
                              onClick={() => handleCreateBooking(v)}
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              Book Service
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!scheduleDialogVehicle} onOpenChange={(open) => !open && setScheduleDialogVehicle(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              Set Service Schedule
              {scheduleDialogVehicle && getStatusBadge({
                ...scheduleDialogVehicle,
                next_service_mileage: scheduleMileage ? Number(scheduleMileage) : null,
                next_service_date: scheduleDate || null
              })}
            </DialogTitle>
            <DialogDescription>
              Update the next scheduled service target for {scheduleDialogVehicle?.plate_number || scheduleDialogVehicle?.vin}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="mileage">Next Service Mileage</Label>
              <Input
                id="mileage"
                type="number"
                placeholder="e.g. 50000"
                value={scheduleMileage}
                onChange={(e) => setScheduleMileage(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Next Service Date</Label>
              <Input
                id="date"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogVehicle(null)}>Cancel</Button>
            <Button onClick={handleSaveSchedule} disabled={savingSchedule}>
              {savingSchedule && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
