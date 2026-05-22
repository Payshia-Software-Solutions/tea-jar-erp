"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Search, 
  Car, 
  Loader2, 
  AlertCircle,
  Pencil,
  Hash,
  Calendar,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';
import { fetchDepartments, fetchVehicles, api, contentUrl } from '@/lib/api';
import { Vehicle } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from 'next/link';

export default function VehiclesPage() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [vData, dData] = await Promise.all([
        fetchVehicles(currentPage, itemsPerPage, 'all', debouncedSearch),
        fetchDepartments()
      ]);
      
      setVehicles(vData.data || []);
      setTotalItems(vData.total || 0);
      setTotalPages(vData.pages || 0);
      setDepartments(dData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load vehicle data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDeleteVehicle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;

    try {
      const res = await api(`/api/vehicle/delete/${id}`, {
        method: 'POST',
        body: JSON.stringify({ _method: 'DELETE' })
      });
      const json = await res.json();
      if (json.status === 'success') {
        toast({ title: "Success", description: "Vehicle deleted successfully" });
        void loadData();
      } else {
        throw new Error(json.message || "Failed to delete vehicle");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  };

  const handleSyncVehicles = async () => {
    setIsSyncing(true);
    try {
      const res = await api('/api/vehicle-sync/sync', { method: 'POST' });
      const json = await res.json();
      if (json.status === 'success') {
        toast({
          title: "Fleet Synced",
          description: `Processed ${json.data.success} vehicles.`,
        });
        void loadData();
      } else {
        throw new Error(json.message || "Sync failed");
      }
    } catch (err) {
      toast({
        title: "Sync Error",
        description: (err as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const departmentName = (id: number | null) => {
    if (!id) return null;
    return departments.find((d) => d.id === id)?.name || null;
  };

  return (
    <DashboardLayout fullWidth={true}>
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-50">Vehicles Master Data</h1>
          <p className="text-muted-foreground">Manage your fleet inventory, departmental assignments, and external syncs.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-3 py-1 font-medium">
            {totalItems} Total Vehicles
          </Badge>
          <Link href="/master-data/vehicles/new">
            <Button className="gap-2 bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-95">
              <Plus className="w-4 h-4" />
              Add Vehicle
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="gap-2 border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900 transition-all active:scale-95" 
            onClick={() => void handleSyncVehicles()} 
            disabled={isSyncing}
          >
            {isSyncing ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <RefreshCw className="w-4 h-4" />}
            {isSyncing ? 'Syncing...' : 'Sync Vehicles'}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search by make, model, VIN, customer or department..." 
              className="pl-10 h-12 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-primary/20 transition-all rounded-xl shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Show per page:</span>
            <select 
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <Card className="border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden rounded-2xl bg-white dark:bg-slate-950">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin text-primary opacity-20" />
                  <Loader2 className="w-12 h-12 animate-spin text-primary absolute top-0 left-0 [animation-delay:0.2s]" />
                </div>
                <p className="mt-6 text-slate-500 font-medium animate-pulse">Refining fleet data...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center px-6">
                <div className="p-5 bg-slate-100 dark:bg-slate-900 rounded-3xl mb-6 ring-8 ring-slate-50 dark:ring-slate-900/50">
                  <AlertCircle className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50">No vehicles found</h3>
                <p className="text-slate-500 max-w-sm mt-2">
                  {searchQuery ? "We couldn't find any vehicles matching your search. Try broadening your criteria." : "Your fleet inventory is empty. Start by adding or syncing your first vehicle."}
                </p>
                {searchQuery && (
                  <Button variant="outline" className="mt-8 rounded-xl" onClick={() => setSearchQuery('')}>Clear All Filters</Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="py-5 font-bold text-slate-700 dark:text-slate-300">Vehicle Profile</TableHead>
                      <TableHead className="py-5 font-bold text-slate-700 dark:text-slate-300">Owner / Dept</TableHead>
                      <TableHead className="py-5 font-bold text-slate-700 dark:text-slate-300">Specs & Service</TableHead>
                      <TableHead className="py-5 font-bold text-slate-700 dark:text-slate-300">Sync Status</TableHead>
                      <TableHead className="py-5 font-bold text-slate-700 dark:text-slate-300 text-right pr-6">Management</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all border-b border-slate-100 dark:border-slate-900">
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              {vehicle.image_filename ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={contentUrl('vehicles', vehicle.image_filename)}
                                  alt="Vehicle"
                                  className="h-14 w-14 rounded-2xl object-cover border border-slate-200 dark:border-slate-800 shadow-sm"
                                />
                              ) : (
                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center border border-primary/10 group-hover:scale-105 transition-transform">
                                  <Car className="w-7 h-7 text-primary opacity-60" />
                                </div>
                              )}
                              {vehicle.make === 'Not Mapped' && (
                                <div className="absolute -top-1 -right-1">
                                  <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <p className={`font-black tracking-tight text-base ${vehicle.make === 'Not Mapped' ? 'text-red-600' : 'text-slate-900 dark:text-slate-100'}`}>
                                  {vehicle.make} {vehicle.model}
                                </p>
                              </div>
                              {vehicle.external_make && (
                                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded w-fit">
                                  API REF: {vehicle.external_make} {vehicle.external_model}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            {vehicle.customer_name ? (
                              <Badge variant="outline" className="w-fit bg-slate-50 border-slate-200 text-slate-700 font-medium rounded-md px-2">
                                {vehicle.customer_name}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="w-fit bg-amber-50 border-amber-100 text-amber-700 font-medium rounded-md px-2">
                                {departmentName(vehicle.department_id) ?? "Internal"}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <Hash className="w-3.5 h-3.5" />
                              <span className="text-sm font-mono tracking-tighter">{vehicle.vin || "---"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-500">
                              <Calendar className="w-3.5 h-3.5" />
                              <span className="text-xs">{vehicle.year || "N/A"}</span>
                            </div>
                            {(() => {
                              const nsDate = vehicle.next_service_date ? new Date(vehicle.next_service_date) : null;
                              const isOverdue = 
                                (nsDate && nsDate <= new Date()) || 
                                (vehicle.next_service_mileage > 0 && vehicle.current_mileage >= vehicle.next_service_mileage);
                              
                              const isDueSoon = !isOverdue && (
                                (nsDate && nsDate <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)) ||
                                (vehicle.next_service_mileage > 0 && vehicle.current_mileage >= vehicle.next_service_mileage - 500)
                              );

                              if (isOverdue) return (
                                <Badge variant="destructive" className="mt-1 text-[10px] uppercase font-bold py-0.5 gap-1 shadow-sm"><AlertTriangle className="w-3 h-3" /> Service Overdue</Badge>
                              );
                              if (isDueSoon) return (
                                <Badge variant="secondary" className="mt-1 text-[10px] uppercase font-bold py-0.5 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200 gap-1 shadow-sm"><AlertCircle className="w-3 h-3" /> Due Soon</Badge>
                              );
                              return null;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${vehicle.source === 'api' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-slate-400'}`} />
                              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                                {vehicle.source === 'api' ? 'External Sync' : 'Direct Entry'}
                              </span>
                            </div>
                            {vehicle.last_sync_at && (
                              <span className="text-[10px] text-slate-400 italic">
                                Last: {new Date(vehicle.last_sync_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="inline-flex items-center gap-2">
                            <Link href={`/master-data/vehicles/${vehicle.id}`}>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={`h-10 w-10 rounded-xl ${vehicle.make === 'Not Mapped' ? 'bg-primary/10 text-primary animate-pulse' : 'text-slate-500'} hover:bg-primary/10 hover:text-primary transition-all`}
                              >
                                <Pencil className="w-4.5 h-4.5" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all"
                              onClick={() => handleDeleteVehicle(vehicle.id)}
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
          
          {!loading && vehicles.length > 0 && (
            <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing <span className="font-bold text-slate-900 dark:text-slate-100">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900 dark:text-slate-100">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-bold text-slate-900 dark:text-slate-100">{totalItems}</span> vehicles
              </p>
              
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg border-slate-200 dark:border-slate-800 disabled:opacity-30"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                
                {/* Simple page numbers */}
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    // This logic is a bit simple, just showing first 5 for now
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "ghost"}
                        size="sm"
                        className={`h-9 w-9 rounded-lg ${currentPage === pageNum ? 'bg-primary shadow-md' : 'text-slate-600'}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && (
                    <>
                      <MoreHorizontal className="w-4 h-4 text-slate-400 px-1" />
                      <Button
                        variant={currentPage === totalPages ? "default" : "ghost"}
                        size="sm"
                        className={`h-9 w-9 rounded-lg ${currentPage === totalPages ? 'bg-primary shadow-md' : 'text-slate-600'}`}
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-lg border-slate-200 dark:border-slate-800 disabled:opacity-30"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
