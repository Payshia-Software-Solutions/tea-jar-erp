"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createLocation, updateLocation, ServiceLocation } from "@/lib/api";
import { fetchCustomers } from "@/lib/api/master-data";
import { Loader2, MapPin, Store, Users, ShoppingBag, Factory, Percent, ArrowLeft, Code2, User } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { fetchTaxes, TaxRow } from "@/lib/api/finance";
import { Badge } from "@/components/ui/badge";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationFormProps {
  initialData?: ServiceLocation;
  isEdit?: boolean;
}

export function LocationForm({ initialData, isEdit = false }: LocationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [locationType, setLocationType] = useState<"service" | "warehouse">("service");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNo, setTaxNo] = useState("");
  const [taxLabel, setTaxLabel] = useState("");

  const [allowServiceCharge, setAllowServiceCharge] = useState(false);
  const [serviceChargeRate, setServiceChargeRate] = useState("0");
  const [allowDineIn, setAllowDineIn] = useState(true);
  const [allowTakeAway, setAllowTakeAway] = useState(true);
  const [allowRetail, setAllowRetail] = useState(true);
  const [isPosActive, setIsPosActive] = useState(true);
  const [allowProduction, setAllowProduction] = useState(false);
  const [allowOnline, setAllowOnline] = useState(false);
  const [googleAnalyticsCode, setGoogleAnalyticsCode] = useState("");
  const [facebookPixelCode, setFacebookPixelCode] = useState("");
  const [availableTaxes, setAvailableTaxes] = useState<TaxRow[]>([]);
  const [taxIds, setTaxIds] = useState<number[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [defaultCustomerId, setDefaultCustomerId] = useState<string>("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setLocationType(initialData.location_type || "service");
      setAddress(initialData.address || "");
      setPhone(initialData.phone || "");
      setTaxNo(initialData.tax_no || "");
      setTaxLabel(initialData.tax_label || "");
      setAllowServiceCharge(Boolean(initialData.allow_service_charge));
      setServiceChargeRate(String(initialData.service_charge_rate || "0"));
      setAllowDineIn(Boolean(initialData.allow_dine_in));
      setAllowTakeAway(Boolean(initialData.allow_take_away));
      setAllowRetail(Boolean(initialData.allow_retail));
      setIsPosActive(Boolean(initialData.is_pos_active));
      setAllowProduction(Boolean(initialData.allow_production));
      setAllowOnline(Boolean(initialData.allow_online));
      setGoogleAnalyticsCode(initialData.google_analytics_code || "");
      setFacebookPixelCode(initialData.facebook_pixel_code || "");
      setDefaultCustomerId(initialData.default_customer_id ? String(initialData.default_customer_id) : "");
      
      // Handle allowed_taxes_json
      try {
        if (initialData.allowed_taxes_json) {
          const ids = JSON.parse(initialData.allowed_taxes_json);
          if (Array.isArray(ids)) setTaxIds(ids);
        } else {
          setTaxIds([]);
        }
      } catch (e) {
        setTaxIds([]);
      }
    }
  }, [initialData]);

  useEffect(() => {
    fetchTaxes('', { all: true }).then(setAvailableTaxes).catch(() => {});
    fetchCustomers().then(setCustomers).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        location_type: locationType,
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        tax_no: taxNo.trim() || undefined,
        tax_label: taxLabel.trim() || undefined,
        allow_service_charge: allowServiceCharge ? 1 : 0,
        service_charge_rate: Number(serviceChargeRate) || 0,
        allow_dine_in: allowDineIn ? 1 : 0,
        allow_take_away: allowTakeAway ? 1 : 0,
        allow_retail: allowRetail ? 1 : 0,
        is_pos_active: isPosActive ? 1 : 0,
        allow_production: allowProduction ? 1 : 0,
        allow_online: allowOnline ? 1 : 0,
        google_analytics_code: googleAnalyticsCode.trim() || undefined,
        facebook_pixel_code: facebookPixelCode.trim() || undefined,
        default_customer_id: defaultCustomerId ? Number(defaultCustomerId) : null,
        tax_ids: taxIds,
      };

      if (isEdit && initialData) {
        await updateLocation(String(initialData.id), payload);
        toast({ title: "Updated", description: "Location updated successfully" });
      } else {
        await createLocation(payload);
        toast({ title: "Created", description: "Location created successfully" });
      }
      router.push("/admin/locations");
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full pb-20">
      <div className="flex items-center gap-4 mb-2">
        <Button 
          type="button" 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {isEdit ? "Edit Location" : "Create New Location"}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Primary identity and contact details for this location.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="loc-name">Location Name</Label>
                  <Input
                    id="loc-name"
                    placeholder="e.g. Colombo Fleet Hub"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={locationType === "service" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setLocationType("service")}
                    >
                      Fleet Management Hub
                    </Button>
                    <Button
                      type="button"
                      variant={locationType === "warehouse" ? "default" : "outline"}
                      className="flex-1"
                      onClick={() => setLocationType("warehouse")}
                    >
                      Warehouse
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-phone">Phone Number</Label>
                  <Input
                    id="loc-phone"
                    placeholder="+94 77..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="loc-address">Physical Address</Label>
                <Input
                  id="loc-address"
                  placeholder="Street, City, Province"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="loc-tax-no">Tax ID / Business Registration</Label>
                  <Input
                    id="loc-tax-no"
                    placeholder="e.g. VAT12345678"
                    value={taxNo}
                    onChange={(e) => setTaxNo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-tax-label">Tax Label (UI)</Label>
                  <Input
                    id="loc-tax-label"
                    placeholder="e.g. VAT NO"
                    value={taxLabel}
                    onChange={(e) => setTaxLabel(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-100 dark:border-amber-500/20 bg-amber-50/30 dark:bg-amber-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-lg">
                    <Percent className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                 </div>
                 <div>
                    <CardTitle className="text-amber-900 dark:text-amber-100">Tax Configuration</CardTitle>
                    <CardDescription>Select which taxes apply to transactions at this location.</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Allowed Taxes</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTaxes.map((tax) => {
                    const isSelected = taxIds.includes(tax.id);
                    return (
                      <Badge
                        key={tax.id}
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "px-3 py-1.5 cursor-pointer transition-all flex items-center gap-2 text-xs font-bold",
                          isSelected ? "bg-amber-600 hover:bg-amber-700" : "hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        )}
                        onClick={() => {
                          if (isSelected) {
                            setTaxIds(prev => prev.filter(id => id !== tax.id));
                          } else {
                            setTaxIds(prev => [...prev, tax.id]);
                          }
                        }}
                      >
                        {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3 opacity-50" />}
                        {tax.code || tax.name} ({tax.rate_percent}%)
                      </Badge>
                    );
                  })}
                  {availableTaxes.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">No taxes found. Please create taxes in the Finance section first.</p>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest pt-2">
                  Selected IDs: {taxIds.length > 0 ? taxIds.join(', ') : 'NONE'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-100 dark:border-purple-500/20 bg-purple-50/30 dark:bg-purple-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-purple-100 dark:bg-purple-500/20 rounded-lg">
                    <Factory className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                 </div>
                 <div>
                    <CardTitle className="text-purple-900 dark:text-purple-100">Manufacturing & Production</CardTitle>
                    <CardDescription>Designate this location as a factory or assembly site.</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border-2 border-purple-100 dark:border-purple-500/20 shadow-sm">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Enable Production Logic</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Allows creation of Production Orders and WIP ledger mapping.</p>
                </div>
                <Switch checked={allowProduction} onCheckedChange={setAllowProduction} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 dark:border-blue-500/20 bg-blue-50/30 dark:bg-blue-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 dark:bg-blue-500/20 rounded-lg">
                    <Code2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                 </div>
                 <div>
                    <CardTitle className="text-blue-900 dark:text-blue-100">Web & Analytics</CardTitle>
                    <CardDescription>Configure tracking codes for connected websites.</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ga-code">Google Analytics Code (G-XXXXXXXXXX)</Label>
                <Textarea 
                  id="ga-code" 
                  placeholder="Paste your Google Analytics tracking ID or snippet here..." 
                  value={googleAnalyticsCode}
                  onChange={(e) => setGoogleAnalyticsCode(e.target.value)}
                  className="font-mono text-sm min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fb-pixel">Facebook Pixel Code</Label>
                <Textarea 
                  id="fb-pixel" 
                  placeholder="Paste your Facebook Pixel ID or snippet here..." 
                  value={facebookPixelCode}
                  onChange={(e) => setFacebookPixelCode(e.target.value)}
                  className="font-mono text-sm min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: POS & Commercial */}
        <div className="space-y-6">
          <Card className="border-emerald-100 dark:border-emerald-500/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600">
                  <Store className="w-5 h-5" />
                </div>
                <CardTitle className="text-emerald-900 dark:text-emerald-100">POS & Billing</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                <Label className="font-bold cursor-pointer" htmlFor="pos-active">Global POS Enabled</Label>
                <Switch id="pos-active" checked={isPosActive} onCheckedChange={setIsPosActive} />
              </div>

              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                   <User className="w-4 h-4 text-primary" />
                   <Label className="font-bold">Default POS Customer</Label>
                </div>
                <p className="text-[10px] text-muted-foreground mb-2">Used for walk-in sales if no customer is selected.</p>
                <select
                  className="w-full bg-white dark:bg-slate-950 border rounded-md h-9 px-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  value={defaultCustomerId}
                  onChange={(e) => setDefaultCustomerId(e.target.value)}
                >
                  <option value="">-- No Default Customer --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4 pt-2">
                <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sales Channels</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">Allow Dine-In</span>
                    </div>
                    <Switch checked={allowDineIn} onCheckedChange={setAllowDineIn} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-orange-500" />
                      <span className="text-sm">Allow Take-Away</span>
                    </div>
                    <Switch checked={allowTakeAway} onCheckedChange={setAllowTakeAway} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm">Allow Retail Sales</span>
                    </div>
                    <Switch checked={allowRetail} onCheckedChange={setAllowRetail} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">Allow Online Sales</span>
                    </div>
                    <Switch checked={allowOnline} onCheckedChange={setAllowOnline} />
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary" />
                    <Label className="font-semibold">Service Charge</Label>
                  </div>
                  <Switch checked={allowServiceCharge} onCheckedChange={setAllowServiceCharge} />
                </div>
                {allowServiceCharge && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                    <Label htmlFor="sc-rate" className="text-xs text-muted-foreground">Standard Rate (%)</Label>
                    <Input
                      id="sc-rate"
                      type="number"
                      step="0.01"
                      value={serviceChargeRate}
                      onChange={(e) => setServiceChargeRate(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle className="text-sm font-bold">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               <Button 
                 type="submit" 
                 className="w-full bg-primary h-12 text-lg font-bold shadow-lg shadow-primary/20" 
                 disabled={loading || !name.trim()}
               >
                 {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                 {isEdit ? "Update Location" : "Create Location"}
               </Button>
               <Button 
                type="button" 
                variant="outline" 
                className="w-full" 
                onClick={() => router.push("/admin/locations")}
                disabled={loading}
               >
                 Cancel Changes
               </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
