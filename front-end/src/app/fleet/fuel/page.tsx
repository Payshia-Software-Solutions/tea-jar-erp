"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Fuel, MapPin, Printer } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchableSelect } from "@/components/ui/searchable-select";

type FuelOrder = {
  id: number;
  vehicle_no: string;
  driver_name: string | null;
  station_name: string;
  fuel_type_name: string;
  liters: string;
  price_per_liter: string;
  total_cost: string;
  mileage: string;
  created_at: string;
  status: string;
  created_by_name?: string | null;
};

export default function FuelOrdersDashboard() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<FuelOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Lists for dropdown options
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);

  // Date range filters default to the last 3 days
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3);
    return threeDaysAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Additional column filters
  const [filterVehicle, setFilterVehicle] = useState("");
  const [filterDriver, setFilterDriver] = useState("");
  const [filterFuelType, setFilterFuelType] = useState("");
  const [filterStation, setFilterStation] = useState("");
  const [filterLiters, setFilterLiters] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [resOrders, resVeh, resEmp, resStat, resType] = await Promise.all([
        api("/api/fuel/get-orders").then(res => res.json()),
        api("/api/vehicle/list?page=1&limit=1000").then(res => res.json()).catch(() => ({ data: { data: [] } })),
        api("/api/employee/list").then(res => res.json()).catch(() => ({ data: [] })),
        api("/api/fuel/get-stations").then(res => res.json()).catch(() => ({ data: { stations: [] } })),
        api("/api/fuel/get-types").then(res => res.json()).catch(() => ({ data: { types: [] } })),
      ]);

      setOrders(resOrders.data?.orders || []);
      setVehicles(resVeh.data?.data || resVeh.data?.vehicles || []);
      const emps = Array.isArray(resEmp.data) ? resEmp.data : (resEmp.data?.employees || []);
      setEmployees(emps);
      setStations(resStat.data?.stations || []);
      setTypes(resType.data?.types || []);
    } catch (err) {
      toast({ title: "Error", description: "Failed to load fuel dashboard data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map dropdown options
  const vehicleOptions = [
    { value: "", label: "All Vehicles", keywords: "all vehicles" },
    ...vehicles.map(v => ({
      value: v.vin || v.vehicle_no,
      label: `${v.vehicle_no || v.vin} (${v.make || ''} ${v.model || ''})`.trim(),
      keywords: `${v.vehicle_no || ''} ${v.vin || ''} ${v.make || ''} ${v.model || ''}`
    }))
  ];

  const driverOptions = [
    { value: "", label: "All Drivers", keywords: "all drivers" },
    ...employees.map(e => ({
      value: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
      label: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
      keywords: `${e.name || ''} ${e.first_name || ''} ${e.last_name || ''} ${e.employee_code || ''}`
    }))
  ];

  const fuelTypeOptions = [
    { value: "", label: "All Types", keywords: "all types" },
    ...types.map(t => ({
      value: t.name,
      label: t.name,
      keywords: t.name
    }))
  ];

  const stationOptions = [
    { value: "", label: "All Stations", keywords: "all stations" },
    ...stations.map(s => ({
      value: s.name,
      label: s.name,
      keywords: s.name
    }))
  ];

  const createdByOptions = [
    { value: "", label: "All Creators", keywords: "all creators" },
    ...Array.from(new Set(orders.map(o => o.created_by_name).filter(Boolean))).map(name => ({
      value: name!,
      label: name!,
      keywords: name!.toLowerCase()
    }))
  ];

  const litersOptions = [
    { value: "", label: "All Liters", keywords: "all liters" },
    ...Array.from(new Set(orders.map(o => parseFloat(o.liters).toFixed(2)))).sort((a,b) => parseFloat(a)-parseFloat(b)).map(liters => ({
      value: liters,
      label: `${liters} L`,
      keywords: liters
    }))
  ];

  const filteredOrders = orders.filter((order) => {
    // Date range filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      if (orderDate < start) return false;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const orderDate = new Date(order.created_at);
      orderDate.setHours(0, 0, 0, 0);
      if (orderDate > end) return false;
    }

    // Column dropdown filters
    if (filterVehicle && order.vehicle_no !== filterVehicle) {
      return false;
    }
    if (filterDriver && (order.driver_name || "") !== filterDriver) {
      return false;
    }
    if (filterFuelType && order.fuel_type_name !== filterFuelType) {
      return false;
    }
    if (filterStation && order.station_name !== filterStation) {
      return false;
    }
    if (filterLiters && parseFloat(order.liters).toFixed(2) !== filterLiters) {
      return false;
    }
    if (filterCreatedBy && (order.created_by_name || "") !== filterCreatedBy) {
      return false;
    }

    return true;
  });

  const displayOrders = (!startDate && !endDate)
    ? [...filteredOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20)
    : filteredOrders;

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Fuel Management</h2>
          <div className="flex items-center space-x-2">
            <Link href="/fleet/fuel/settings">
              <Button variant="outline">
                <MapPin className="mr-2 h-4 w-4" /> Settings
              </Button>
            </Link>
            <Link href="/fleet/fuel/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Fuel Order
              </Button>
            </Link>
          </div>
        </div>

        {/* Date & Searchable Dropdown Filters Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter Orders</CardTitle>
            <CardDescription>Filter fuel issuance records by date range and dropdown criteria.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Vehicle</Label>
                <SearchableSelect
                  value={filterVehicle}
                  onValueChange={setFilterVehicle}
                  options={vehicleOptions}
                  placeholder="All Vehicles"
                  searchPlaceholder="Search vehicle..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Driver</Label>
                <SearchableSelect
                  value={filterDriver}
                  onValueChange={setFilterDriver}
                  options={driverOptions}
                  placeholder="All Drivers"
                  searchPlaceholder="Search driver..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Fuel Type</Label>
                <SearchableSelect
                  value={filterFuelType}
                  onValueChange={setFilterFuelType}
                  options={fuelTypeOptions}
                  placeholder="All Types"
                  searchPlaceholder="Search type..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Station</Label>
                <SearchableSelect
                  value={filterStation}
                  onValueChange={setFilterStation}
                  options={stationOptions}
                  placeholder="All Stations"
                  searchPlaceholder="Search station..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Liters</Label>
                <SearchableSelect
                  value={filterLiters}
                  onValueChange={setFilterLiters}
                  options={litersOptions}
                  placeholder="All Liters"
                  searchPlaceholder="Search quantity..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Created By</Label>
                <SearchableSelect
                  value={filterCreatedBy}
                  onValueChange={setFilterCreatedBy}
                  options={createdByOptions}
                  placeholder="All Creators"
                  searchPlaceholder="Search creator..."
                />
              </div>
            </div>
            
            {(startDate || endDate || filterVehicle || filterDriver || filterFuelType || filterStation || filterLiters || filterCreatedBy) && (
              <div className="flex justify-end pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setFilterVehicle("");
                    setFilterDriver("");
                    setFilterFuelType("");
                    setFilterStation("");
                    setFilterLiters("");
                    setFilterCreatedBy("");
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Fuel Orders</CardTitle>
            <CardDescription>View and manage all fuel issuances for the fleet.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Doc No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Fuel Type</TableHead>
                      <TableHead>Station</TableHead>
                      <TableHead className="text-right">Liters</TableHead>
                      <TableHead className="text-right">Total (LKR)</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center h-24 text-muted-foreground">
                          No fuel orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-semibold text-xs text-primary">
                            FO-{String(order.id).padStart(4, '0')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {format(new Date(order.created_at), "yyyy-MM-dd HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.vehicle_no}</Badge>
                          </TableCell>
                          <TableCell>{order.driver_name || "-"}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1 text-xs">
                              <Fuel className="h-3 w-3" /> {order.fuel_type_name}
                            </span>
                          </TableCell>
                          <TableCell>{order.station_name}</TableCell>
                          <TableCell className="text-right font-mono">{parseFloat(order.liters).toFixed(2)} L</TableCell>
                          <TableCell className="text-right font-mono">
                            {parseFloat(order.total_cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="font-mono text-muted-foreground">{order.mileage} km</TableCell>
                          <TableCell className="text-muted-foreground text-xs">{order.created_by_name || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-1.5 hover:bg-slate-50"
                              onClick={() => window.open(`/fleet/fuel/print/${order.id}?autoprint=1`, '_blank')}
                            >
                              <Printer className="h-3.5 w-3.5" /> Print
                            </Button>
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
      </div>
    </DashboardLayout>
  );
}
