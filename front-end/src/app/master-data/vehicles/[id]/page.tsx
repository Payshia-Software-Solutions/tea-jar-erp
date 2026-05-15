"use client"

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { VehicleForm } from "@/components/master-data/VehicleForm";
import { ChevronLeft, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Vehicle } from "@/lib/types";

export default function EditVehiclePage() {
  const params = useParams();
  const id = params.id as string;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        const res = await api(`/api/vehicle/get/${id}`);
        const json = await res.json();
        if (json.status === 'success') {
          setVehicle(json.data);
        } else {
          setError(json.message || "Failed to load vehicle data");
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadVehicle();
  }, [id]);

  return (
    <DashboardLayout fullWidth={true}>
      <div className="mb-8 flex flex-col gap-2">
        <Link href="/master-data/vehicles">
          <Button variant="ghost" size="sm" className="w-fit gap-2 -ml-2 text-muted-foreground hover:text-primary">
            <ChevronLeft className="w-4 h-4" />
            Back to Vehicle List
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Edit Vehicle</h1>
            <p className="text-muted-foreground">Update the specifications and fleet management details for this vehicle.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Fetching vehicle details...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="p-4 bg-destructive/10 rounded-full mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-lg font-bold">Error Loading Vehicle</h3>
          <p className="text-muted-foreground max-w-xs">{error}</p>
          <Link href="/master-data/vehicles" className="mt-4">
            <Button variant="outline">Return to List</Button>
          </Link>
        </div>
      ) : vehicle ? (
        <VehicleForm initialData={vehicle} isEditing={true} />
      ) : null}
    </DashboardLayout>
  );
}
