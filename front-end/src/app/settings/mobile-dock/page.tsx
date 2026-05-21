"use client"

import React, { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { getPermittedDockPool, getSavedDockItems, saveDockItems } from "@/lib/dock-utils";
import { type NavItem } from "@/lib/nav-items";
import { 
  Search, 
  ArrowLeft, 
  Plus, 
  X, 
  Smartphone, 
  MousePointer2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_SLOTS = ["/dashboard", "/orders", "/orders/new", "/orders/active", "/menu"];

export default function MobileDockSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [permissionKeys, setPermissionKeys] = useState<string[] | null>(null);
  const [saasModules, setSaasModules] = useState<string[] | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [slots, setSlots] = useState<string[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const token = window.localStorage.getItem("auth_token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
        setUserRole(String(payload?.role ?? ""));
      } catch {}
    }

    void (async () => {
      try {
        const CACHE_KEY = 'saas_config_cache';
        const CACHE_TIME_KEY = 'saas_config_cache_time';
        const ONE_DAY = 24 * 60 * 60 * 1000;
        let saasData = null;

        const cachedStr = window.localStorage.getItem(CACHE_KEY);
        const cachedTime = window.localStorage.getItem(CACHE_TIME_KEY);
        if (cachedStr && cachedTime && Date.now() - parseInt(cachedTime, 10) <= ONE_DAY) {
          try {
            saasData = JSON.parse(cachedStr);
          } catch (e) {}
        }

        const promises: Promise<any>[] = [api("/api/auth/permissions")];
        if (!saasData) promises.push(fetch(`${process.env.NEXT_PUBLIC_API_URL || ""}/api/saas/config`).then((r) => r.json()));

        const results = await Promise.all(promises);
        const permRes = results[0];
        const saasRes = !saasData ? results[1] : null;

        if (saasRes && saasRes.status === "success" && saasRes.data) {
           saasData = saasRes.data;
           window.localStorage.setItem(CACHE_KEY, JSON.stringify(saasData));
           window.localStorage.setItem(CACHE_TIME_KEY, Date.now().toString());
        }

        const permData = await permRes.json();
        if (permData.status === "success" && Array.isArray(permData.data)) setPermissionKeys(permData.data);
        else setPermissionKeys([]);

        if (saasData) {
          setSaasModules(saasData.modules || []);
        } else {
          setSaasModules([]);
        }
      } catch {
        setPermissionKeys([]);
        setSaasModules([]);
      }
    })();

    const saved = getSavedDockItems();
    setSlots(saved || DEFAULT_SLOTS);
  }, []);

  const pool = useMemo(() => {
    const p = getPermittedDockPool(permissionKeys, saasModules, userRole);
    // Add All Menu as a virtual item
    const menuCat = p.find(c => c.category === "Core");
    if (menuCat && !menuCat.items.find(i => i.href === "/menu")) {
        // We handle /menu specially in dock-menu.tsx already, 
        // but let's make it pickable here too.
        // Actually, we'll just show it.
    }
    return p;
  }, [permissionKeys, saasModules, userRole]);

  // Flat list for lookup
  const allItems = useMemo(() => {
    const flat: NavItem[] = [];
    pool.forEach(c => flat.push(...c.items));
    // Add /menu explicitly if not there
    if (!flat.find(i => i.href === "/menu")) {
        flat.push({ icon: Smartphone, label: "All Menu", href: "/menu" });
    }
    return flat;
  }, [pool]);

  const getItemByHref = (href: string) => {
    if (href === "/menu") return { icon: Smartphone, label: "All Menu", href: "/menu" };
    return allItems.find(it => it.href === href);
  };

  const handleSave = () => {
    saveDockItems(slots);
    toast({ title: "Saved", description: "Mobile dock configuration updated." });
    router.push("/menu");
  };

  const assignToSlot = (href: string) => {
    if (activeSlot === null) return;
    const newSlots = [...slots];
    newSlots[activeSlot] = href;
    setSlots(newSlots);
    setActiveSlot(null);
  };

  const filteredPool = pool.map(cat => ({
    ...cat,
    items: cat.items.filter(it => 
      it.label.toLowerCase().includes(search.toLowerCase()) || 
      cat.category.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <DashboardLayout fullWidth>
      <div className="max-w-4xl mx-auto space-y-8 pb-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Mobile Dock Setup</h1>
            <p className="text-muted-foreground">Assign features to your bottom navigation slots.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Slot Preview */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-xl bg-slate-950 text-white rounded-[2.5rem] overflow-hidden sticky top-24">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest opacity-60">Dock Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 p-8">
                <div className="space-y-4">
                  {slots.map((href, index) => {
                    const item = getItemByHref(href);
                    const isPrimary = index === 2;
                    const isActive = activeSlot === index;

                    return (
                      <div 
                        key={index}
                        onClick={() => setActiveSlot(index)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer group relative ${
                          isActive 
                            ? "border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.02]" 
                            : isPrimary 
                                ? "border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50" 
                                : "border-white/5 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <div className={`p-3 rounded-xl ${
                          isPrimary ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white/10 text-white/60"
                        }`}>
                          {item ? <item.icon className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">
                            Slot {index + 1} {isPrimary && "(Primary)"}
                          </p>
                          <p className="text-base font-bold italic tracking-tight">{item?.label || "Empty Slot"}</p>
                        </div>
                        {isActive && <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary rounded-full" />}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-white/5">
                  <Button onClick={handleSave} className="w-full h-14 bg-primary hover:bg-primary/90 text-lg font-black italic tracking-tight rounded-2xl shadow-2xl shadow-primary/40">
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Item Pool */}
          <div className="lg:col-span-2 space-y-6">
            {activeSlot === null ? (
              <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <MousePointer2 className="w-8 h-8 text-muted-foreground opacity-50" />
                </div>
                <div>
                    <h3 className="text-xl font-bold">Select a Slot to Assign</h3>
                    <p className="text-muted-foreground text-sm max-w-[280px]">Click a slot on the left to browse and assign a feature.</p>
                </div>
              </div>
            ) : (
              <Card className="border-none shadow-md rounded-[2.5rem] flex flex-col h-[700px] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter">
                            Assign to Slot {activeSlot + 1}
                        </CardTitle>
                        <CardDescription>Browse all permitted tools to add to this slot.</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setActiveSlot(null)} className="rounded-full">
                        <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="relative mt-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search features..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-12 h-12 bg-muted/50 border-none rounded-2xl text-base"
                    />
                  </div>
                </CardHeader>
                <ScrollArea className="flex-1 px-8 pb-8">
                  <div className="space-y-8 mt-4">
                    {filteredPool.map((cat) => (
                      <div key={cat.category} className="space-y-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2">
                          {cat.category}
                          <div className="h-px flex-1 bg-muted" />
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {cat.items.map((item: NavItem) => {
                            const isAssigned = slots.includes(item.href);
                            return (
                                <div
                                  key={item.href}
                                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer group ${
                                    isAssigned ? "opacity-50 grayscale bg-muted/20 border-transparent cursor-not-allowed" : "border-transparent bg-muted/20 hover:bg-muted/40 hover:scale-[1.02]"
                                  }`}
                                  onClick={() => !isAssigned && assignToSlot(item.href)}
                                >
                                  <div className={`p-2 rounded-xl transition-colors ${
                                    isAssigned ? "bg-muted text-muted-foreground" : "bg-white dark:bg-slate-950 text-muted-foreground group-hover:text-primary"
                                  }`}>
                                    <item.icon className="w-5 h-5" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold truncate">{item.label}</p>
                                    <p className="text-[10px] text-muted-foreground truncate opacity-60 uppercase tracking-widest">{isAssigned ? "Already Assigned" : item.href}</p>
                                  </div>
                                  {!isAssigned && <Plus className="w-5 h-5 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity" />}
                                </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
