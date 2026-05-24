"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Save,
  User,
  Filter,
  CheckCircle,
  XCircle,
  Hash,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchCustomers, 
  createCustomer, 
  updateCustomer, 
  deleteCustomer,
  fetchRoutes,
  RouteModel
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type CustomerRow = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  nic: string | null;
  tax_number: string | null;
  order_type: "Internal" | "External";
  credit_limit: number;
  credit_days: number;
  is_active: number;
  photo_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  qr_code_hash?: string | null;
  route_id?: number | null;
  created_at?: string;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routesList, setRoutesList] = useState<RouteModel[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const { toast } = useToast();

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
    route_id: "" as string,
    latitude: "" as string,
    longitude: "" as string,
  });

  useEffect(() => {
    fetchRoutes().then(data => {
      if(Array.isArray(data)) setRoutesList(data);
    }).catch(console.error);
    loadCustomers();
  }, []);

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
      toast({ title: "Location Error", description: "Geolocation is not supported by this browser.", variant: "destructive" });
    }
  };

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchCustomers();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (customer: CustomerRow | null = null) => {
    if (customer) {
      setCurrentCustomer(customer);
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
        route_id: customer.route_id ? String(customer.route_id) : "",
        latitude: customer.latitude ? String(customer.latitude) : "",
        longitude: customer.longitude ? String(customer.longitude) : "",
      });
      setSelectedPhoto(null);
    } else {
      setCurrentCustomer(null);
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        nic: "",
        tax_number: "",
        order_type: "External",
        credit_limit: 0,
        credit_days: 0,
        is_active: 1,
        route_id: "",
        latitude: "",
        longitude: "",
      });
      setSelectedPhoto(null);
    }
    setIsModalOpen(true);
    if (!customer || !customer.latitude || !customer.longitude) {
      handleGetLocation();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: "Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      toast({
        title: "Error",
        description: "Coordinates are required to save a customer. Please wait for location to be fetched or enter manually.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const dataToSubmit = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        dataToSubmit.append(key, String(value));
      });
      if (selectedPhoto) {
        dataToSubmit.append("photo", selectedPhoto);
      }

      if (currentCustomer) {
        await updateCustomer(String(currentCustomer.id), dataToSubmit);
        toast({ title: "Success", description: "Customer updated successfully" });
      } else {
        await createCustomer(dataToSubmit);
        toast({ title: "Success", description: "Customer created successfully" });
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save customer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!currentCustomer) return;
    setIsSubmitting(true);
    try {
      await deleteCustomer(String(currentCustomer.id));
      toast({ title: "Success", description: "Customer deleted successfully" });
      setIsDeleteModalOpen(false);
      loadCustomers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.nic && c.nic.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Customers</h2>
            <p className="text-muted-foreground">Manage your customer database and profiles.</p>
          </div>
          <Button onClick={() => handleOpenModal()} className="sm:w-fit">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, email, or NIC..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Clear
          </Button>
        </div>

        <div className="border rounded-xl bg-card overflow-hidden shadow-sm">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="py-4">Customer Info</TableHead>
                <TableHead>Contact Details</TableHead>
                <TableHead>National/Tax ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Credit Terms</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading customers...
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No customers found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{customer.name}</span>
                        {customer.address && (
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3 mr-1 shrink-0" />
                            <span className="truncate max-w-[200px]">{customer.address}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {customer.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                            {customer.phone}
                          </div>
                        )}
                        {customer.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="w-3 h-3 mr-2 text-muted-foreground" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {customer.nic && (
                          <div className="flex items-center text-xs">
                            <Badge variant="outline" className="font-normal">NIC: {customer.nic}</Badge>
                          </div>
                        )}
                        {customer.tax_number && (
                          <div className="flex items-center text-xs">
                             <Badge variant="outline" className="font-normal">Tax: {customer.tax_number}</Badge>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={customer.order_type === "Internal" ? "secondary" : "default"}>
                        {customer.order_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="font-medium text-amber-600">Limit: {Number(customer.credit_limit).toLocaleString()}</span>
                        <span className="text-muted-foreground">Days: {customer.credit_days}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {customer.is_active ? (
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                        <span className="text-sm font-medium">
                          {customer.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2 text-primary">
                        <Link href={`/cms/customers/${customer.id}/profile`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => handleOpenModal(customer)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            setCurrentCustomer(customer);
                            setIsDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{currentCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {currentCustomer ? "Update customer profile information." : "Create a new customer profile in your database."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name">Customer Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="name"
                    className="pl-9"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Full name or Company name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    className="pl-9"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    className="pl-9"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="address">Service/Billing Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <textarea
                    id="address"
                    className="w-full pl-9 min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nic">NIC Number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="nic"
                    className="pl-9"
                    value={formData.nic}
                    onChange={(e) => setFormData({ ...formData, nic: e.target.value })}
                    placeholder="National Identity Card #"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_number">Tax Number (VAT/SVAT)</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="tax_number"
                    className="pl-9"
                    value={formData.tax_number}
                    onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                  />
                </div>
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
                    <SelectItem value="Internal">Internal (Company)</SelectItem>
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
                    <SelectItem value="">None</SelectItem>
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
                {!selectedPhoto && currentCustomer?.photo_url && (
                  <p className="text-xs text-muted-foreground">Current photo uploaded.</p>
                )}
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Coordinates *</Label>
                <div className="flex gap-2 items-center">
                  <Input 
                    placeholder="Latitude" 
                    value={formData.latitude} 
                    readOnly
                    className="bg-muted"
                  />
                  <Input 
                    placeholder="Longitude" 
                    value={formData.longitude} 
                    readOnly
                    className="bg-muted"
                  />
                  {isFetchingLocation && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Fetching...
                    </span>
                  )}
                </div>
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

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? "Saving..." : "Save Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-rose-600">Delete Customer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{currentCustomer?.name}</strong>? This action will permanently remove their profile entry from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
