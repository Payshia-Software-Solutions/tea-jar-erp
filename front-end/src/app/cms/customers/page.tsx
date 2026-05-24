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
  Eye,
  Loader2
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
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [routesList, setRoutesList] = useState<RouteModel[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);
  const { toast } = useToast();

  

  useEffect(() => {
    fetchRoutes().then(data => {
      if(Array.isArray(data)) setRoutesList(data);
    }).catch(console.error);
    loadCustomers();
  }, []);

  
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
          <Link href="/cms/customers/form">
            <Button className="sm:w-fit">
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          </Link>
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
                            <span className="truncate max-w-[200px]" title={customer.address}>{customer.address}</span>
                          </div>
                        )}
                        {customer.latitude && customer.longitude && (
                          <a 
                            href={`https://www.google.com/maps?q=${customer.latitude},${customer.longitude}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 w-fit"
                          >
                            <MapPin className="w-3 h-3 mr-1 shrink-0" />
                            View on Map
                          </a>
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
                        <Link href={`/cms/customers/form?id=${customer.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
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
