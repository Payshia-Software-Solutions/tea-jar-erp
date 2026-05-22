"use client"

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  createCategory,
  createChecklistTemplate,
  createOrder,
  fetchCategories,
  fetchChecklistTemplates,
  fetchVehicles,
  uploadOrderAttachment,
  api,
  fetchLocations,
  type ServiceLocation
} from "@/lib/api";
import type { Vehicle } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Car,
  CheckCircle2,
  ChevronsUpDown,
  ChevronRight,
  Clock,
  Gauge,
  Loader2,
  Plus,
  Pencil,
  Search,
  X,
  MapPin,
  FileText,
  Paperclip,
  ClipboardList,
} from "lucide-react";

const PRIORITIES = [
  { key: "Low", hint: "Routine", tone: "bg-muted/30" },
  { key: "Medium", hint: "Standard", tone: "bg-primary/5" },
  { key: "High", hint: "Important", tone: "bg-amber-500/10" },
  { key: "Urgent", hint: "Immediate", tone: "bg-red-500/10" },
] as const;

type ChecklistTemplate = { id: number; description: string };
type RepairCategory = { id: number; name: string };

function normalizeMysqlDatetime(value: string) {
  // Input type datetime-local => "YYYY-MM-DDTHH:mm".
  // MySQL DATETIME expects "YYYY-MM-DD HH:mm:ss".
  if (!value) return null;
  const v = value.includes("T") ? value.replace("T", " ") : value;
  return v.length === 16 ? `${v}:00` : v;
}

