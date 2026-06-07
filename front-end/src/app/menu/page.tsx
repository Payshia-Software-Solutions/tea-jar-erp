"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight, LogOut, MapPin, User, Settings, LayoutDashboard, Wrench, Truck, Boxes, Users, TrendingUp, Gift, Landmark, Factory, Building2, LayoutGrid, Grid, Shield } from "lucide-react";
import { api } from "@/lib/api";
import { 
  adminNavItems, 
  inventoryItems, 
  mainNavItems, 
  masterDataItems, 
  serviceCenterItems,
  vendorItems,
  crmItems,
  salesItems,
  accountingItems,
  productionItems,
  hrmItems,
  frontOfficeItems,
  type NavItem 
} from "@/lib/nav-items";

function decodeJwtPayload(token: string): any | null {
  try {
    const part = token.split(".")[1];
    return JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

export default function MenuPage() {
  const router = useRouter();
  const [permissionKeys, setPermissionKeys] = useState<string[] | null>(null);
  const [saasModules, setSaasModules] = useState<string[] | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [locationName, setLocationName] = useState<string>("");

  useEffect(() => {
    const token = window.localStorage.getItem("auth_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const payload = decodeJwtPayload(token);
    setUserName(String(payload?.name ?? ""));
    setUserRole(String(payload?.role ?? ""));
    setLocationName(String(window.localStorage.getItem("location_name") ?? payload?.location_name ?? ""));

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
        if (!saasData) promises.push(fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saas/config`).then(r => r.json()));

        const results = await Promise.all(promises);
        const permRes = results[0];
        const saasRes = !saasData ? results[1] : null;

        if (saasRes && saasRes.status === 'success' && saasRes.data) {
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
  }, [router]);

  const initials = useMemo(() => {
    const parts = (userName || "").trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "U";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase();
  }, [userName]);

  const hasPerm = (perm?: string) => {
    if (!perm) return true;
    if (!permissionKeys) return true;
    if (permissionKeys.includes("*")) return true;
    return permissionKeys.includes(perm);
  };

  const isModuleAllowed = (module: string) => {
    if (!saasModules) return true; // Wait for load
    if (saasModules.includes("*")) return true;
    return saasModules.includes(module);
  };

  const sections = useMemo(() => {
    if (!permissionKeys) return [];

    const core = mainNavItems.filter((it) => hasPerm(it.perm));
    const service = isModuleAllowed('serviceCenter') ? serviceCenterItems.filter(it => hasPerm(it.perm)) : [];
    const vendors = isModuleAllowed('vendors') ? vendorItems.filter(it => hasPerm(it.perm)) : [];
    const inv = isModuleAllowed('inventory') ? inventoryItems.filter((it) => hasPerm(it.perm) && it.label !== 'Promotions') : [];
    const crm = isModuleAllowed('crm') ? crmItems.filter(it => hasPerm(it.perm)) : [];
    const sales = isModuleAllowed('sales') ? salesItems.filter(it => hasPerm(it.perm)) : [];
    const marketing = isModuleAllowed('promotions') ? inventoryItems.filter(it => it.label === 'Promotions' && hasPerm(it.perm)) : [];
    const acc = isModuleAllowed('accounting') ? accountingItems.filter(it => hasPerm(it.perm)) : [];
    const prod = isModuleAllowed('production') ? productionItems.filter(it => hasPerm(it.perm)) : [];
    const hrm = isModuleAllowed('hrm') ? hrmItems.filter(it => hasPerm(it.perm)) : [];
    const front = isModuleAllowed('frontOffice') ? frontOfficeItems.filter(it => hasPerm(it.perm)) : [];
    const master = isModuleAllowed('masterData') ? masterDataItems.filter((it) => hasPerm(it.perm)) : [];
    const admin = userRole.toLowerCase() === "admin" ? adminNavItems : [];

    return [
      { title: "Core Features", tone: "bg-blue-600", items: core, icon: LayoutDashboard },
      { title: "Fleet Management", tone: "bg-orange-600", items: service, icon: Wrench },
      { title: "Vendors", tone: "bg-slate-600", items: vendors, icon: Truck },
      { title: "Inventory", tone: "bg-emerald-600", items: inv, icon: Boxes },
      { title: "CRM", tone: "bg-pink-600", items: crm, icon: Users },
      { title: "Sales", tone: "bg-cyan-600", items: sales, icon: TrendingUp },
      { title: "Marketing", tone: "bg-purple-600", items: marketing, icon: Gift },
      { title: "Accounting", tone: "bg-amber-600", items: acc, icon: Landmark },
      { title: "Production", tone: "bg-indigo-600", items: prod, icon: Factory },
      { title: "HRM", tone: "bg-rose-600", items: hrm, icon: Users },
      { title: "Front Office", tone: "bg-violet-600", items: front, icon: Building2 },
      { title: "Master Data", tone: "bg-zinc-600", items: master, icon: Grid },
      { title: "Administration", tone: "bg-slate-700", items: admin, icon: Shield },
    ].filter((s) => s.items.length > 0);
  }, [permissionKeys, userRole, saasModules]);

  const isLoading = permissionKeys === null || saasModules === null;

  const handleLogout = () => {
    window.localStorage.removeItem("auth_token");
    window.localStorage.removeItem("location_id");
    window.localStorage.removeItem("location_name");
    window.location.href = "/login";
  };

  const openLocationSwitcher = () => {
    window.location.href = "/select-location?return=%2Fdashboard";
  };

  const subtitle = `${userRole || "-"}${locationName ? ` - ${locationName}` : ""}`;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <Link href="/profile">
          <Card className="border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden bg-primary text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-white/20">
                    <AvatarImage src="https://picsum.photos/seed/user/64/64" />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-bold">{userName || "User"}</h2>
                    <p className="text-white/70 text-sm">{subtitle}</p>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-white/50" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-12 rounded-xl justify-start gap-2" onClick={openLocationSwitcher}>
            <MapPin className="w-4 h-4" />
            Switch Location
          </Button>
          <Button variant="outline" className="h-12 rounded-xl justify-start gap-2" asChild>
            <Link href="/profile">
              <User className="w-4 h-4" />
              Profile
            </Link>
          </Button>
          <Button variant="outline" className="h-12 rounded-xl justify-start gap-2" asChild>
            <Link href="/settings/mobile-dock">
                <Settings className="w-4 h-4" />
                Customize Dock
            </Link>
          </Button>
        </div>

        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-muted/10 rounded-xl px-4 py-4 flex items-center gap-3 animate-pulse border border-muted/20">
                  <Skeleton className="w-7 h-7 rounded-md" />
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="w-4 h-4 ml-auto rounded-full" />
                </div>
              ))}
            </div>
          ) : (
            <Accordion type="multiple" className="w-full space-y-4">
              {sections.map((section) => (
                <AccordionItem key={section.title} value={section.title} className="border-none bg-muted/20 rounded-xl px-4">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center justify-center p-1.5 rounded-md ${section.tone} text-white`}>
                        <section.icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{section.title}</h3>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-3 pb-2">
                      {section.items.map((item: NavItem) => (
                        <Link key={item.href} href={item.href}>
                          <Card className="border-none shadow-sm hover:bg-muted/80 transition-colors h-full bg-background">
                            <CardContent className="p-4 flex flex-col items-start gap-3">
                              <div className={`p-2 rounded-lg text-white ${section.tone}`}>
                                <item.icon className="w-5 h-5" />
                              </div>
                              <span className="font-semibold text-sm">{item.label}</span>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <Button variant="destructive" className="w-full h-12 rounded-xl font-bold gap-2 shadow-lg shadow-destructive/10" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            Sign Out
          </Button>
          <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest font-bold">BizzFlow</p>
        </div>
      </div>
    </DashboardLayout>
  );
}

