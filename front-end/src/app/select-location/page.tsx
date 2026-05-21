"use client"

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin, ArrowRight, Search } from "lucide-react";
import { fetchLocations, type ServiceLocationRow } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

type AllowedLocation = { id: number; name: string };

function decodeJwtPayload(token: string): any | null {
  try {
    const part = token.split(".")[1];
    const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
    return json;
  } catch {
    return null;
  }
}

export default function SelectLocationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<AllowedLocation[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = decodeJwtPayload(token);
    const role = String(payload?.role ?? "").toLowerCase();
    const allowed: AllowedLocation[] = Array.isArray(payload?.allowed_locations)
      ? payload.allowed_locations
          .map((x: any) => ({ id: Number(x?.id), name: String(x?.name ?? "") }))
          .filter((x: AllowedLocation) => x.id > 0 && x.name)
      : [];

    const fallbackId = payload?.location_id ? Number(payload.location_id) : 1;
    const fallbackName = payload?.location_name ? String(payload.location_name) : "-";

    const setFromList = (list: AllowedLocation[]) => {
      if (list.length === 0 && !fallbackId) {
          setLocations([]);
          setLoading(false);
          return;
      }
      const finalAllowed = list.length > 0 ? list : [{ id: fallbackId, name: fallbackName }];
      setLocations(finalAllowed);
      const pre = finalAllowed.find((l) => l.id === fallbackId)?.id ?? finalAllowed[0].id;
      setSelectedId(String(pre));
      setLoading(false);
    };

    if (role === "admin") {
      // Admin can switch to any location (service + warehouse).
      void (async () => {
        try {
          const locRows = await fetchLocations();
          const cleaned = Array.isArray(locRows)
            ? (locRows as ServiceLocationRow[])
                .map((l) => ({ id: Number(l.id), name: String(l.name ?? "") }))
                .filter((x) => x.id > 0 && x.name)
            : [];
          setFromList(cleaned);
        } catch {
          setFromList([{ id: fallbackId, name: fallbackName }]);
        }
      })();
      return;
    }

    setFromList(allowed);
  }, []);

  useEffect(() => {
    // If only one allowed location, auto-select and continue.
    if (!loading && locations.length === 1 && selectedId) {
      window.localStorage.setItem("location_id", String(locations[0].id));
      window.localStorage.setItem("location_name", String(locations[0].name));
      const ret = searchParams?.get("return") ?? "/dashboard/overall";
      // Full reload so all modules re-initialize with X-Location-Id context.
      window.location.href = ret;
    }
  }, [loading, locations, selectedId, router, searchParams]);

  const selected = useMemo(() => {
    const id = Number(selectedId);
    return locations.find((l) => l.id === id) ?? null;
  }, [locations, selectedId]);

  const continueToApp = () => {
    if (!selectedId) return;
    const id = Number(selectedId);
    const loc = locations.find((l) => l.id === id);
    window.localStorage.setItem("location_id", String(selectedId));
    if (loc?.name) window.localStorage.setItem("location_name", String(loc.name));
    const ret = searchParams?.get("return") ?? "/dashboard/overall";
    window.location.href = ret;
  };

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locations;
    const query = searchQuery.toLowerCase();
    return locations.filter(l => 
      l.name.toLowerCase().includes(query) || 
      String(l.id).includes(query)
    );
  }, [locations, searchQuery]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-4xl border-none shadow-xl rounded-2xl overflow-hidden flex flex-col">
        <CardHeader className="text-center pb-4 space-y-2 shrink-0">
          <div className="w-64 h-24 mx-auto">
            <img 
              src="/bizzflow-logo.png" 
              alt="BizzFlow Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <CardDescription>Select the location you want to work in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 flex flex-col">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
              Loading locations...
            </div>
          ) : (
            <>
              {locations.length > 5 && (
                <div className="relative shrink-0 max-w-md mx-auto w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 h-10 rounded-xl bg-muted/50 border-none"
                  />
                </div>
              )}
              
              <ScrollArea className="flex-1 pr-4 -mr-4 h-[350px]">
                <RadioGroup value={selectedId} onValueChange={setSelectedId} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-2">
                  {filteredLocations.map((l) => (
                    <div
                      key={l.id}
                      className={`flex items-start rounded-xl border-2 p-5 transition-colors cursor-pointer relative ${
                        selectedId === String(l.id) 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:bg-muted/20"
                      }`}
                      onClick={() => setSelectedId(String(l.id))}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <RadioGroupItem value={String(l.id)} id={`loc-${l.id}`} className="mt-1 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`loc-${l.id}`} className="cursor-pointer font-semibold block text-[13px] leading-tight break-words">
                            {l.name}
                          </Label>
                          <div className="text-[11px] text-muted-foreground mt-1">Location ID: {l.id}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredLocations.length === 0 && (
                    <div className="col-span-full text-center py-8 text-sm text-muted-foreground">
                      No locations found matching "{searchQuery}"
                    </div>
                  )}
                </RadioGroup>
              </ScrollArea>

              <div className="shrink-0 space-y-4 pt-4 max-w-md mx-auto w-full">
                <Button
                  className="w-full bg-primary hover:bg-primary/90 py-6 text-lg rounded-xl font-bold shadow-md"
                  onClick={continueToApp}
                  disabled={!selectedId}
                >
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {selected ? (
                  <div className="text-xs text-muted-foreground text-center">
                    Current selection: <span className="font-semibold text-foreground">{selected.name}</span>
                  </div>
                ) : null}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
