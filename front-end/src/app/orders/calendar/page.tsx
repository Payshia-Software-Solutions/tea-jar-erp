"use client"

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/dashboard-layout';
import { fetchOrders } from '@/lib/api';
import { RepairOrder } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { rescheduleOrder } from '@/lib/api';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Loader2,
  Clock,
  Car,
  Pencil
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

export default function ServiceCalendarPage() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [rescheduleDialogOrder, setRescheduleDialogOrder] = useState<RepairOrder | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduling, setRescheduling] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const ordersData = await fetchOrders();
      setOrders(ordersData.filter(o => o.job_type === 'Service Booking' && o.booking_date));
    } catch (error) {
      console.error("Failed to load orders for calendar", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openReschedule = (order: RepairOrder, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setRescheduleDialogOrder(order);
    setRescheduleDate(order.booking_date ? order.booking_date.split(" ")[0] : "");
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleDialogOrder || !rescheduleDate) return;
    setRescheduling(true);
    try {
      await rescheduleOrder(rescheduleDialogOrder.id, rescheduleDate);
      toast({ title: "Success", description: "Booking rescheduled successfully." });
      setRescheduleDialogOrder(null);
      loadData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to reschedule booking.", variant: "destructive" });
    } finally {
      setRescheduling(false);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const today = () => setCurrentDate(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const getBookingsForDay = (date: Date) => {
    return orders.filter(o => o.booking_date && isSameDay(new Date(o.booking_date), date));
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Service Calendar</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">View scheduled service bookings</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/orders/new">
            <Button className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      <Card className="shadow-md border-none overflow-hidden">
        <CardHeader className="bg-primary/[0.03] border-b pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold">{format(currentDate, 'MMMM yyyy')}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={today}>Today</Button>
              <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-7 border-b">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0">
                  {day}
                </div>
              ))}
              
              {days.map((day, i) => {
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const dayBookings = getBookingsForDay(day);
                
                return (
                  <div 
                    key={day.toISOString()} 
                    className={`min-h-[120px] p-2 border-r border-t last:border-r-0 ${!isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : ''} ${isToday ? 'bg-primary/5' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-semibold ${isToday ? 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {dayBookings.length > 0 && (
                        <Badge variant="secondary" className="text-[10px]">
                          {dayBookings.length}
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      {dayBookings.map(b => {
                        const statusStyles: any = {
                          'Pending': 'bg-amber-50/60 text-amber-900 border-amber-200 border-l-[3px] border-l-amber-500 hover:bg-amber-100',
                          'In Progress': 'bg-blue-50/60 text-blue-900 border-blue-200 border-l-[3px] border-l-blue-500 hover:bg-blue-100',
                          'Completed': 'bg-emerald-50/60 text-emerald-900 border-emerald-200 border-l-[3px] border-l-emerald-500 hover:bg-emerald-100',
                          'Cancelled': 'bg-slate-50/60 text-slate-900 border-slate-200 border-l-[3px] border-l-slate-400 hover:bg-slate-100'
                        };
                        const colorClass = statusStyles[b.status || 'Pending'] || statusStyles['Pending'];

                        return (
                          <Link key={b.id} href={`/orders/${b.id}`}>
                            <div className={`text-[11px] p-1.5 rounded border transition-colors mb-1 cursor-pointer overflow-hidden ${colorClass} group`}>
                              <div className="flex justify-between items-start gap-1">
                                <div className="font-bold truncate">{b.vehicleNumber || b.vehicleId}</div>
                                <div className="flex items-center gap-1">
                                  <div className="text-[9px] font-semibold uppercase tracking-wider opacity-80 shrink-0">{b.status || 'Pending'}</div>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity" 
                                    onClick={(e) => openReschedule(b, e)}
                                    title="Reschedule"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="truncate opacity-80 mt-0.5">{b.problemDescription || "Service Booking"}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rescheduleDialogOrder} onOpenChange={(open) => !open && setRescheduleDialogOrder(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Reschedule Booking</DialogTitle>
            <DialogDescription>
              Change the scheduled booking date for {rescheduleDialogOrder?.vehicleNumber || rescheduleDialogOrder?.vehicleId}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reschedule-date">New Booking Date</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRescheduleDialogOrder(null)}>Cancel</Button>
            <Button onClick={handleSaveReschedule} disabled={rescheduling}>
              {rescheduling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
