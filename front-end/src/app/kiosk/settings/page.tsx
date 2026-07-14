"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, MapPin, Store, Utensils, Sparkles, Image as ImageIcon, Plus, Bell } from "lucide-react";
import { uploadStorefrontIcon, fetchLocations, fetchStorefrontSettings, updateStorefrontSettings, ServiceLocation } from "@/lib/api/admin";

export default function KioskSettingsPage() {
  const { toast } = useToast();
  
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Kiosk Settings State
  const [welcomeTitle, setWelcomeTitle] = useState("Welcome to Your Stay");
  const [welcomeSubtitle, setWelcomeSubtitle] = useState("Select a service below to elevate your experience");
  
  const [diningTitle, setDiningTitle] = useState("Order Products");
  const [diningSubtitle, setDiningSubtitle] = useState("Explore our culinary offerings and order directly to your room.");
  
  const [expTitle, setExpTitle] = useState("Book an Experience");
  const [expSubtitle, setExpSubtitle] = useState("Discover and book spa treatments, tours, and premium services.");
  
  const [logoUrl, setLogoUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Notification Settings State
  const [notifyEmailEnabled, setNotifyEmailEnabled] = useState(false);
  const [notifyEmailAddr, setNotifyEmailAddr] = useState("");
  const [notifySmsEnabled, setNotifySmsEnabled] = useState(false);
  const [notifySmsPhone, setNotifySmsPhone] = useState("");

  useEffect(() => {
    async function loadLocations() {
      try {
        const locs = await fetchLocations();
        setLocations(locs || []);
        if (locs && locs.length > 0) {
          setSelectedLocationId(locs[0].id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Failed to load locations", error);
        setLoading(false);
      }
    }
    loadLocations();
  }, []);

  useEffect(() => {
    if (!selectedLocationId) return;
    
    async function loadSettings() {
      setLoading(true);
      try {
        // We reuse the storefront settings API to fetch kiosk settings 
        // because we added kiosk settings into the storefront_settings table
        const settings = await fetchStorefrontSettings(selectedLocationId);
        if (settings) {
          setWelcomeTitle(settings.kiosk_welcome_title || "Welcome to Your Stay");
          setWelcomeSubtitle(settings.kiosk_welcome_subtitle || "Select a service below to elevate your experience");
          setDiningTitle(settings.kiosk_dining_title || "Order Products");
          setDiningSubtitle(settings.kiosk_dining_subtitle || "Explore our culinary offerings and order directly to your room.");
          setExpTitle(settings.kiosk_exp_title || "Book an Experience");
          setExpSubtitle(settings.kiosk_exp_subtitle || "Discover and book spa treatments, tours, and premium services.");
          setLogoUrl(settings.kiosk_logo_url || "");
          setNotifyEmailEnabled(settings.kiosk_notify_email_enabled === "1");
          setNotifyEmailAddr(settings.kiosk_notify_email_addr || "");
          setNotifySmsEnabled(settings.kiosk_notify_sms_enabled === "1");
          setNotifySmsPhone(settings.kiosk_notify_sms_phone || "");
        }
      } catch (error) {
        console.error("Failed to load kiosk settings", error);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [selectedLocationId]);

  const handleSave = async () => {
    if (!selectedLocationId) return;
    setSaving(true);
    try {
      const payload = {
        location_id: selectedLocationId,
        kiosk_welcome_title: welcomeTitle,
        kiosk_welcome_subtitle: welcomeSubtitle,
        kiosk_dining_title: diningTitle,
        kiosk_dining_subtitle: diningSubtitle,
        kiosk_exp_title: expTitle,
        kiosk_exp_subtitle: expSubtitle,
        kiosk_logo_url: logoUrl,
        kiosk_notify_email_enabled: notifyEmailEnabled ? "1" : "0",
        kiosk_notify_email_addr: notifyEmailAddr,
        kiosk_notify_sms_enabled: notifySmsEnabled ? "1" : "0",
        kiosk_notify_sms_phone: notifySmsPhone,
      };

      await updateStorefrontSettings(payload);
      toast({ title: "Success", description: "Kiosk settings updated successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!selectedLocationId) return;
    
    const formData = new FormData();
    formData.append("icon", file);
    formData.append("key", "kiosk_logo_url");
    formData.append("location_id", selectedLocationId.toString());
    
    setIsUploading(true);
    try {
      const res = await uploadStorefrontIcon(formData);
      if (res && res.data && res.data.path) {
        setLogoUrl(res.data.path);
        toast({ title: "Logo Uploaded", description: "The Kiosk logo was updated." });
      }
    } catch (error: any) {
      toast({ title: "Upload Failed", description: error.message || "Failed to upload image", variant: "destructive" });
    } finally {
      setIsUploading(false);
      // Reset the file input so the user can select the same file again if they want
      e.target.value = '';
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 w-full max-w-full pb-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Kiosk Settings</h1>
            <p className="text-muted-foreground text-sm">Manage UI settings for the customer-facing Kiosk Application.</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-[200px]">
                <Select
                  value={selectedLocationId ? selectedLocationId.toString() : ""}
                  onValueChange={(val) => setSelectedLocationId(parseInt(val, 10))}
                >
                  <SelectTrigger className="bg-white">
                    <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="Select Location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id.toString()}>{loc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             </div>
             <Button onClick={handleSave} disabled={loading || saving} className="min-w-[120px]">
               {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
               Save Changes
             </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Form Settings */}
            <div className="lg:col-span-2 space-y-6">
               
               {/* Welcome Screen Settings */}
               <Card className="border-border/50 shadow-sm">
                 <CardHeader className="bg-muted/10 border-b pb-4">
                   <CardTitle className="text-base flex items-center gap-2"><Store className="w-4 h-4 text-primary" /> Welcome Screen</CardTitle>
                   <CardDescription>Configure the main landing page text and logo.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-6 space-y-5">
                    
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Kiosk Logo</Label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/20 flex flex-col items-center justify-center bg-muted/5 relative overflow-hidden">
                          {logoUrl ? (
                             <img src={logoUrl} alt="Logo" className="object-contain w-full h-full p-2" />
                          ) : (
                             <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                           <div className="relative">
                             <Button type="button" variant="outline" size="sm" className="w-full" disabled={isUploading}>
                                {isUploading ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-2" />} 
                                {isUploading ? 'Uploading...' : (logoUrl ? 'Change Logo' : 'Upload Logo')}
                             </Button>
                             <input 
                               type="file" 
                               accept="image/*" 
                               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                               onChange={handleLogoUpload}
                               disabled={isUploading}
                             />
                           </div>
                           {logoUrl && (
                             <Button type="button" variant="ghost" size="sm" className="text-destructive h-8" onClick={() => setLogoUrl("")}>
                               Remove
                             </Button>
                           )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Welcome Title</Label>
                      <Input value={welcomeTitle} onChange={(e) => setWelcomeTitle(e.target.value)} placeholder="e.g. Welcome to Your Stay" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Welcome Subtitle</Label>
                      <Textarea value={welcomeSubtitle} onChange={(e) => setWelcomeSubtitle(e.target.value)} placeholder="e.g. Select a service below..." className="resize-none h-20" />
                    </div>
                 </CardContent>
               </Card>

               {/* Cards Settings */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Dining Card */}
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                      <CardTitle className="text-base flex items-center gap-2"><Utensils className="w-4 h-4 text-orange-500" /> Dining / Products</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-semibold text-muted-foreground">Card Title</Label>
                          <Input value={diningTitle} onChange={(e) => setDiningTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-semibold text-muted-foreground">Card Description</Label>
                          <Textarea value={diningSubtitle} onChange={(e) => setDiningSubtitle(e.target.value)} className="resize-none h-24 text-sm" />
                        </div>
                    </CardContent>
                  </Card>

                  {/* Experiences Card */}
                  <Card className="border-border/50 shadow-sm">
                    <CardHeader className="bg-muted/10 border-b pb-4">
                      <CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" /> Experiences</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-semibold text-muted-foreground">Card Title</Label>
                          <Input value={expTitle} onChange={(e) => setExpTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-semibold text-muted-foreground">Card Description</Label>
                          <Textarea value={expSubtitle} onChange={(e) => setExpSubtitle(e.target.value)} className="resize-none h-24 text-sm" />
                        </div>
                    </CardContent>
                  </Card>
               </div>

               {/* Notifications Settings */}
               <Card className="border-border/50 shadow-sm">
                 <CardHeader className="bg-muted/10 border-b pb-4">
                   <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4 text-blue-500" /> Notifications</CardTitle>
                   <CardDescription>Receive automated alerts when guests place orders or book experiences.</CardDescription>
                 </CardHeader>
                 <CardContent className="p-6 space-y-6">
                    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold">Email Notifications</Label>
                          <p className="text-xs text-muted-foreground">Send an email alert to management.</p>
                        </div>
                        <Switch checked={notifyEmailEnabled} onCheckedChange={setNotifyEmailEnabled} />
                      </div>
                      {notifyEmailEnabled && (
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Email Address(es)</Label>
                          <Input value={notifyEmailAddr} onChange={e => setNotifyEmailAddr(e.target.value)} placeholder="admin1@hotel.com, admin2@hotel.com" type="text" />
                          <p className="text-[10px] text-muted-foreground">Separate multiple emails with commas.</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-semibold">SMS Notifications</Label>
                          <p className="text-xs text-muted-foreground">Send an SMS alert to management.</p>
                        </div>
                        <Switch checked={notifySmsEnabled} onCheckedChange={setNotifySmsEnabled} />
                      </div>
                      {notifySmsEnabled && (
                        <div className="space-y-2 pt-2 border-t">
                          <Label className="text-[11px] font-semibold text-muted-foreground uppercase">Phone Number(s)</Label>
                          <Input value={notifySmsPhone} onChange={e => setNotifySmsPhone(e.target.value)} placeholder="94771234567, 94711234567" type="text" />
                          <p className="text-[10px] text-muted-foreground">Format with country code. Separate multiple numbers with commas.</p>
                        </div>
                      )}
                    </div>
                 </CardContent>
               </Card>

            </div>

            {/* Right Column: Preview */}
            <div className="lg:col-span-1">
               <Card className="border-primary/20 shadow-sm bg-gradient-to-b from-primary/5 to-transparent sticky top-6">
                 <CardHeader className="pb-4">
                   <CardTitle className="text-sm">Live Preview</CardTitle>
                   <CardDescription className="text-xs">This is how the Kiosk welcome screen will appear to the guest.</CardDescription>
                 </CardHeader>
                 <CardContent>
                    <div className="w-full aspect-[9/16] bg-slate-900 rounded-[2rem] border-8 border-slate-800 p-6 flex flex-col shadow-2xl relative overflow-hidden">
                       
                       {/* Mock Header Logo */}
                       {logoUrl && (
                         <div className="w-full flex justify-center mb-6">
                           <img src={logoUrl} alt="Logo" className="h-8 object-contain max-w-[120px]" />
                         </div>
                       )}

                       <div className="flex-1 flex flex-col justify-center text-center">
                          <h2 className="text-white font-bold text-2xl tracking-tight leading-tight mb-2">{welcomeTitle || "Welcome"}</h2>
                          <p className="text-slate-400 text-xs px-4 mb-8 leading-relaxed">{welcomeSubtitle}</p>
                          
                          <div className="space-y-4 w-full">
                            <div className="bg-white rounded-2xl p-4 flex flex-col items-center text-center shadow-lg transform transition-transform scale-100 hover:scale-105">
                               <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500 mb-2">
                                 <Utensils className="w-5 h-5" />
                               </div>
                               <h3 className="font-bold text-slate-900 text-sm mb-1">{diningTitle}</h3>
                               <p className="text-[10px] text-slate-500 leading-tight">{diningSubtitle}</p>
                            </div>

                            <div className="bg-white rounded-2xl p-4 flex flex-col items-center text-center shadow-lg transform transition-transform scale-100 hover:scale-105">
                               <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500 mb-2">
                                 <Sparkles className="w-5 h-5" />
                               </div>
                               <h3 className="font-bold text-slate-900 text-sm mb-1">{expTitle}</h3>
                               <p className="text-[10px] text-slate-500 leading-tight">{expSubtitle}</p>
                            </div>
                          </div>
                       </div>
                    </div>
                 </CardContent>
               </Card>
            </div>

          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
