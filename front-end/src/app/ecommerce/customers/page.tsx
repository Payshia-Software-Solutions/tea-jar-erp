"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import {
  Search,
  Mail,
  Phone,
  MapPin,
  User,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  ShoppingBag,
  Globe
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
import { useToast } from "@/hooks/use-toast";
import { 
  fetchEcommerceCustomers
} from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

type EcommerceCustomerRow = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  is_active: number;
  total_store_orders: number;
  last_login?: string;
  created_at: string;
};

export default function EcommerceCustomersPage() {
  const [customers, setCustomers] = useState<EcommerceCustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const data = await fetchEcommerceCustomers();
      if (Array.isArray(data)) {
        setCustomers(data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load storefront customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery)) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout title="Storefront Customers">
      <div className="flex flex-col gap-6 w-full pb-20 animate-in fade-in duration-500">
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>E-commerce</span>
            <span className="opacity-20">/</span>
            <span className="text-foreground">Storefront Customers</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">Storefront Customers</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1.5 py-1 px-3">
              <Globe className="w-3 h-3" />
              Online Users
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-3xl">View and manage customers who have registered or placed orders through your public storefront.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or email..."
              className="pl-9 h-11 border-muted-foreground/20"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setSearchQuery("")} className="h-11">
              <Filter className="w-4 h-4 mr-2" />
              Reset Filters
            </Button>
            <Button onClick={loadCustomers} variant="secondary" className="h-11">
              Refresh Data
            </Button>
          </div>
        </div>

        <Card className="border shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b">
             <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Customer Directory
             </CardTitle>
             <CardDescription>A total of {customers.length} registered storefront users.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/20">
                <TableRow>
                  <TableHead className="py-4 font-bold">User Information</TableHead>
                  <TableHead className="font-bold">Contact Details</TableHead>
                  <TableHead className="font-bold">Store Activity</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="font-bold">Registered</TableHead>
                  <TableHead className="text-right font-bold pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                       <div className="flex flex-col items-center gap-2">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Loading storefront users...</span>
                       </div>
                    </TableCell>
                  </TableRow>
                ) : filteredCustomers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No storefront customers found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                              {customer.name.charAt(0).toUpperCase()}
                           </div>
                           <div className="flex flex-col">
                             <span className="font-bold text-foreground group-hover:text-primary transition-colors">{customer.name}</span>
                             {customer.address && (
                               <div className="flex items-center text-[10px] text-muted-foreground mt-0.5">
                                 <MapPin className="w-2.5 h-2.5 mr-1 shrink-0" />
                                 <span className="truncate max-w-[150px]">{customer.address}</span>
                               </div>
                             )}
                           </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {customer.phone && (
                            <div className="flex items-center text-xs">
                              <Phone className="w-3 h-3 mr-2 text-muted-foreground" />
                              {customer.phone}
                            </div>
                          )}
                          {customer.email && (
                            <div className="flex items-center text-xs">
                              <Mail className="w-3 h-3 mr-2 text-muted-foreground" />
                              {customer.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                           <Badge variant="secondary" className="w-fit font-bold gap-1.5 py-0.5">
                              <ShoppingBag className="w-3 h-3" />
                              {customer.total_store_orders} Orders
                           </Badge>
                           <span className="text-[10px] text-muted-foreground pl-1">
                              Last Login: {customer.last_login ? new Date(customer.last_login).toLocaleDateString() : 'Never'}
                           </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {customer.is_active ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                               Active
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-100">
                               <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                               Suspended
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                         <span className="text-xs text-muted-foreground">
                            {new Date(customer.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                         </span>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/cms/customers/${customer.id}/profile`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 gap-2 font-bold text-[10px] uppercase tracking-wider"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View Profile
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
