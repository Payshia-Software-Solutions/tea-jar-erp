"use client"

import React from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { VehicleForm } from "@/components/master-data/VehicleForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewVehiclePage() {
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
            <h1 className="text-3xl font-black tracking-tight">Add New Vehicle</h1>
            <p className="text-muted-foreground">Register a new vehicle in the master data database.</p>
          </div>
        </div>
      </div>

      <VehicleForm />
    </DashboardLayout>
  );
}
