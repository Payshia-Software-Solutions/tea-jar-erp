"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Loader2, Hash, User, Phone, Search, Eye, FilterX } from "lucide-react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface KioskOrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: string;
  product_name: string;
}

interface KioskOrder {
  id: number;
  order_no: string;
  room_number: string;
  guest_name: string;
  phone_number: string | null;
  special_instructions: string | null;
  total_amount: string;
  status: string;
  created_at: string;
  items: KioskOrderItem[];
}

export default function KioskOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<KioskOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // New states for search, filter, pagination, and view modal
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [selectedOrder, setSelectedOrder] = useState<KioskOrder | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await api('/api/kiosk/orders');
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await api(`/api/kiosk/orders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Status updated" });
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      } else {
        throw new Error("Update failed");
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
      case 'Preparing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'Delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Filter and pagination logic
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.room_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = dateFilter
      ? new Date(o.created_at).toISOString().split('T')[0] === dateFilter
      : true;

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter]);

  const openViewModal = (order: KioskOrder) => {
    setSelectedOrder(order);
    setIsViewModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Order Requests</h1>
            <p className="text-muted-foreground mt-1">Manage room service orders from the kiosks</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search orders..."
                className="pl-9 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="relative">
              <Input
                type="date"
                className="h-10 w-full md:w-[150px]"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
            {(searchQuery || dateFilter) && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => {
                  setSearchQuery("");
                  setDateFilter("");
                }}
                title="Clear Filters"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No orders found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order Details</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="align-top">
                        <div className="font-medium flex items-center gap-2">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          {o.order_no}
                        </div>
                        <div className="text-sm mt-1 flex items-center gap-2">
                          <User className="w-3 h-3 text-muted-foreground" />
                          {o.guest_name} (Room {o.room_number})
                        </div>
                        {o.phone_number && (
                          <div className="text-sm mt-1 flex items-center gap-2 text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            {o.phone_number}
                          </div>
                        )}
                        {o.special_instructions && (
                          <div className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded border">
                            <strong>Notes:</strong> {o.special_instructions}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-2">
                          {new Date(o.created_at).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="space-y-1">
                          {o.items?.map(item => (
                            <div key={item.id} className="text-sm">
                              {item.quantity}x {item.product_name} <span className="text-muted-foreground text-xs ml-1">(Rs. {Number(item.price).toLocaleString()})</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t font-semibold text-sm">
                          Total: Rs. {Number(o.total_amount).toLocaleString()}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <div className="flex flex-col gap-3 items-start">
                          <Badge variant="outline" className={getStatusColor(o.status)}>
                            {o.status}
                          </Badge>
                          <div className="flex gap-2">
                            <Select 
                              defaultValue={o.status} 
                              onValueChange={(val) => updateStatus(o.id, val)}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder="Update Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Preparing">Preparing</SelectItem>
                                <SelectItem value="Delivered">Delivered</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => openViewModal(o)}
                              title="View Order Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <DataTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={filteredOrders.length}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </div>
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Order Reference</span>
                  <div className="font-semibold text-base">{selectedOrder.order_no}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <div className="mt-1">
                    <Badge variant="outline" className={getStatusColor(selectedOrder.status)}>
                      {selectedOrder.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Guest Name</span>
                  <div className="font-medium">{selectedOrder.guest_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Room</span>
                  <div className="font-medium">{selectedOrder.room_number}</div>
                </div>
                {selectedOrder.phone_number && (
                  <div>
                    <span className="text-muted-foreground">Phone</span>
                    <div className="font-medium">{selectedOrder.phone_number}</div>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Placed On</span>
                  <div className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</div>
                </div>
              </div>

              {selectedOrder.special_instructions && (
                <div className="text-sm bg-muted p-3 rounded-lg border">
                  <span className="font-semibold block mb-1">Special Instructions:</span>
                  {selectedOrder.special_instructions}
                </div>
              )}

              <div className="border rounded-lg p-4 bg-muted/30">
                <h4 className="font-semibold mb-3 border-b pb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="bg-primary/10 text-primary font-medium px-2 py-0.5 rounded text-xs">
                          {item.quantity}x
                        </span>
                        <span>{item.product_name}</span>
                      </div>
                      <div className="font-medium text-muted-foreground">
                        Rs. {(Number(item.price) * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t flex justify-between items-center font-bold text-base">
                  <span>Total Amount</span>
                  <span>Rs. {Number(selectedOrder.total_amount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
