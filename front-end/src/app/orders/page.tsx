"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { assignOrder, fetchOrders, fetchBays, fetchTechnicians, updateOrder } from '@/lib/api';
// import { INITIAL_REPAIR_ORDERS, BAYS, TECHNICIANS, MOCK_USER } from '@/lib/mock-data';

import { RepairOrder, Priority, RepairStatus, BayLocation, UserRole } from '@/lib/types';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Filter, 
  MoreHorizontal, 
  ArrowUpDown, 
  Clock, 
  Wrench, 
  CheckCircle2, 
  ChevronRight,
  ExternalLink,
  UserPlus,
  MapPin,
  Car,

  Trash2,
  Loader2
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format, isValid } from 'date-fns';
import { StandaloneDatePicker } from '@/components/ui/standalone-date-picker';
import { AnalogTimePicker } from '@/components/ui/analog-time-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const priorityColors: Record<Priority, string> = {
  'Emergency': 'bg-red-500 dark:bg-red-600',
  'High': 'bg-orange-500 dark:bg-orange-600',
  'Medium': 'bg-blue-500 dark:bg-blue-600',
  'Low': 'bg-slate-400 dark:bg-slate-600'
};

const statusColors: Record<RepairStatus, string> = {
  'Pending': 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  'In Progress': 'bg-blue-100 text-primary dark:bg-blue-900/30 dark:text-blue-400',
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};

