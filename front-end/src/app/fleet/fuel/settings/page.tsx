"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Fuel, MapPin, Edit } from "lucide-react";
import { api } from "@/lib/api";

type FuelStation = {
  id: number;
  name: string;
  type: string;
  status: string;
};

type FuelType = {
  id: number;
  name: string;
  price_per_liter: string;
};

export default function FuelSettingsPage() {
  const { toast } = useToast();
  const [stations, setStations] = useState<FuelStation[]>([]);
  const [types, setTypes] = useState<FuelType[]>([]);
  const [loading, setLoading] = useState(true);

  const [newStation, setNewStation] = useState({ name: "", type: "outside_shed" });
  const [newType, setNewType] = useState({ name: "", price_per_liter: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resStations, resTypes] = await Promise.all([
        api("/api/fuel/get-stations").then(res => res.json()),
        api("/api/fuel/get-types").then(res => res.json())
      ]);
      setStations(resStations.data?.stations || []);
      setTypes(resTypes.data?.types || []);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to fetch settings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddStation = async () => {
    if (!newStation.name) {
      toast({ title: "Validation Error", description: "Station name is required.", variant: "destructive" });
      return;
    }
    try {
      const response = await api("/api/fuel/create-station", {
        method: "POST",
        body: JSON.stringify(newStation)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add station");
      toast({ title: "Success", description: "Station added successfully." });
      setNewStation({ name: "", type: "outside_shed" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add station", variant: "destructive" });
    }
  };

  const handleAddType = async () => {
    if (!newType.name || !newType.price_per_liter) {
      toast({ title: "Validation Error", description: "Name and Price are required.", variant: "destructive" });
      return;
    }
    try {
      const response = await api("/api/fuel/create-type", {
        method: "POST",
        body: JSON.stringify(newType)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to save fuel type");
      toast({ title: "Success", description: "Fuel type saved successfully." });
      setNewType({ name: "", price_per_liter: "" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save fuel type", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Fuel Settings</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
          {/* Fuel Types & Prices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="w-5 h-5" /> Fuel Types & Prices
              </CardTitle>
              <CardDescription>Manage available fuel types and their current price per liter.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Fuel Name (e.g. Petrol 92)</Label>
                    <Input 
                      placeholder="Name" 
                      value={newType.name} 
                      onChange={e => setNewType({ ...newType, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Price Per Liter (LKR)</Label>
                    <Input 
                      type="number"
                      placeholder="0.00" 
                      value={newType.price_per_liter} 
                      onChange={e => setNewType({ ...newType, price_per_liter: e.target.value })}
                    />
                  </div>
                </div>
                <Button onClick={handleAddType}>
                  <Plus className="w-4 h-4 mr-2" /> Save Fuel Type
                </Button>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Current Types</h4>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <ul className="space-y-2">
                    {types.map(t => (
                      <li key={t.id} className="flex justify-between items-center p-2 border rounded-md text-sm">
                        <span>{t.name}</span>
                        <span className="font-mono bg-muted px-2 py-1 rounded">LKR {parseFloat(t.price_per_liter).toFixed(2)} / L</span>
                      </li>
                    ))}
                    {types.length === 0 && <p className="text-sm text-muted-foreground">No fuel types configured.</p>}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fuel Stations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Fuel Pump Stations
              </CardTitle>
              <CardDescription>Manage where the vehicles can pump fuel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <div className="space-y-1">
                  <Label>Station Name</Label>
                  <Input 
                    placeholder="e.g. Ceypetco - Town" 
                    value={newStation.name} 
                    onChange={e => setNewStation({ ...newStation, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Station Type</Label>
                  <Select value={newStation.type} onValueChange={(v) => setNewStation({ ...newStation, type: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outside_shed">Outside Shed</SelectItem>
                      <SelectItem value="factory_pump">Factory Fuel Pump</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddStation}>
                  <Plus className="w-4 h-4 mr-2" /> Add Station
                </Button>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-semibold mb-2">Configured Stations</h4>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <ul className="space-y-2">
                    {stations.map(s => (
                      <li key={s.id} className="flex justify-between items-center p-2 border rounded-md text-sm">
                        <span>{s.name}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded capitalize">
                          {s.type.replace('_', ' ')}
                        </span>
                      </li>
                    ))}
                    {stations.length === 0 && <p className="text-sm text-muted-foreground">No stations configured.</p>}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
