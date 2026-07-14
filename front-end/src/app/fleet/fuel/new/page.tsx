"use client";

import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, Printer as PrinterIcon, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { SearchableSelect } from "@/components/ui/searchable-select";
import Link from "next/link";
import { format } from "date-fns";

export default function NewFuelOrderPage() {
  const { toast } = useToast();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  
  const [formData, setFormData] = useState({
    vehicle_id: "",
    driver_id: "",
    fuel_station_id: "",
    fuel_type_id: "",
    liters: "",
    mileage: "",
    price_per_liter: "",
  });

  const [fetchingMileage, setFetchingMileage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  
  const [printSize, setPrintSize] = useState<"a5" | "thermal" | "a4">("a5");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resVeh, resEmp, resStat, resType] = await Promise.all([
          api("/api/vehicle/list?page=1&limit=1000").then(res => res.json()),
          api("/api/employee/list").then(res => res.json()),
          api("/api/fuel/get-stations").then(res => res.json()),
          api("/api/fuel/get-types").then(res => res.json()),
        ]);
        
        setVehicles(resVeh.data?.data || resVeh.data?.vehicles || []);
        // Safely extract employees based on typical API responses
        const emps = Array.isArray(resEmp.data) ? resEmp.data : (resEmp.data?.employees || []);
        setEmployees(emps);
        setStations(resStat.data?.stations || []);
        setTypes(resType.data?.types || []);
      } catch (err) {
        toast({ title: "Error", description: "Failed to load initial data.", variant: "destructive" });
      } finally {
        setLoadingInitial(false);
      }
    };
    loadData();
  }, []);

  const handleFetchMileage = async (vehicleId: string) => {
    if (!vehicleId) return;
    const vehicle = vehicles.find(v => v.id.toString() === vehicleId);
    const identifier = vehicle?.vin || vehicle?.vehicle_no;
    if (!identifier) {
      toast({ title: "Fetch Failed", description: "Vehicle VIN/No not found.", variant: "destructive" });
      return;
    }

    setFetchingMileage(true);
    try {
      const response = await api(`/api/vehiclesync/mileage/${encodeURIComponent(identifier)}`);
      const data = await response.json();
      if (data.status === "success" && data.data?.mileage !== undefined) {
        setFormData(prev => ({ ...prev, mileage: data.data.mileage.toString() }));
        toast({ title: "GPS Sync", description: "Mileage fetched successfully." });
      } else {
        throw new Error(data.error || data.message || "Invalid response data");
      }
    } catch (err: any) {
      toast({ 
        title: "GPS Sync Failed", 
        description: err.message || "Could not fetch GPS mileage. Please enter manually.", 
        variant: "destructive" 
      });
    } finally {
      setFetchingMileage(false);
    }
  };

  const handleVehicleChange = async (vehicleId: string) => {
    setFormData(prev => ({ ...prev, vehicle_id: vehicleId }));
    if (vehicleId) {
      await handleFetchMileage(vehicleId);
    }
  };

  const handleFuelTypeChange = (typeId: string) => {
    const t = types.find(x => x.id.toString() === typeId);
    setFormData(prev => ({
      ...prev,
      fuel_type_id: typeId,
      price_per_liter: t ? t.price_per_liter : prev.price_per_liter
    }));
  };

  const calculateTotal = () => {
    const l = parseFloat(formData.liters || "0");
    const p = parseFloat(formData.price_per_liter || "0");
    return (l * p).toFixed(2);
  };

  const handleSubmit = async () => {
    if (!formData.vehicle_id || !formData.fuel_station_id || !formData.fuel_type_id || !formData.liters || !formData.price_per_liter || !formData.mileage) {
      toast({ title: "Validation Error", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const response = await api("/api/fuel/create-order", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save order");
      setOrderId(data.data?.id || data.id);
      toast({ title: "Success", description: "Fuel order saved successfully." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save order.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const printReceipt = () => {
    if (orderId) {
      window.open(`/fleet/fuel/print/${orderId}?autoprint=1`, '_blank');
    }
  };

  if (loadingInitial) {
    return (
      <DashboardLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  // Find related names for printing
  const selVehicle = vehicles.find(v => v.id.toString() === formData.vehicle_id);
  const selDriver = employees.find(e => e.id.toString() === formData.driver_id);
  const selStation = stations.find(s => s.id.toString() === formData.fuel_station_id);
  const selType = types.find(t => t.id.toString() === formData.fuel_type_id);

  // Map options for searchable select
  const vehicleOptions = vehicles.map(v => ({
    value: v.id.toString(),
    label: `${v.vehicle_no || v.vin} (${v.make || ''} ${v.model || ''})`.trim(),
    keywords: `${v.vehicle_no || ''} ${v.vin || ''} ${v.make || ''} ${v.model || ''}`
  }));

  const driverOptions = employees.map(e => ({
    value: e.id.toString(),
    label: e.name || `${e.first_name || ''} ${e.last_name || ''}`.trim(),
    keywords: `${e.name || ''} ${e.first_name || ''} ${e.last_name || ''} ${e.employee_code || ''}`
  }));

  return (
    <DashboardLayout fullWidth={true}>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center space-x-2 mb-4">
          <Link href="/fleet/fuel">
            <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight">New Fuel Order</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 w-full">
          <Card>
            <CardHeader>
              <CardTitle>Issue Fuel</CardTitle>
              <CardDescription>Select vehicle and fuel details to record issuance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Vehicle *</Label>
                <SearchableSelect
                  value={formData.vehicle_id}
                  onValueChange={handleVehicleChange}
                  options={vehicleOptions}
                  placeholder="Select Vehicle"
                  searchPlaceholder="Search vehicle..."
                />
              </div>

              <div className="space-y-1">
                <Label>Driver (Optional)</Label>
                <SearchableSelect
                  value={formData.driver_id}
                  onValueChange={v => setFormData(prev => ({...prev, driver_id: v}))}
                  options={driverOptions}
                  placeholder="Select Driver"
                  searchPlaceholder="Search driver..."
                />
              </div>

              <div className="space-y-1">
                <Label>Current Mileage (km) *</Label>
                <div className="flex gap-2">
                  <Input 
                    type="number" 
                    placeholder="e.g. 50000" 
                    value={formData.mileage}
                    onChange={e => setFormData(prev => ({...prev, mileage: e.target.value}))}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleFetchMileage(formData.vehicle_id)}
                    disabled={fetchingMileage || !formData.vehicle_id}
                  >
                    {fetchingMileage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Fetch"
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Fuel Station *</Label>
                <Select value={formData.fuel_station_id} onValueChange={v => setFormData(prev => ({...prev, fuel_station_id: v}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map(s => (
                      <SelectItem key={s.id} value={s.id.toString()}>{s.name} ({s.type.replace('_', ' ')})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Fuel Type *</Label>
                  <Select value={formData.fuel_type_id} onValueChange={handleFuelTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {types.map(t => (
                        <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Price Per Liter *</Label>
                  <Input 
                    type="number" 
                    value={formData.price_per_liter}
                    onChange={e => setFormData(prev => ({...prev, price_per_liter: e.target.value}))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label>Liters Issued *</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 10.5" 
                  value={formData.liters}
                  onChange={e => setFormData(prev => ({...prev, liters: e.target.value}))}
                />
              </div>

              <div className="p-4 bg-muted rounded-md flex justify-between items-center mt-4">
                <span className="font-semibold">Total Cost:</span>
                <span className="text-xl font-mono font-bold text-primary">LKR {calculateTotal()}</span>
              </div>

              <div className="flex flex-col gap-3 pt-4 border-t">
                <div className="space-y-1">
                  <Label>Print Format Template</Label>
                  <Select value={printSize} onValueChange={(v: any) => setPrintSize(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a5">A5 Landscape Page</SelectItem>
                      <SelectItem value="thermal">3-inch Thermal Receipt</SelectItem>
                      <SelectItem value="a4">A4 Portrait Invoice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {!orderId ? (
                  <Button className="w-full mt-2" onClick={handleSubmit} disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Save className="w-4 h-4 mr-2" /> Save Fuel Order
                  </Button>
                ) : (
                  <Button className="w-full mt-2" onClick={printReceipt} variant="default">
                    <PrinterIcon className="w-4 h-4 mr-2" /> Print Receipt
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Live Receipt Preview Card (Always paper white background) */}
          <Card className="bg-white text-black border-dashed border-2 flex flex-col justify-between h-fit min-h-[450px] shadow-md">
            <CardHeader className="border-b border-dashed pb-4">
              <CardTitle className="text-center text-sm font-mono tracking-wider text-zinc-500 uppercase">
                Live Receipt Preview (${printSize.toUpperCase()})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 font-mono space-y-4 text-sm flex-1">
              <div className="text-center space-y-1 pb-4 border-b border-dashed">
                <h3 className="font-bold text-lg text-zinc-900">BIZZFLOW FUEL</h3>
                <p className="text-xs text-zinc-500">FLEET MANAGEMENT SYSTEM</p>
                <p className="text-xs text-zinc-500">Doc No: {orderId ? `FO-${String(orderId).padStart(4, '0')}` : 'FO-PENDING'}</p>
                <p className="text-xs text-zinc-500">{format(new Date(), "yyyy-MM-dd HH:mm")}</p>
              </div>

              <div className="space-y-2 py-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">VEHICLE NO:</span>
                  <span className="font-bold text-zinc-900">{selVehicle?.vehicle_no || selVehicle?.vin || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">DRIVER:</span>
                  <span className="font-bold text-zinc-900">{selDriver ? `${selDriver.first_name || ''} ${selDriver.last_name || ''}`.trim() : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">STATION:</span>
                  <span className="font-bold font-sans text-zinc-900">{selStation ? `${selStation.name} (${selStation.type.replace('_', ' ')})` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">FUEL TYPE:</span>
                  <span className="font-bold text-zinc-900">{selType?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">MILEAGE:</span>
                  <span className="font-bold text-zinc-900">{formData.mileage ? `${formData.mileage} km` : "—"}</span>
                </div>
              </div>

              <div className="border-t border-dashed pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-zinc-500">QUANTITY:</span>
                  <span className="font-bold text-zinc-900">{formData.liters ? `${formData.liters} L` : "0.00 L"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">PRICE PER LITER:</span>
                  <span className="font-bold text-zinc-900">LKR {formData.price_per_liter || "0.00"}</span>
                </div>
              </div>

              <div className="border-t-2 border-dashed pt-4 flex justify-between items-center text-lg font-bold text-zinc-900">
                <span>TOTAL COST:</span>
                <span>LKR {calculateTotal()}</span>
              </div>

              <div className="pt-6 text-center text-xs text-zinc-500 border-t border-dashed">
                <p className="uppercase">Thank you for pumping with us</p>
                <p className="mt-1 font-sans text-[10px] text-zinc-400">Preview only • Printable after saving</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
