"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { Loader2, Calendar as CalendarIcon, Clock, User, Hash, Search, Eye, FilterX } from "lucide-react";
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

interface KioskBooking {
  id: number;
  booking_no: string;
  room_number: string;
  guest_name: string;
  experience_name: string;
  pax_count: number;
  preferred_date_time: string | null;
  total_amount: number;
  status: string;
  notes: string;
  created_at: string;
}

export default function KioskBookingsPage() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<KioskBooking[]>([]);
  const [loading, setLoading] = useState(true);

  // New states for search, filter, pagination, and view modal
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  
  const [selectedBooking, setSelectedBooking] = useState<KioskBooking | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api('/api/kiosk/bookings');
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load bookings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await api(`/api/kiosk/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast({ title: "Success", description: "Status updated" });
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
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
      case 'Confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Filter and pagination logic
  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.booking_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.room_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = dateFilter
      ? new Date(b.created_at).toISOString().split('T')[0] === dateFilter
      : true;

    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filteredBookings.length / pageSize);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFilter]);

  const openViewModal = (booking: KioskBooking) => {
    setSelectedBooking(booking);
    setIsViewModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Experience Bookings</h1>
            <p className="text-muted-foreground mt-1">Manage guest experience bookings from the room kiosks</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search bookings..."
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
          ) : bookings.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No bookings found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                <TableRow>
                  <TableHead>Booking Details</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Preferred Time</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-2">
                        <Hash className="w-3 h-3 text-muted-foreground" />
                        {b.booking_no}
                      </div>
                      <div className="text-sm mt-1 flex items-center gap-2">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {b.guest_name} (Room {b.room_number})
                      </div>
                      {b.notes && (
                        <div className="text-xs text-muted-foreground mt-1 bg-muted p-1 rounded border">
                          Notes: {b.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{b.experience_name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {b.pax_count} Pax • Rs. {Number(b.total_amount).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.preferred_date_time ? (
                        <div className="flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {format(new Date(b.preferred_date_time), 'MMM dd, yyyy')}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(b.preferred_date_time), 'hh:mm a')}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Not specified</span>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">
                        Booked: {format(new Date(b.created_at), 'MMM dd, HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 w-32">
                        <Badge className={`justify-center ${getStatusColor(b.status)}`} variant="outline">
                          {b.status}
                        </Badge>
                        <div className="flex gap-2">
                          <Select value={b.status} onValueChange={(val) => updateStatus(b.id, val)}>
                            <SelectTrigger className="h-8 text-xs flex-1">
                              <SelectValue placeholder="Change Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Confirmed">Confirmed</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openViewModal(b)}
                            title="View Booking Details"
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
                totalItems={filteredBookings.length}
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
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Booking Ref</span>
                  <div className="font-semibold text-base">{selectedBooking.booking_no}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Status</span>
                  <div className="mt-1">
                    <Badge variant="outline" className={getStatusColor(selectedBooking.status)}>
                      {selectedBooking.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Guest Name</span>
                  <div className="font-medium">{selectedBooking.guest_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Room</span>
                  <div className="font-medium">{selectedBooking.room_number}</div>
                </div>
                <div className="col-span-2 border-t pt-3">
                  <span className="text-muted-foreground">Experience</span>
                  <div className="font-medium text-base">{selectedBooking.experience_name}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Number of Guests</span>
                  <div className="font-medium">{selectedBooking.pax_count} Pax</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Amount</span>
                  <div className="font-bold text-base">Rs. {Number(selectedBooking.total_amount).toLocaleString()}</div>
                </div>
                <div className="col-span-2 border-t pt-3">
                  <span className="text-muted-foreground">Preferred Time</span>
                  <div className="font-medium">
                    {selectedBooking.preferred_date_time 
                      ? format(new Date(selectedBooking.preferred_date_time), 'PPp') 
                      : 'Not specified'}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Booked On</span>
                  <div className="font-medium">{format(new Date(selectedBooking.created_at), 'PPp')}</div>
                </div>
              </div>

              {selectedBooking.notes && (
                <div className="text-sm bg-muted p-3 rounded-lg border">
                  <span className="font-semibold block mb-1">Guest Notes:</span>
                  {selectedBooking.notes}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
