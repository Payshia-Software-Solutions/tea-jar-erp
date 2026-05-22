"use client"

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { fetchOrders, updateOrder } from "@/lib/api";
import type { RepairOrder } from "@/lib/types";
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, PlayCircle, Wrench, MapPin, User } from "lucide-react";

export default function ActiveJobsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      const msg = (err as Error).message || "Failed to load active jobs";
      setLoadError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const active = useMemo(() => orders.filter((o) => o.status === "In Progress"), [orders]);

  const fmt = (value?: string) => {
    if (!value) return "-";
    const iso = value.includes("T") ? value : value.replace(" ", "T");
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <PlayCircle className="w-6 h-6 text-primary" />
            Active Workshop Jobs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Orders currently in progress</p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-primary border-blue-200 px-3 py-1">
          {active.length} Active Repairs
        </Badge>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading active jobs...</p>
        </div>
      ) : loadError ? (
        <Card className="border-dashed p-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold">Unable to Load Active Jobs</h3>
          <p className="text-muted-foreground max-w-md mt-1">{loadError}</p>
          <div className="flex gap-2 mt-6">
            <Button variant="outline" onClick={() => void load()}>Retry</Button>
            <Button onClick={() => router.push('/orders')}>Go to Orders</Button>
          </div>
        </Card>
      ) : active.length === 0 ? (
        <Card className="border-dashed p-12 flex flex-col items-center justify-center text-center">
          <div className="p-4 bg-muted rounded-full mb-4">
            <Wrench className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold">No Active Jobs</h3>
          <p className="text-muted-foreground max-w-xs">Move an order to “In Progress” to see it here.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {active.map((o) => (
            <Card key={o.id} className="border-none shadow-md hover:shadow-lg transition-all overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-bold">{o.vehicleId || `Order #${o.id}`}</CardTitle>
                  {o.vehicleNumber && (
                    <Badge variant="outline" className="shrink-0 bg-background">{o.vehicleNumber}</Badge>
                  )}
                </div>
                <CardDescription className="line-clamp-2 mt-1">{o.problemDescription || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="font-semibold">In Progress</Badge>
                  <span className="text-xs text-muted-foreground">ID: {o.id}</span>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium text-foreground">{o.location || "Unassigned bay"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span className="font-medium text-foreground">{o.technician || "Unassigned technician"}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Expected: <span className="text-foreground">{fmt(o.expectedTime)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Release: <span className="text-foreground">{fmt(o.releaseTime)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => router.push(`/orders/${o.id}`)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                    onClick={() => router.push(`/orders/${o.id}`)}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Complete
                  </Button>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Assignment shows the latest bay/technician from the order.
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