export default function OrderQueuePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [baysList, setBaysList] = useState<{id: number, name: string}[]>([]);
  const [techsList, setTechsList] = useState<{id: number, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<RepairOrder | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('Admin');
  const [currentLocationName, setCurrentLocationName] = useState<string>('');
  const [assignStep, setAssignStep] = useState<'bay' | 'tech'>('bay');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load orders first (core screen), then try bays/techs independently.
        const ordersData = await fetchOrders();
        setOrders(ordersData);

        try {
          const baysData = await fetchBays();
          setBaysList(baysData as any);
        } catch (e) {
          setBaysList([]);
          toast({
            title: "Bays not available",
            description: (e as Error).message,
            variant: "destructive"
          });
        }

        try {
          const techsData = await fetchTechnicians();
          setTechsList(techsData as any);
        } catch (e) {
          setTechsList([]);
          toast({
            title: "Technicians not available",
            description: (e as Error).message,
            variant: "destructive"
          });
        }
      } catch (error) {
        toast({
          title: "Error loading data",
          description: (error as Error).message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Derive user role and current location from JWT (avoids any old/mock localStorage values).
    try {
      const token = window.localStorage.getItem('auth_token');
      const lsLocName = window.localStorage.getItem('location_name') || '';
      if (lsLocName) setCurrentLocationName(lsLocName);
      if (token) {
        const part = token.split('.')[1];
        const payload = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
        const role = String(payload?.role || 'Admin') as UserRole;
        setUserRole(role);
        const tokenLocName = String(payload?.location_name || '');
        if (!lsLocName && tokenLocName) setCurrentLocationName(tokenLocName);
      }
    } catch {
      // ignore
    }
  }, []);

  const [assignment, setAssignment] = useState({
    bay: '' as BayLocation,
    technician: '',
    proposedTime: '',
    releaseTime: ''
  });

  const techOptions = React.useMemo(() => {
    return (techsList ?? [])
      .map((t: any) => ({
        value: String(t?.name ?? ''),
        label: String(t?.name ?? ''),
        keywords: String(t?.role ?? ''),
      }))
      .filter((o) => o.value && o.label);
  }, [techsList]);

  const handleOpenAssign = (order: RepairOrder) => {
    setSelectedOrder(order);
    // Default release time to today + 2 hours if not set
    let initialRelease = order.releaseTime || '';
    if (!initialRelease) {
      const now = new Date();
      now.setHours(now.getHours() + 2); // suggest 2 hours from now
      now.setMinutes(0);
      initialRelease = format(now, "yyyy-MM-dd'T'HH:mm");
    }

    setAssignment({
      bay: order.location || '' as BayLocation,
      technician: order.technician || '',
      proposedTime: order.proposedTime || '',
      releaseTime: initialRelease
    });
    setAssignStep('bay');
    setIsAssignDialogOpen(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedOrder) return;

    try {
      const res = await assignOrder(String(selectedOrder.id), {
        bay_name: assignment.bay || undefined,
        technician: assignment.technician || undefined,
        release_time: assignment.releaseTime || null,
      });
      const d = (res as any)?.data ?? null;
      const nextLocation = d?.location ?? assignment.bay ?? '';
      const nextTech = d?.technician ?? assignment.technician ?? '';
      const nextStatus = d?.status ?? (nextLocation ? 'In Progress' : 'Pending');
      const nextRelease = d?.release_time ?? assignment.releaseTime ?? '';

      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                location: nextLocation,
                technician: nextTech,
                releaseTime: nextRelease,
                status: nextStatus as RepairStatus,
              }
            : o
        )
      );

      toast({
        title: "Vehicle Assigned",
        description: nextLocation ? `Assigned ${selectedOrder.vehicleId} to ${nextLocation}.` : `Assignment updated for ${selectedOrder.vehicleId}.`,
      });
      setIsAssignDialogOpen(false);
    } catch (error) {
      toast({
        title: "Assign failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleOpenComplete = (order: RepairOrder) => {
    router.push(`/orders/${order.id}`);
  };

  const handleCompleteSubmit = async () => {
    if (!selectedOrder) return;

    try {
      await updateOrder(String(selectedOrder.id), { status: 'Completed' });
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id
            ? {
                ...o,
                status: 'Completed' as RepairStatus,
                completedAt: new Date().toISOString(),
              }
            : o
        )
      );

      toast({
        title: "Repair Completed",
        description: `Job finished for ${selectedOrder.vehicleId}.`,
      });
      setIsCompleteDialogOpen(false);
    } catch (error) {
      toast({
        title: "Complete failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
    toast({
      title: "Order Deleted",
      description: `Order ${orderId} has been removed from the system.`,
      variant: "destructive"
    });
  };

  const pendingOrders = orders.filter((o) => o.status === "Pending");

  const sortedOrders = [...pendingOrders].sort((a, b) => {
    const priorityWeight = { 'Emergency': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return new Date(a.expectedTime).getTime() - new Date(b.expectedTime).getTime();
  });

  // Permission Checks
  const canAssign = userRole === 'Admin' || userRole === 'Workshop Officer';
  const canComplete = userRole === 'Admin' || userRole === 'Workshop Officer';
  const canDelete = userRole === 'Admin';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (

    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Workshop Order Queue</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage vehicle intake and shop flow</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-initial">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-initial">
            <ArrowUpDown className="w-4 h-4" />
            Sort
          </Button>
        </div>
      </div>

      {/* Desktop View */}
      <Card className="hidden md:block shadow-md border-none overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Expected By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/10 transition-colors">
                  <TableCell className="font-mono text-xs font-bold">
                    <Link href={`/orders/${order.id}`} className="hover:text-primary transition-colors">
                      {order.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold">{order.vehicleNumber || order.vehicleId}</span>
                      {order.vehicleNumber && order.vehicleId !== order.vehicleNumber && (
                        <span className="text-xs text-muted-foreground font-medium">{order.vehicleId}</span>
                      )}
                      <span className="text-xs text-muted-foreground">{Number(order.mileage ?? 0).toLocaleString()} km</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={order.problemDescription}>
                    {order.problemDescription}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${priorityColors[order.priority]} border-none text-white`}>
                      {order.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={`${statusColors[order.status]} font-semibold`}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.location ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium">
                          <MapPin className="w-3 h-3 text-primary" />
                          {order.location}
                        </div>
                        {order.technician && (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Wrench className="w-3 h-3" />
                            {order.technician}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs italic text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs font-medium whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      {format(new Date(order.expectedTime), 'MMM d, h:mm a')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Workshop Actions</DropdownMenuLabel>
                        {canAssign && (
                          <DropdownMenuItem onClick={() => handleOpenAssign(order)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign Bay/Tech
                          </DropdownMenuItem>
                        )}
                        {canComplete && (
                          <DropdownMenuItem onClick={() => handleOpenComplete(order)} disabled={order.status === 'Completed'}>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Complete Job
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-primary font-medium cursor-pointer"
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive font-medium cursor-pointer"
                              onClick={() => handleDeleteOrder(order.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Order
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {sortedOrders.map((order) => (
          <Card key={order.id} className="border-none shadow-sm overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] text-muted-foreground font-bold">{order.id}</span>
                <Badge variant="secondary" className={`${statusColors[order.status]} text-[10px]`}>
                  {order.status}
                </Badge>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{order.vehicleNumber || order.vehicleId}</h3>
                    {order.vehicleNumber && order.vehicleId !== order.vehicleNumber && (
                      <p className="text-xs text-muted-foreground font-medium">{order.vehicleId}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{Number(order.mileage ?? 0).toLocaleString()} km</p>
                  </div>
                </div>
                <Badge className={`${priorityColors[order.priority]} border-none text-white text-[10px]`}>
                  {order.priority}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                {order.problemDescription}
              </p>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium">{format(new Date(order.expectedTime), 'MMM d, h:mm a')}</span>
                </div>
                {order.location && (
                  <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {order.location}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {canAssign && (
                  <Button 
                    size="sm" 
                    className="flex-1 gap-2" 
                    onClick={() => handleOpenAssign(order)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </Button>
                )}
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="px-2">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      className="text-primary font-medium"
                      onClick={() => router.push(`/orders/${order.id}`)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    {canComplete && (
                      <DropdownMenuItem onClick={() => handleOpenComplete(order)} disabled={order.status === 'Completed'}>
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Complete Job
                      </DropdownMenuItem>
                    )}
                    {canDelete && (
                      <DropdownMenuItem 
                        className="text-destructive font-medium"
                        onClick={() => handleDeleteOrder(order.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Order
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Assignment Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="w-screen h-[100dvh] max-w-none rounded-none sm:max-w-[720px] sm:w-[96vw] sm:h-auto sm:max-h-[85vh] sm:rounded-xl overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Assign Repair
            </DialogTitle>
            <DialogDescription>
              Assign {selectedOrder?.vehicleId} to a workshop bay.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2 text-sm shrink-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Location</span>
              </div>
              <div className="font-semibold text-foreground">{currentLocationName || 'Current location'}</div>
            </div>

            {assignStep === 'bay' ? (
              <div className="space-y-2">
                <Label>Choose Bay</Label>
                <ScrollArea className="h-[calc(100dvh-200px)] sm:h-auto sm:max-h-[50vh] pr-4">
                  <div className="grid gap-2">
                    {baysList.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
                        No bays available for this location.
                      </div>
                    ) : (
                      baysList.map((bay) => {
                        const active = assignment.bay === bay.name;
                        const isOccupied = String((bay as any).status || '').toLowerCase() === 'occupied';
                        const disabled = isOccupied && !active;
                        return (
                          <button
                            key={bay.id}
                            type="button"
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${active ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={() => {
                              if (disabled) return;
                              setAssignment({ ...assignment, bay: bay.name as BayLocation });
                            }}
                            disabled={disabled}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold">{bay.name}</span>
                              <span className="text-xs rounded-full px-2 py-0.5 border bg-white/80">
                                {String((bay as any).status || "Available")}
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Expected Date/Time</span>
                  </div>
                  <div className="font-semibold text-primary">
                    {selectedOrder?.expectedTime ? format(new Date(selectedOrder.expectedTime), 'MMM d, h:mm a') : 'Not set'}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-muted-foreground">Selected Bay</div>
                  <div className="font-semibold">{assignment.bay || 'Unassigned'}</div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Release Date</Label>
                      <Input
                        type="date"
                        value={assignment.releaseTime?.split('T')[0] || ''}
                        onChange={(e) => {
                          const date = e.target.value;
                          const existingTime = assignment.releaseTime?.includes('T') ? assignment.releaseTime.split('T')[1] : '12:00';
                          setAssignment({ ...assignment, releaseTime: `${date}T${existingTime}` });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">Release Time</Label>
                      <Input
                        type="time"
                        value={assignment.releaseTime?.includes('T') ? assignment.releaseTime.split('T')[1].substring(0, 5) : '12:00'}
                        onChange={(e) => {
                          const time = e.target.value;
                          const existingDate = assignment.releaseTime?.includes('T') ? assignment.releaseTime.split('T')[0] : new Date().toISOString().split('T')[0];
                          setAssignment({ ...assignment, releaseTime: `${existingDate}T${time}` });
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground italic">
                    Planned release time (Analog Clock).
                  </p>
                </div>
                <Label>Choose Technician</Label>
                {techOptions.length > 0 ? (
                  <ScrollArea className="h-[calc(100dvh-200px)] sm:h-auto sm:max-h-[50vh] pr-4">
                    <div className="grid gap-2">
                      {techOptions.map((t) => {
                        const active = assignment.technician === t.value;
                        return (
                          <button
                            key={t.value}
                            type="button"
                            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${active ? 'border-primary bg-primary/10' : 'hover:bg-muted/50'}`}
                            onClick={() => setAssignment({ ...assignment, technician: t.value })}
                          >
                            <div className="font-semibold">{t.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="space-y-1">
                    <Input
                      id="tech"
                      placeholder="Type technician name"
                      value={assignment.technician || ''}
                      onChange={(e) => setAssignment({ ...assignment, technician: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      No technicians available. Add technicians in Master Data or type a name here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex-row gap-2 shrink-0 pt-2 pb-2 sm:pb-0 border-t sm:border-t-0 mt-auto sm:mt-0">
            <Button variant="outline" className="flex-1" onClick={() => setIsAssignDialogOpen(false)}>Cancel</Button>
            {assignStep === 'bay' ? (
              <Button
                onClick={() => setAssignStep('tech')}
                className="flex-1 bg-primary"
                disabled={!assignment.bay}
              >
                Next
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1" onClick={() => setAssignStep('bay')}>Back</Button>
                <Button onClick={handleAssignSubmit} className="flex-1 bg-primary" disabled={!assignment.bay}>
                  Confirm
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="w-[95vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Complete Repair
            </DialogTitle>
            <DialogDescription>
              Mark {selectedOrder?.vehicleId} as finished.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Final Notes</Label>
              <Input placeholder="E.g. Replaced all pads..." />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsCompleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCompleteSubmit} className="flex-1 bg-green-600 hover:bg-green-700">Finish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
