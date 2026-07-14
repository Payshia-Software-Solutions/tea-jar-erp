"use client";

import React, { useState, useEffect, Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Save,
  Loader2,
  ArrowLeft,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  fetchCustomers, 
  createCustomer, 
  updateCustomer, 
  fetchRoutes,
  RouteModel
} from "@/lib/api";

function CustomerFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routesList, setRoutesList] = useState<RouteModel[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    nic: "",
    tax_number: "",
    order_type: "External" as "Internal" | "External",
    credit_limit: 0,
    credit_days: 0,
    is_active: 1,
    route_id: "none" as string,
    latitude: "" as string,
    longitude: "" as string,
  });

  useEffect(() => {
    fetchRoutes().then(data => {
      if(Array.isArray(data)) setRoutesList(data);
    }).catch(console.error);

    if (id) {
      loadCustomer(id);
    } else {
      handleGetLocation();
    }
  }, [id]);

  const loadCustomer = async (customerId: string) => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      if (Array.isArray(data)) {
        const customer = data.find(c => c.id.toString() === customerId);
        if (customer) {
          setFormData({
            name: customer.name,
            phone: customer.phone || "",
            email: customer.email || "",
            address: customer.address || "",
            nic: customer.nic || "",
            tax_number: customer.tax_number || "",
            order_type: customer.order_type,
            credit_limit: customer.credit_limit || 0,
            credit_days: customer.credit_days || 0,
            is_active: customer.is_active,
            route_id: customer.route_id ? String(customer.route_id) : "none",
            latitude: customer.latitude ? String(customer.latitude) : "",
            longitude: customer.longitude ? String(customer.longitude) : "",
          });
          setCurrentPhotoUrl(customer.photo_url || null);
          if (!customer.latitude || !customer.longitude) {
            handleGetLocation();
          }
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load customer details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGetLocation = () => {
    setIsFetchingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          setIsFetchingLocation(false);
          toast({ title: "Location Captured", description: "Coordinates updated successfully." });
        },
        (error) => {
          setIsFetchingLocation(false);
          toast({ title: "Location Error", description: error.message, variant: "destructive" });
        }
      );
    } else {
      setIsFetchingLocation(false);
      toast({ title: "Location Error", description: "Geolocation is not supported.", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({ title: "Error", description: "Customer name is required", variant: "destructive" });
      return;
    }


    setIsSubmitting(true);
    try {
      const dataToSubmit = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (key === "route_id" && value === "none") {
          dataToSubmit.append(key, "");
        } else {
          dataToSubmit.append(key, String(value));
        }
      });
      if (selectedPhoto) {
        dataToSubmit.append("photo", selectedPhoto);
      }

      if (id) {
        await updateCustomer(id, dataToSubmit);
        toast({ title: "Success", description: "Customer updated successfully" });
      } else {
        await createCustomer(dataToSubmit);
        toast({ title: "Success", description: "Customer created successfully" });
      }
      router.push("/cms/customers");
    } catch (error) {
      toast({ title: "Error", description: "Failed to save customer", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/cms/customers")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{id ? "Edit Customer" : "Add New Customer"}</h1>
            <p className="text-muted-foreground">
              {id ? "Update customer profile information." : "Enter details to create a new customer profile."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-card border rounded-xl shadow-sm p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="name">Customer Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Acme Corp"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +94 77 123 4567"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. contact@acme.com"
              />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label htmlFor="address">Service/Billing Address</Label>
              <textarea
                id="address"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address details"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nic">NIC Number</Label>
              <Input
                id="nic"
                value={formData.nic}
                onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tax_number">Tax Number (VAT/SVAT)</Label>
              <Input
                id="tax_number"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="order_type">Customer Category</Label>
              <Select
                value={formData.order_type}
                onValueChange={(v: "Internal" | "External") => setFormData({ ...formData, order_type: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="External">External Customer</SelectItem>
                  <SelectItem value="Internal">Internal (Company Owned)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit_limit">Credit Limit</Label>
              <Input
                id="credit_limit"
                type="number"
                step="0.01"
                value={formData.credit_limit}
                onChange={(e) => setFormData({ ...formData, credit_limit: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit_days">Credit Days</Label>
              <Input
                id="credit_days"
                type="number"
                value={formData.credit_days}
                onChange={(e) => setFormData({ ...formData, credit_days: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="route_id">Delivery Route</Label>
              <Select
                value={formData.route_id}
                onValueChange={(v: string) => setFormData({ ...formData, route_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select route" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {routesList.map(route => (
                    <SelectItem key={route.id} value={String(route.id)}>{route.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Photo Upload</Label>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedPhoto(e.target.files[0]);
                  }
                }} 
              />
              {selectedPhoto && <p className="text-xs text-muted-foreground">{selectedPhoto.name}</p>}
              {!selectedPhoto && currentPhotoUrl && (
                <p className="text-xs text-muted-foreground">Current photo uploaded.</p>
              )}
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <div className="flex justify-between items-center">
                <Label>Coordinates (Optional)</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleGetLocation} disabled={isFetchingLocation}>
                  <MapPin className="w-4 h-4 mr-2" />
                  Get Location
                </Button>
              </div>
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Latitude" 
                    value={formData.latitude} 
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="bg-muted pl-8"
                  />
                </div>
                <div className="relative flex-1">
                  <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Longitude" 
                    value={formData.longitude} 
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="bg-muted pl-8"
                  />
                </div>
                {isFetchingLocation && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1 min-w-[80px]">
                    <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                  </span>
                )}
              </div>
              {formData.latitude && formData.longitude && !isFetchingLocation && (
                <div className="mt-2">
                  <a
                    href={`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <MapPin className="w-4 h-4 mr-1" />
                    View Location in Google Maps
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <Select
                value={String(formData.is_active)}
                onValueChange={(v) => setFormData({ ...formData, is_active: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Active</SelectItem>
                  <SelectItem value="0">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => router.push("/cms/customers")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" /> Save Customer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default function CustomerFormPage() {
  return (
    <Suspense fallback={<DashboardLayout><div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin" /></div></DashboardLayout>}>
      <CustomerFormContent />
    </Suspense>
  );
}