export default function NewOrderPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
  const [availableCategories, setAvailableCategories] = useState<RepairCategory[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);

  const [formData, setFormData] = useState({
    vehicleId: searchParams.get("vehicle_id") || "",
    fromLocationId: "",
    toLocationId: "",
    mileage: searchParams.get("mileage") || "",
    priority: "Medium",
    expectedDate: "",
    expectedClock: "",
    problemDescription: "",
    comments: "",
    jobType: searchParams.get("job_type") || "Repair",
    bookingDate: "",
  });

  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");

  const [selectedChecklist, setSelectedChecklist] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [addingChecklist, setAddingChecklist] = useState(false);
  const [checklistSearch, setChecklistSearch] = useState("");
  const [isChecklistDialogOpen, setIsChecklistDialogOpen] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);

  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  const selectedVehicle = useMemo(() => {
    return vehicles.find((v: any) => String(v.id) === String(formData.vehicleId));
  }, [vehicles, formData.vehicleId]);

  const vehicleLabel = useMemo(() => {
    if (!selectedVehicle) return "";
    const v: any = selectedVehicle as any;
    const identifier = v.vin || `Vehicle #${v.id}`;
    const details = [v.make, v.model, v.year].filter(Boolean).join(" ");
    return details ? `${identifier} (${details})` : identifier;
  }, [selectedVehicle]);

  const ownerLabel = useMemo(() => {
    if (!selectedVehicle) return "";
    const v: any = selectedVehicle as any;
    if (v.customer_name) return v.customer_name;
    if (v.department_name) return v.department_name;
    return "Internal";
  }, [selectedVehicle]);

  const filteredVehicles = useMemo(() => {
    const q = vehicleSearch.trim().toLowerCase();
    if (!q) return vehicles;
    return vehicles.filter((v: any) => {
      const hay = [
        v.id,
        v.make,
        v.model,
        v.year,
        v.vin,
        v.customer_name,
        v.department_name,
      ]
        .filter(Boolean)
        .map((x: any) => String(x).toLowerCase())
        .join(" ");
      return hay.includes(q);
    });
  }, [vehicles, vehicleSearch]);

  const filteredChecklistTemplates = useMemo(() => {
    if (!checklistSearch) return checklistTemplates;
    const lower = checklistSearch.toLowerCase();
    return checklistTemplates.filter((t: any) => t.description.toLowerCase().includes(lower));
  }, [checklistTemplates, checklistSearch]);

  const filteredCategories = useMemo(() => {
    if (!categorySearch) return availableCategories;
    const lower = categorySearch.toLowerCase();
    return availableCategories.filter((c: any) => c.name.toLowerCase().includes(lower));
  }, [availableCategories, categorySearch]);

  const setExpectedQuick = (daysFromToday: number, clock: string) => {
    const d = new Date();
    d.setDate(d.getDate() + daysFromToday);
    // Format as local YYYY-MM-DD (avoid UTC shifting).
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    const date = local.toISOString().slice(0, 10);
    setFormData((prev) => ({ ...prev, expectedDate: date, expectedClock: clock }));
  };

  const expectedDisplay = useMemo(() => {
    if (!formData.expectedDate) return "";
    const t = (formData.expectedClock || "09:00").trim();
    const dt = new Date(`${formData.expectedDate}T${t}`);
    if (Number.isNaN(dt.getTime())) return `${formData.expectedDate} ${t}`;
    return dt.toLocaleString();
  }, [formData.expectedDate, formData.expectedClock]);

  const [fetchingMileage, setFetchingMileage] = useState(false);
  const [isMileageAutoFetched, setIsMileageAutoFetched] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [v, t, c, locs] = await Promise.all([
        fetchVehicles(1, 1000), // Fetch up to 1000 vehicles to ensure search works across the fleet
        fetchChecklistTemplates(),
        fetchCategories(),
        fetchLocations(),
      ]);
      setVehicles(v && Array.isArray(v.data) ? v.data : []);
      setChecklistTemplates(Array.isArray(t) ? t : []);
      setAvailableCategories(Array.isArray(c) ? c : []);
      const locArray = Array.isArray(locs) ? locs : [];
      setLocations(locArray);
      
      const defaultLocId = typeof window !== 'undefined' ? window.localStorage.getItem('location_id') : null;
      if (defaultLocId) {
        setFormData(prev => ({
          ...prev,
          fromLocationId: prev.fromLocationId || defaultLocId,
        }));
      }
    } catch (e: any) {
      toast({
        title: "Error",
        description: "Failed to load master data for order creation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live Mileage Fetch when vehicle selected
  useEffect(() => {
    const fetchLiveMileage = async () => {
      if (!selectedVehicle || (selectedVehicle as any).source !== 'api' || !(selectedVehicle as any).vin) {
        return;
      }
      setFetchingMileage(true);
      try {
        const vin = (selectedVehicle as any).vin;
        const encodedVin = encodeURIComponent(vin);
        const res = await api(`/api/vehicle-sync/get-mileage/${encodedVin}`);
        const json = await res.json();
        
        console.log(`Mileage API [${vin}]:`, json);
        
        if (json.status === 'success' && json.data?.mileage) {
          setFormData(prev => ({ ...prev, mileage: String(json.data.mileage) }));
          setIsMileageAutoFetched(true);
          toast({
            title: "Mileage Fetched",
            description: `Live odometer reading: ${json.data.mileage} KM`,
          });
        } else {
          console.warn("Mileage fetch failed:", json);
          // Don't show toast for "not found" to avoid annoying the user if it's just not available
        }
      } catch (err) {
        console.error("Mileage fetch error:", err);
        const errorMsg = (err as Error).message || "Unknown connection error";
        toast({
          title: "Sync Error",
          description: `Fleet API: ${errorMsg}`,
          variant: "destructive"
        });
      } finally {
        setFetchingMileage(false);
      }
    };

    if (formData.vehicleId) {
      setIsMileageAutoFetched(false); // Reset on vehicle change
      void fetchLiveMileage();
    }
  }, [formData.vehicleId, selectedVehicle]);

  const toggleChecklist = (desc: string) => {
    setSelectedChecklist((prev) =>
      prev.includes(desc) ? prev.filter((x) => x !== desc) : [...prev, desc]
    );
  };

  const toggleCategory = (name: string) => {
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const handleAddChecklistItem = async () => {
    const desc = newChecklistItem.trim();
    if (!desc) return;

    setAddingChecklist(true);
    try {
      await createChecklistTemplate({ description: desc });
      setNewChecklistItem("");
      await loadData();
      setSelectedChecklist((prev) => (prev.includes(desc) ? prev : [...prev, desc]));
      toast({ title: "Added", description: "Checklist item added." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to add checklist item.",
        variant: "destructive",
      });
    } finally {
      setAddingChecklist(false);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;

    setAddingCategory(true);
    try {
      await createCategory({ name });
      setNewCategoryName("");
      await loadData();
      setSelectedCategories((prev) => (prev.includes(name) ? prev : [...prev, name]));
      toast({ title: "Added", description: "Category created." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to create category.",
        variant: "destructive",
      });
    } finally {
      setAddingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicle) {
      toast({
        title: "Missing",
        description: "Please select a vehicle.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.problemDescription.trim()) {
      toast({
        title: "Missing",
        description: "Problem description is required.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.fromLocationId) {
      toast({
        title: "Missing",
        description: "From Location is required.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.toLocationId) {
      toast({
        title: "Missing",
        description: "To Service Center Location is required.",
        variant: "destructive",
      });
      return;
    }

    const mileageNum = Number(formData.mileage);
    if (!Number.isFinite(mileageNum) || mileageNum < 0) {
      toast({
        title: "Invalid",
        description: "Mileage must be a valid number.",
        variant: "destructive",
      });
      return;
    }

    const v: any = selectedVehicle as any;
    // Fallback chain for vehicle description: ERP Make/Model -> External Make/Model -> VIN -> Label
    const erpModel = `${v.make ?? ""} ${v.model ?? ""}`.trim();
    const extModel = `${v.external_make ?? ""} ${v.external_model ?? ""}`.trim();
    const vehicleModel = erpModel || extModel || v.vin || vehicleLabel || "Unknown Vehicle";
    const expectedLocal =
      formData.expectedDate.trim() !== ""
        ? `${formData.expectedDate}T${(formData.expectedClock || "09:00").trim()}`
        : "";

    setSubmitting(true);
    let printTab: Window | null = null;
    try {
      setAttachmentUploading(true);
      const attachmentFilenames: string[] = [];
      setUploadProgress({ current: 0, total: attachmentFiles.length });
      for (let i = 0; i < attachmentFiles.length; i++) {
        setUploadProgress({ current: i + 1, total: attachmentFiles.length });
        const up = await uploadOrderAttachment(attachmentFiles[i]);
        if (up?.status === "success" && up.data?.filename) {
          attachmentFilenames.push(up.data.filename);
        }
      }
      setAttachmentUploading(false);

      const res = await createOrder({
        customerName: "Walk-in",
        vehicleModel,
        problemDescription: formData.problemDescription.trim(),
        vehicle_id: Number(v.id),
        vehicle_identifier: v.vin ?? vehicleLabel ?? null,
        mileage: Math.trunc(mileageNum),
        priority: formData.priority,
        expectedTime: expectedLocal ? normalizeMysqlDatetime(expectedLocal) : null,
        comments: formData.comments?.trim() || null,
        categories: selectedCategories,
        checklist: selectedChecklist,
        attachments: attachmentFilenames,
        from_location_id: formData.fromLocationId ? Number(formData.fromLocationId) : null,
        to_location_id: formData.toLocationId ? Number(formData.toLocationId) : null,
        jobType: formData.jobType,
        bookingDate: formData.bookingDate ? formData.bookingDate + " 00:00:00" : null,
      });

      const createdId = (res && res.status === "success" && res.data && (res.data.id ?? res.data.order_id))
        ? String(res.data.id ?? res.data.order_id)
        : null;

      toast({
        title: "Order Created",
        description: `Repair Order created for ${vehicleLabel || vehicleModel}.`,
      });

      // Redirect first to ensure the main window moves to the list
      router.push("/orders");

      if (createdId) {
        const url = `/orders/print/${encodeURIComponent(createdId)}?autoprint=1`;
        
        // Open the print receipt in a new tab
        const w = window.open(url, "_blank", "noopener,noreferrer");
        if (!w) {
          toast({
            title: "Popup blocked",
            description: "Allow popups to auto-open the print receipt.",
            variant: "destructive",
          });
        }
      }
    } catch (err: any) {
      setAttachmentUploading(false);
      toast({ 
        title: "Error", 
        description: err.message || "Failed to create order.", 
        variant: "destructive" 
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Repair Order</h1>
          <p className="text-muted-foreground mt-1">Register a new vehicle for workshop service</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Orders</span>
          <ChevronRight className="w-4 h-4" />
          <span className="font-medium text-foreground">New Order</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading order data...</span>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* CARD 1: VEHICLE & ROUTING */}
            <Card className="shadow-md border border-muted/40">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Vehicle & Routing</CardTitle>
                    <CardDescription>Select vehicle, routing path, and current mileage</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Vehicle selection */}
                  <div className="space-y-3">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Vehicle Selection</Label>
                        <div className="text-xs text-muted-foreground mt-0.5">Search by make/model/year/VIN</div>
                      </div>
                      {selectedVehicle ? (
                        <Badge variant="secondary" className="text-[11px] font-mono">
                          ID: {(selectedVehicle as any).id}
                        </Badge>
                      ) : null}
                    </div>

                    <Popover open={vehiclePickerOpen} onOpenChange={setVehiclePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full h-12 justify-between px-4 rounded-xl border-muted-foreground/20 hover:border-primary/50 transition-all hover:bg-muted/10"
                        >
                          <span className="inline-flex items-center gap-2 min-w-0">
                            <span className="p-1.5 rounded-md bg-muted">
                              <Car className="w-4 h-4 text-muted-foreground" />
                            </span>
                            <span className={cn("truncate font-medium", !vehicleLabel && "text-muted-foreground")}>
                              {vehicleLabel || "Search and select a vehicle..."}
                            </span>
                          </span>
                          <ChevronsUpDown className="w-4 h-4 opacity-70" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[460px] p-3 shadow-xl border border-muted/40 rounded-xl">
                        <div className="flex items-center gap-2 pb-3">
                          <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={vehicleSearch}
                              onChange={(e) => setVehicleSearch(e.target.value)}
                              placeholder="Search by make, model, year, VIN, or ID..."
                              className="pl-8 h-10 rounded-lg"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setVehicleSearch("")}
                            className="h-10 px-3 hover:bg-muted/80 rounded-lg"
                          >
                            Clear
                          </Button>
                        </div>

                        <ScrollArea className="h-[300px] pr-2">
                          <div className="space-y-1">
                            {filteredVehicles.length === 0 ? (
                              <div className="text-sm text-muted-foreground py-10 text-center">
                                No vehicles match your search.
                              </div>
                            ) : (
                              filteredVehicles.map((vv: any) => {
                                const selected = String(vv.id) === String(formData.vehicleId);
                                return (
                                  <button
                                    key={String(vv.id)}
                                    type="button"
                                    onClick={() => {
                                      setFormData((prev) => ({ ...prev, vehicleId: String(vv.id) }));
                                      setVehiclePickerOpen(false);
                                    }}
                                    className={cn(
                                      "w-full text-left rounded-xl border px-3 py-3 transition-colors",
                                      selected
                                        ? "bg-primary/5 border-primary/40"
                                        : "hover:bg-muted/40 border-transparent"
                                    )}
                                  >
                                    <div className="flex items-start justify-between gap-3 font-medium">
                                      <div className="min-w-0">
                                        <div className="font-bold text-base tracking-tight text-primary truncate">
                                          {vv.vin || `ID: ${vv.id}`}
                                        </div>
                                        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-0.5 truncate">
                                          {[vv.make, vv.model, vv.year].filter(Boolean).join(" ")}
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                            ID: {vv.id}
                                          </div>
                                          {vv.customer_name ? (
                                            <Badge variant="outline" className="text-[10px] py-0 h-4 bg-blue-50 text-blue-700 border-blue-200">
                                              {vv.customer_name}
                                            </Badge>
                                          ) : vv.department_name ? (
                                            <Badge variant="outline" className="text-[10px] py-0 h-4 bg-amber-50 text-amber-700 border-amber-200">
                                              {vv.department_name}
                                            </Badge>
                                          ) : null}
                                        </div>
                                      </div>
                                      {selected ? (
                                        <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                      ) : null}
                                    </div>
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </ScrollArea>
                      </PopoverContent>
                    </Popover>

                    {selectedVehicle ? (
                      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm transition-all duration-300">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <Car className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-bold text-foreground text-sm truncate">{vehicleLabel}</div>
                              {selectedVehicle && (
                                <Badge variant="secondary" className="text-[10px] py-0 h-4 px-1.5 whitespace-nowrap bg-primary/10 text-primary hover:bg-primary/25 border-none">
                                  {ownerLabel}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              You can change the selected vehicle anytime.
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-muted-foreground/35 bg-muted/10 p-4 text-sm text-muted-foreground flex items-center justify-center min-h-[90px]">
                        Select a vehicle to continue.
                      </div>
                    )}
                  </div>

                  {/* Column 2: Route & Mileage */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          From Location
                        </Label>
                        <Select value={formData.fromLocationId} onValueChange={(val) => setFormData(p => ({ ...p, fromLocationId: val }))}>
                          <SelectTrigger className="w-full rounded-xl h-11 border-muted-foreground/20">
                            <SelectValue placeholder="Select Origin" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {locations.map((loc) => (
                              <SelectItem key={loc.id} value={String(loc.id)}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          To Service Center
                        </Label>
                        <Select value={formData.toLocationId} onValueChange={(val) => setFormData(p => ({ ...p, toLocationId: val }))}>
                          <SelectTrigger className="w-full rounded-xl h-11 border-muted-foreground/20">
                            <SelectValue placeholder="Select Destination" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {locations.filter(l => l.location_type === 'service').map((loc) => (
                              <SelectItem key={loc.id} value={String(loc.id)}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="mileage" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mileage (Odometer Reading)</Label>
                      <div className="relative">
                        <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="mileage"
                          type="number"
                          placeholder="e.g. 45000"
                          readOnly={isMileageAutoFetched}
                          value={formData.mileage}
                          onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                          className={cn(
                            "pl-9 pr-12 h-11 rounded-xl border-muted-foreground/20",
                            isMileageAutoFetched && "bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed font-bold"
                          )}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          {isMileageAutoFetched && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 text-slate-400 hover:text-primary rounded-md"
                              onClick={() => setIsMileageAutoFetched(false)}
                              title="Edit manually"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          )}
                          {fetchingMileage ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          ) : (
                            <span className="text-xs text-muted-foreground font-bold">KM</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 2: SERVICE SCHEDULING & PRIORITY */}
            <Card className="shadow-md border border-muted/40">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <CalendarIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Service Schedule & Priority</CardTitle>
                    <CardDescription>Select order type, completion timeline, and priority level</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Column 1: Timeline & Type */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Type</Label>
                        <Select value={formData.jobType} onValueChange={(val) => setFormData(p => ({ ...p, jobType: val }))}>
                          <SelectTrigger className="w-full rounded-xl h-11 border-muted-foreground/20">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Repair">Running Repair</SelectItem>
                            <SelectItem value="Service Booking">Service Booking</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {formData.jobType === 'Service Booking' ? (
                        <div className="space-y-1.5">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booking Date</Label>
                          <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="date"
                              value={formData.bookingDate}
                              onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                              className="pl-9 h-11 rounded-xl border-muted-foreground/20"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 opacity-50 select-none">
                          <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booking Date</Label>
                          <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="date"
                              disabled
                              placeholder="Only for Service Booking"
                              className="pl-9 h-11 rounded-xl border-muted-foreground/20 bg-muted/20 cursor-not-allowed"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-muted/40 bg-muted/5 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold text-foreground">Expected Completion</span>
                        {expectedDisplay ? (
                          <Badge variant="secondary" className="text-[11px] bg-primary/10 text-primary border-none">
                            {expectedDisplay}
                          </Badge>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Date</Label>
                          <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="date"
                              value={formData.expectedDate}
                              onChange={(e) => setFormData({ ...formData, expectedDate: e.target.value })}
                              className="pl-9 h-10 rounded-xl border-muted-foreground/20 text-xs"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] uppercase font-bold text-muted-foreground">Time</Label>
                          <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              type="time"
                              value={formData.expectedClock}
                              onChange={(e) => setFormData({ ...formData, expectedClock: e.target.value })}
                              className="pl-9 h-10 rounded-xl border-muted-foreground/20 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setExpectedQuick(0, "09:00")}
                          className="rounded-lg w-full min-w-0 truncate px-1 text-[11px] h-8 bg-muted hover:bg-muted/80 text-foreground"
                          title="Today 9:00"
                        >
                          Today 9:00
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setExpectedQuick(0, "17:00")}
                          className="rounded-lg w-full min-w-0 truncate px-1 text-[11px] h-8 bg-muted hover:bg-muted/80 text-foreground"
                          title="Today 17:00"
                        >
                          Today 17:00
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setExpectedQuick(1, "09:00")}
                          className="rounded-lg w-full min-w-0 truncate px-1 text-[11px] h-8 bg-muted hover:bg-muted/80 text-foreground"
                          title="Tomorrow 9:00"
                        >
                          Tomorrow 9:00
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setExpectedQuick(1, "17:00")}
                          className="rounded-lg w-full min-w-0 truncate px-1 text-[11px] h-8 bg-muted hover:bg-muted/80 text-foreground"
                          title="Tomorrow 17:00"
                        >
                          Tomorrow 17:00
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Priority Grid */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Priority</Label>
                    <div className="grid grid-cols-2 gap-3 h-[calc(100%-24px)] min-h-[170px]">
                      {PRIORITIES.map((p) => {
                        const isSelected = formData.priority === p.key;
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => setFormData({ ...formData, priority: p.key })}
                            className={cn(
                              "text-left rounded-xl border p-3.5 transition-all flex flex-col justify-between hover:shadow-sm",
                              p.tone,
                              isSelected
                                ? "border-primary ring-2 ring-primary/20 bg-primary/[0.03]"
                                : "border-muted-foreground/15 bg-transparent"
                            )}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="font-bold text-sm tracking-tight text-foreground">{p.key}</span>
                              {isSelected ? (
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                              ) : (
                                <span className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-medium mt-2">{p.hint}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARD 3: DIAGNOSTICS & DETAILS */}
            <Card className="shadow-md border border-muted/40">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Diagnostics & Details</CardTitle>
                    <CardDescription>Enter problem description, additional notes, and attach files</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="problemDescription" className="text-sm font-semibold flex items-center gap-1.5">
                    Problem Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="problemDescription"
                    placeholder="Describe the reported issue in detail..."
                    required
                    value={formData.problemDescription}
                    onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                    className="min-h-[100px] rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="comments" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Comments (Optional)</Label>
                    <Textarea
                      id="comments"
                      placeholder="Any additional notes or instructions for the technician..."
                      value={formData.comments}
                      onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                      className="min-h-[90px] rounded-xl border-muted-foreground/20 focus-visible:ring-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Paperclip className="w-3.5 h-3.5" />
                      Attachments (Optional)
                    </Label>
                    <div className="border border-dashed border-muted-foreground/25 hover:border-primary/50 transition-all rounded-xl p-4 flex flex-col items-center justify-center min-h-[90px] bg-muted/5 relative cursor-pointer group">
                      <Input
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files ?? []);
                          const validFiles = files.filter(f => {
                            if (f.size > 100 * 1024 * 1024) {
                              toast({ title: "File too large", description: `${f.name} exceeds 100MB limit.`, variant: "destructive" });
                              return false;
                            }
                            return true;
                          });
                          setAttachmentFiles(prev => [...prev, ...validFiles]);
                          e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center justify-center text-center pointer-events-none space-y-1">
                        <Paperclip className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                          Click to select attachments
                        </span>
                        <span className="text-[10px] text-muted-foreground">Photos, PDFs, docs up to 100MB</span>
                      </div>
                    </div>
                    {attachmentFiles.length > 0 ? (
                      <div className="flex flex-col gap-2 mt-2">
                        <div className="flex items-center gap-2 text-xs text-primary font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {attachmentFiles.length} file(s) selected {attachmentUploading ? `(uploading ${uploadProgress.current}/${uploadProgress.total}...)` : ""}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {attachmentFiles.map((file, idx) => (
                            <Badge key={idx} variant="secondary" className="gap-1 bg-muted/50 border border-muted-foreground/20 px-2 py-1 flex items-center">
                              <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setAttachmentFiles(prev => prev.filter((_, i) => i !== idx))}
                                className="ml-1 hover:text-destructive text-muted-foreground flex-shrink-0"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SIDE-BY-SIDE CHECKLIST & CATEGORIES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 4: Checklist */}
              <Card className="shadow-md border border-muted/40">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Repair Checklist</CardTitle>
                      <CardDescription>Select checklist items or add custom tasks</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search checklist items..."
                        value={checklistSearch}
                        onChange={(e) => setChecklistSearch(e.target.value)}
                        className="rounded-xl h-10 pl-9 border-muted-foreground/20"
                      />
                    </div>
                    <Dialog open={isChecklistDialogOpen} onOpenChange={setIsChecklistDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          className="rounded-xl h-10 px-4"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="ml-2 hidden sm:inline">New</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Checklist Item</DialogTitle>
                          <DialogDescription>Create a new item for the repair checklist.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Item Description</Label>
                            <Input
                              placeholder="e.g. Brake fluid level"
                              value={newChecklistItem}
                              onChange={(e) => setNewChecklistItem(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void handleAddChecklistItem().then(() => setIsChecklistDialogOpen(false));
                                }
                              }}
                            />
                          </div>
                          <Button 
                            type="button" 
                            onClick={() => void handleAddChecklistItem().then(() => setIsChecklistDialogOpen(false))} 
                            disabled={addingChecklist || !newChecklistItem.trim()}
                            className="w-full"
                          >
                            {addingChecklist && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Add Item
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <ScrollArea className="h-[220px] pr-2 border rounded-xl p-2 bg-muted/5">
                    <div className="space-y-2">
                      {filteredChecklistTemplates.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic text-center py-10">
                          No checklist items found.
                        </p>
                      ) : (
                        filteredChecklistTemplates.map((t) => (
                          <label
                            key={t.id}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors",
                              selectedChecklist.includes(t.description)
                                ? "bg-primary/5 border-primary/40"
                                : "hover:bg-muted/30 border-transparent bg-transparent"
                            )}
                          >
                            <Checkbox
                              checked={selectedChecklist.includes(t.description)}
                              onCheckedChange={() => toggleChecklist(t.description)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold leading-tight text-foreground truncate">{t.description}</div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </ScrollArea>

                  {selectedChecklist.length > 0 ? (
                    <div className="pt-1">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5">Selected Items</div>
                      <div className="flex flex-wrap gap-1">
                        {selectedChecklist.map((item) => (
                          <Badge key={item} variant="secondary" className="gap-1 text-[10px] bg-primary/10 text-primary border-none rounded-md px-2 py-0.5">
                            {item}
                            <button
                              type="button"
                              className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => toggleChecklist(item)}
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Card 5: Categories */}
              <Card className="shadow-md border border-muted/40">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Repair Categories</CardTitle>
                      <CardDescription>Associate job categories or define a new one</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search categories..."
                        value={categorySearch}
                        onChange={(e) => setCategorySearch(e.target.value)}
                        className="rounded-xl h-10 pl-9 border-muted-foreground/20"
                      />
                    </div>
                    <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button 
                          type="button" 
                          className="rounded-xl h-10 px-4"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="ml-2 hidden sm:inline">New</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Repair Category</DialogTitle>
                          <DialogDescription>Create a new category for repairs.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Category Name</Label>
                            <Input
                              placeholder="e.g. Engine Repair"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  void handleAddCategory().then(() => setIsCategoryDialogOpen(false));
                                }
                              }}
                            />
                          </div>
                          <Button 
                            type="button" 
                            onClick={() => void handleAddCategory().then(() => setIsCategoryDialogOpen(false))} 
                            disabled={addingCategory || !newCategoryName.trim()}
                            className="w-full"
                          >
                            {addingCategory && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                            Add Category
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <ScrollArea className="h-[220px] pr-2 border rounded-xl p-2 bg-muted/5">
                    <div className="space-y-2">
                      {filteredCategories.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic text-center py-10">
                          No categories found.
                        </p>
                      ) : (
                        filteredCategories.map((c) => (
                          <label
                            key={c.id}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors",
                              selectedCategories.includes(c.name)
                                ? "bg-primary/5 border-primary/40"
                                : "hover:bg-muted/30 border-transparent bg-transparent"
                            )}
                          >
                            <Checkbox
                              checked={selectedCategories.includes(c.name)}
                              onCheckedChange={() => toggleCategory(c.name)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold leading-tight text-foreground truncate">{c.name}</div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="shadow-md border-none bg-primary text-white">
              <CardHeader>
                <CardTitle className="text-white">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-white/70">Vehicle</span>
                  <span className="font-bold text-right max-w-[220px] truncate" title={vehicleLabel || undefined}>
                    {vehicleLabel || "Not Selected"}
                  </span>
                </div>
                {selectedVehicle && (
                  <div className="flex justify-between text-sm gap-3">
                    <span className="text-white/70">Owner</span>
                    <span className="font-bold text-right max-w-[220px] truncate">
                      {ownerLabel}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Priority</span>
                  <Badge className="bg-accent text-primary border-none">{formData.priority}</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Mileage</span>
                  <span className="font-bold">
                    {formData.mileage ? `${formData.mileage} km` : "Not Set"}
                  </span>
                </div>
                <div className="flex justify-between text-sm gap-3">
                  <span className="text-white/70">Expected</span>
                  <span className="font-bold text-right max-w-[220px] truncate" title={expectedDisplay || undefined}>
                    {expectedDisplay || "Not Set"}
                  </span>
                </div>
                <Separator className="bg-white/10" />
                <div className="space-y-2">
                  <span className="text-xs text-white/70 uppercase tracking-wider font-bold">Categories</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCategories.length > 0 ? (
                      selectedCategories.map((cat) => (
                        <Badge
                          key={cat}
                          variant="secondary"
                          className="bg-white/10 text-white hover:bg-white/20 border-none"
                        >
                          {cat}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-xs italic text-white/50">None selected</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <span className="text-xs text-white/70 uppercase tracking-wider font-bold">Checklist</span>
                  <div className="text-sm">
                    {selectedChecklist.length > 0 ? (
                      <span className="font-bold">{selectedChecklist.length} items selected</span>
                    ) : (
                      <span className="text-white/60 italic">No checklist items selected</span>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-accent text-primary hover:bg-accent/90 border-none font-bold py-6 text-lg"
                >
                  {submitting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    "Create Order"
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card className="shadow-sm border-dashed border-2">
              <CardContent className="p-6">
                <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                  Next Steps
                </h4>
                <ul className="text-xs text-muted-foreground space-y-3">
                  <li className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold">1</div>
                    <span>Workshop officer will assign this vehicle to a bay upon arrival.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold">2</div>
                    <span>Initial vehicle check will be performed to confirm actual repair time.</span>
                  </li>
                  <li className="flex gap-2">
                    <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center shrink-0 text-[10px] font-bold">3</div>
                    <span>Status will transition to "In Progress" once assigned.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}
