"use client";

import React, { useEffect, useState, useRef } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  fetchStorefrontSettings, 
  updateStorefrontSettings,
  uploadStorefrontAsset
} from "@/lib/api";
import { 
  LayoutGrid, 
  Save, 
  Loader2, 
  Image as ImageIcon, 
  Video, 
  Type, 
  Palette,
  Truck,
  Upload,
  Sparkles,
  MousePointerClick
} from "lucide-react";

export default function ContentManagementPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadKey, setActiveUploadKey] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await fetchStorefrontSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Error",
        description: "Failed to load storefront settings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateStorefrontSettings(settings);
      toast({
        title: "Success",
        description: "Storefront content updated successfully.",
      });
    } catch (error) {
      console.error("Failed to update settings:", error);
      toast({
        title: "Error",
        description: "Failed to update storefront settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleUploadClick = (key: string) => {
    setActiveUploadKey(key);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadKey) return;

    setSaving(true);
    try {
      const res = await uploadStorefrontAsset(file);
      handleChange(activeUploadKey, res.url);
      toast({
        title: "Uploaded",
        description: "Asset uploaded and linked successfully.",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload asset to storage.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setActiveUploadKey(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Storefront Content">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Storefront Content Management">
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept="image/*,video/*"
        />

        <form onSubmit={handleUpdate} className="space-y-8">
          
          <div className="flex justify-between items-center">
             <div>
                <h2 className="text-lg font-bold">Dynamic Storefront Controls</h2>
                <p className="text-sm text-muted-foreground">Manage your website's banners, popups, and promotional bars.</p>
             </div>
             <Button 
                type="submit" 
                size="lg" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 px-8"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save All Changes
                  </>
                )}
              </Button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            
            <div className="space-y-8">
                {/* Top Bar Section */}
                <Card className="border-indigo-500/20 bg-card/50 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                        <Truck className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div>
                        <CardTitle className="text-xl">Announcement Bar</CardTitle>
                        <CardDescription>Very top bar promo message</CardDescription>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                        <Label htmlFor="top_bar_text">Promo Text</Label>
                        <div className="relative">
                            <Type className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input 
                            id="top_bar_text"
                            className="pl-10"
                            value={settings.top_bar_text || ""}
                            onChange={(e) => handleChange("top_bar_text", e.target.value)}
                            placeholder="e.g. Enjoy 20% Off..."
                            />
                        </div>
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="top_bar_bg_color">Background Hex</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                            <Palette className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            <Input 
                                id="top_bar_bg_color"
                                className="pl-10 font-mono uppercase"
                                value={settings.top_bar_bg_color || ""}
                                onChange={(e) => handleChange("top_bar_bg_color", e.target.value)}
                                placeholder="#b91c1c"
                            />
                            </div>
                            <div className="relative w-10 h-10 rounded-md border border-white/10 overflow-hidden cursor-pointer shadow-sm group">
                                <input 
                                    type="color"
                                    className="absolute inset-0 w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                                    value={settings.top_bar_bg_color || "#b91c1c"}
                                    onChange={(e) => handleChange("top_bar_bg_color", e.target.value)}
                                />
                                <div className="absolute inset-0 pointer-events-none border border-white/20 rounded-md group-hover:border-white/40 transition-colors" />
                            </div>
                        </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Live Preview</Label>
                        <div 
                            className="p-2 rounded-md text-center text-xs font-bold transition-all duration-300"
                            style={{ backgroundColor: settings.top_bar_bg_color || '#b91c1c', color: '#fff' }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Truck className="w-3 h-3" />
                                {settings.top_bar_text || "Preview Text"}
                            </div>
                        </div>
                    </div>
                    </CardContent>
                </Card>

                {/* Hero Banner Section */}
                <Card className="border-amber-500/20 bg-card/50 backdrop-blur-xl shadow-xl">
                    <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                        <LayoutGrid className="w-5 h-5 text-amber-500" />
                        </div>
                        <div>
                        <CardTitle className="text-xl">Hero Video Banner</CardTitle>
                        <CardDescription>Main homepage video and logo overlay</CardDescription>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                        <Label>Background Video (MP4)</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Video className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    className="pl-10"
                                    value={settings.hero_video_url || ""}
                                    onChange={(e) => handleChange("hero_video_url", e.target.value)}
                                    placeholder="URL or upload video..."
                                />
                            </div>
                            <Button type="button" variant="outline" onClick={() => handleUploadClick("hero_video_url")}>
                                <Upload className="w-4 h-4 mr-2" /> Upload
                            </Button>
                        </div>
                        {settings.hero_video_url && (
                            <div className="mt-2 aspect-video rounded-lg overflow-hidden border bg-black relative">
                                <video 
                                    key={settings.hero_video_url}
                                    src={settings.hero_video_url}
                                    autoPlay muted loop playsInline
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] text-white font-bold uppercase tracking-widest">Live Preview</div>
                            </div>
                        )}
                        </div>

                        <div className="space-y-2">
                        <Label>Overlay Brand Logo</Label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input 
                                    className="pl-10"
                                    value={settings.hero_logo_url || ""}
                                    onChange={(e) => handleChange("hero_logo_url", e.target.value)}
                                    placeholder="URL or upload logo..."
                                />
                            </div>
                            <Button type="button" variant="outline" onClick={() => handleUploadClick("hero_logo_url")}>
                                <Upload className="w-4 h-4 mr-2" /> Upload
                            </Button>
                        </div>
                        {settings.hero_logo_url && (
                            <div className="mt-2 p-4 rounded-lg border bg-neutral-900 flex justify-center">
                                <img src={settings.hero_logo_url} alt="Logo Preview" className="h-16 object-contain" />
                            </div>
                        )}
                        </div>
                    </div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-8">
                {/* Subscription Modal Section */}
                <Card className="border-emerald-500/20 bg-card/50 backdrop-blur-xl shadow-xl h-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg">
                                    <MousePointerClick className="w-5 h-5 text-emerald-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Subscription Popup</CardTitle>
                                    <CardDescription>Manage the "20% Off" newsletter modal</CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Label htmlFor="sub_modal_active" className="text-xs uppercase font-bold text-muted-foreground">Enabled</Label>
                                <Switch 
                                    id="sub_modal_active"
                                    checked={settings.sub_modal_active === "1"}
                                    onCheckedChange={(v) => handleChange("sub_modal_active", v ? "1" : "0")}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Main Title</Label>
                                <Input 
                                    value={settings.sub_modal_title || ""}
                                    onChange={(e) => handleChange("sub_modal_title", e.target.value)}
                                    placeholder="Life's better with tea..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Subtitle / Description</Label>
                                <Textarea 
                                    rows={3}
                                    value={settings.sub_modal_subtitle || ""}
                                    onChange={(e) => handleChange("sub_modal_subtitle", e.target.value)}
                                    placeholder="Enjoy 20% Off + FREE Delivery..."
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Modal Side Image</Label>
                                <div className="flex gap-4 items-start">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <ImageIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                                <Input 
                                                    className="pl-10"
                                                    value={settings.sub_modal_image_url || ""}
                                                    onChange={(e) => handleChange("sub_modal_image_url", e.target.value)}
                                                    placeholder="URL or upload image..."
                                                />
                                            </div>
                                            <Button type="button" variant="outline" onClick={() => handleUploadClick("sub_modal_image_url")}>
                                                <Upload className="w-4 h-4 mr-2" /> Upload
                                            </Button>
                                        </div>
                                    </div>
                                    {settings.sub_modal_image_url && (
                                        <div className="w-24 h-24 rounded-lg border overflow-hidden bg-black/10 flex-shrink-0">
                                            <img src={settings.sub_modal_image_url} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 flex items-start gap-3">
                            <Sparkles className="w-5 h-5 text-indigo-500 mt-1 flex-shrink-0" />
                            <div className="text-xs text-muted-foreground leading-relaxed">
                                <p className="font-bold text-indigo-500 uppercase tracking-widest mb-1">Pro Tip</p>
                                Use high-quality webp or png images with transparent backgrounds for the brand logo. For the subscription modal, use a portrait-oriented image (800x1000px) for best results.
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </form>

      </div>
    </DashboardLayout>
  );
}
