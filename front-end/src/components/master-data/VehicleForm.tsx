"use client"

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Car, Calendar, Hash, Save, X, Truck, User, Fuel, MapPin, Layers, Globe, Gauge, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchDepartments, fetchMakes, fetchModels, contentUrl, api } from "@/lib/api";
import { Vehicle } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { VehicleDocuments } from "./VehicleDocuments";

interface VehicleFormProps {
  initialData?: Partial<Vehicle>;
  isEditing?: boolean;
}

export function VehicleForm({ initialData, isEditing = false }: VehicleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingMileage, setFetchingMileage] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  const [makes, setMakes] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  
  const [formData, setFormData] = useState({
    department_id: initialData?.department_id ?? null,
    make: initialData?.make ?? "",
    model: initialData?.model ?? "",
    year: initialData?.year ?? "",
    vin: initialData?.vin ?? "",
    image_filename: initialData?.image_filename ?? null,
    // Fleet Fields
    category: (initialData as any)?.category ?? "",
    work_type: (initialData as any)?.work_type ?? "",
    driver_name: (initialData as any)?.driver_name ?? "",
    fuel_capacity: (initialData as any)?.fuel_capacity ?? "",
    external_location: (initialData as any)?.external_location ?? "",
    // External API Reference
    external_make: initialData?.external_make ?? "",
    external_model: initialData?.external_model ?? "",
    // Live Mileage (Not persisted in this form usually, but for display)
    current_mileage: initialData?.current_mileage ?? 0,
    // Maintenance
    service_interval_mileage: initialData?.service_interval_mileage ?? null
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState(
    initialData?.image_filename ? contentUrl('vehicles', initialData.image_filename) : ""
  );

  useEffect(() => {
    const loadInit = async () => {
      setLoading(true);
      try {
        const [depts, allMakes] = await Promise.all([
          fetchDepartments(),
          fetchMakes()
        ]);
        setDepartments(depts);
        setMakes(allMakes);
        
        if (formData.make && formData.make !== 'Not Mapped') {
          await loadModelsForMake(formData.make);
        }

        // Live Mileage Fetch if API source
        if (initialData?.source === 'api' && initialData?.vin) {
          fetchLiveMileage(initialData.vin);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadInit();
  }, []);

  const fetchLiveMileage = async (vin: string) => {
    setFetchingMileage(true);
    try {
      const res = await api(`/api/vehicle-sync/get-mileage/${vin}`);
      const json = await res.json();
      if (json.status === 'success') {
        setFormData(p => ({ ...p, current_mileage: json.data.mileage }));
      }
    } catch (err) {
      console.error("Mileage fetch failed", err);
    } finally {
      setFetchingMileage(false);
    }
  };

  const loadModelsForMake = async (makeName: string) => {
    setLoadingModels(true);
    try {
      const res = await fetchModels(makeName);
      setModels(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      let finalImageFilename = formData.image_filename;

      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append('image', imageFile);
        const uploadRes = await api('/api/vehicle/upload_image', {
          method: 'POST',
          body: uploadData,
        });
        const uploadJson = await uploadRes.json();
        if (uploadJson.status === 'success') {
          finalImageFilename = uploadJson.filename;
        }
      }

      const payload = {
        ...formData,
        image_filename: finalImageFilename
      };

      const url = isEditing 
        ? `/api/vehicle/update/${initialData?.id}` 
        : '/api/vehicle/create';
      
      const res = await api(url, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      if (json.status === 'success') {
        toast({ title: "Success", description: `Vehicle ${isEditing ? 'updated' : 'saved'} successfully.` });
        router.push('/master-data/vehicles');
        router.refresh();
      } else {
        throw new Error(json.message || 'Failed to save vehicle');
      }
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading vehicle configuration...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full pb-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-1 space-y-6">
          <Card className="shadow-sm border-none bg-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                Vehicle Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative group">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreview}
                    alt="Vehicle"
                    className="w-full aspect-square rounded-xl object-cover border shadow-sm"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-xl border-2 border-dashed bg-muted/40 flex flex-col items-center justify-center text-muted-foreground">
                    <Car className="w-12 h-12 opacity-20 mb-2" />
                    <span className="text-xs">No image provided</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="image" className="text-xs font-bold uppercase text-muted-foreground">Upload Photo</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setImageFile(f);
                    if (f) {
                      const url = URL.createObjectURL(f);
                      setImagePreview(url);
                    }
                  }}
                  className="text-xs cursor-pointer"
                />
              </div>
            </CardContent>
          </Card>

          {/* External Reference Data (If synced) */}
          {(initialData?.source === 'api' || formData.external_make) && (
            <Card className="shadow-sm border-none bg-blue-50/50 border-blue-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-blue-700">
                  <Globe className="w-4 h-4" />
                  External API Data
                </CardTitle>
                <CardDescription className="text-[10px]">Reference information from external fleet system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Make (API)</Label>
                    <p className="text-sm font-bold">{formData.external_make || "N/A"}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Model (API)</Label>
                    <p className="text-sm font-bold">{formData.external_model || "N/A"}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase text-muted-foreground">Ext. Location</Label>
                  <p className="text-sm font-medium text-blue-600 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {formData.external_location || "Unknown"}
                  </p>
                </div>

                <div className="pt-4 border-t border-blue-100">
                   <Label className="text-[10px] uppercase text-muted-foreground block mb-2">Live Odometer (KM)</Label>
                   <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                      <div className="flex items-center gap-3">
                        <Gauge className={`w-5 h-5 ${fetchingMileage ? 'text-blue-400 animate-pulse' : 'text-blue-600'}`} />
                        <span className="text-xl font-black text-blue-700">
                          {fetchingMileage ? "---" : formData.current_mileage.toLocaleString()}
                        </span>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-blue-600" 
                        onClick={() => initialData?.vin && fetchLiveMileage(initialData.vin)}
                        disabled={fetchingMileage}
                      >
                        <RefreshCw className={`w-4 h-4 ${fetchingMileage ? 'animate-spin' : ''}`} />
                      </Button>
                   </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Card className="shadow-sm border-none bg-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                Internal Routing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="dept" className="text-xs font-bold uppercase text-muted-foreground">Department Assignment</Label>
                <Select
                  value={formData.department_id ? String(formData.department_id) : "none"}
                  onValueChange={(value) => setFormData(p => ({ ...p, department_id: value === "none" ? null : Number(value) }))}
                >
                  <SelectTrigger id="dept" className="bg-background">
                    <SelectValue placeholder="Select a department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department (Floating)</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          <Card className="shadow-md border-none">
            <CardHeader className="bg-primary/[0.03] border-b">
              <CardTitle className="text-lg">Core Vehicle Details (Internal ERP)</CardTitle>
              <CardDescription>Map the external vehicle data to your internal ERP makes and models.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="make" className="flex items-center justify-between">
                    <span>ERP Make</span>
                    {formData.make === 'Not Mapped' && <Badge variant="destructive" className="text-[8px] h-4 uppercase">Action Required</Badge>}
                  </Label>
                  <Select
                    value={formData.make || undefined}
                    onValueChange={(value) => {
                      setFormData(p => ({ ...p, make: value, model: '' }));
                      void loadModelsForMake(value);
                    }}
                  >
                    <SelectTrigger id="make" className={formData.make === 'Not Mapped' ? "border-destructive ring-destructive/20" : ""}>
                      <SelectValue placeholder="Select internal brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {makes.map((m) => (
                        <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="model">ERP Model</Label>
                  <Select
                    value={formData.model || undefined}
                    onValueChange={(value) => setFormData(p => ({ ...p, model: value }))}
                    disabled={!formData.make || formData.make === 'Not Mapped' || loadingModels}
                  >
                    <SelectTrigger id="model">
                      <SelectValue placeholder={loadingModels ? "Loading..." : "Select internal model"} />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((m) => (
                        <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Manufacturing Year</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="year" type="number" className="pl-10" placeholder="e.g. 2024" value={formData.year} onChange={(e) => setFormData(p => ({ ...p, year: e.target.value }))} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vin">VIN / Chassis Number</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input id="vin" className="pl-10 font-mono" placeholder="17-digit number" value={formData.vin} onChange={(e) => setFormData(p => ({ ...p, vin: e.target.value }))} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none">
            <CardHeader className="bg-primary/[0.03] border-b">
              <CardTitle className="text-lg">Fleet Management Attributes</CardTitle>
              <CardDescription>Extended attributes synchronized from external systems</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="flex items-center gap-2">
                    <Truck className="w-3.5 h-3.5" /> Vehicle Category
                  </Label>
                  <Input id="category" placeholder="e.g. Light Vehicle" value={formData.category} onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="work_type" className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Work Assignment
                  </Label>
                  <Input id="work_type" placeholder="e.g. Transport" value={formData.work_type} onChange={(e) => setFormData(p => ({ ...p, work_type: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="driver_name" className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" /> Assigned Driver
                  </Label>
                  <Input id="driver_name" placeholder="Driver name" value={formData.driver_name} onChange={(e) => setFormData(p => ({ ...p, driver_name: e.target.value }))} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fuel_capacity" className="flex items-center gap-2">
                    <Fuel className="w-3.5 h-3.5" /> Fuel Tank Capacity
                  </Label>
                  <Input id="fuel_capacity" placeholder="e.g. 60L" value={formData.fuel_capacity} onChange={(e) => setFormData(p => ({ ...p, fuel_capacity: e.target.value }))} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md border-none">
            <CardHeader className="bg-primary/[0.03] border-b">
              <CardTitle className="text-lg">Scheduled Maintenance</CardTitle>
              <CardDescription>Track service intervals and next service due</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="service_interval">Service Interval (Mileage)</Label>
                  <Input 
                    id="service_interval" 
                    type="number" 
                    placeholder="e.g. 5000" 
                    value={formData.service_interval_mileage || ''} 
                    onChange={(e) => setFormData(p => ({ ...p, service_interval_mileage: e.target.value ? Number(e.target.value) : null }))} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Next Service Mileage</Label>
                  <div className="p-2 border rounded-md bg-muted/20 font-bold text-lg">
                    {initialData?.next_service_mileage ? initialData.next_service_mileage.toLocaleString() : "Not Set"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Next Service Date</Label>
                  <div className="p-2 border rounded-md bg-muted/20 font-bold text-lg">
                    {initialData?.next_service_date ? new Date(initialData.next_service_date).toLocaleDateString() : "Not Set"}
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="bg-muted/30 border-t p-6 flex justify-between gap-4">
              <Button variant="outline" type="button" onClick={() => router.back()} className="gap-2">
                <X className="w-4 h-4" /> Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="gap-2 min-w-[150px] shadow-md">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isEditing ? "Save Mappings" : "Create Vehicle"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {isEditing && initialData?.id && (
        <div className="mt-12">
          <VehicleDocuments vehicleId={initialData.id} />
        </div>
      )}
    </form>
  );
}
