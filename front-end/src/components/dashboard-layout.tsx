"use client"

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ClipboardList, 
  PlusCircle, 
  BarChart3, 
  Settings,
  LogOut,
  Wrench,
  Search,
  Bell,
  PlayCircle,
  User,
  Users,
  Grid,
  Tags,
  CheckSquare,
  ChevronRight,
  Database,
  Car,
  Layers,
  Tag,
  Shield,
  Sun,
  Moon,
  MapPin,
  Boxes,
  ArrowLeftRight,
  Truck,
  FileText,
  PackageCheck,
  History,
  ChevronDown,
  Percent,
  Landmark,
  CheckCircle2,
  Receipt,
  LayoutGrid,
  Factory,
  TrendingUp,
  Gift,
  Building2,
  ShoppingCart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api, fetchLocations } from '@/lib/api';
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from '@/components/ui/sidebar';
import { DockMenu } from './dock-menu';
import { PromotionsDialog } from './promotions-dialog';
import { SaasInfoDialog } from './saas-info-dialog';
import { 
  mainNavItems, 
  masterDataItems, 
  inventoryItems, 
  crmItems,
  salesItems,
  accountingItems, 
  adminNavItems, 
  serviceCenterItems,
  vendorItems,
  productionItems,
  hrmItems,
  frontOfficeItems,
  banquetItems,
  marketingItems,
  ecommerceItems
} from "@/lib/nav-items";

export function DashboardLayout({ children, fullWidth = true, title }: { children: React.ReactNode; fullWidth?: boolean; title?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>('');
  const [permissionKeys, setPermissionKeys] = useState<string[] | null>(null);
  const [isCoreFeaturesOpen, setIsCoreFeaturesOpen] = useState(true);
  const [isServiceCenterOpen, setIsServiceCenterOpen] = useState(false);
  const [isVendorsOpen, setIsVendorsOpen] = useState(false);
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isCrmOpen, setIsCrmOpen] = useState(false);
  const [isSalesOpen, setIsSalesOpen] = useState(false);
  const [isAccountingOpen, setIsAccountingOpen] = useState(false);
  const [isProductionOpen, setIsProductionOpen] = useState(false);
  const [isMarketingOpen, setIsMarketingOpen] = useState(false);
  const [isHrmOpen, setIsHrmOpen] = useState(false);
  const [isFrontOfficeOpen, setIsFrontOfficeOpen] = useState(false);
  const [isBanquetOpen, setIsBanquetOpen] = useState(false);
  const [isEcommerceOpen, setIsEcommerceOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
	  const [theme, setTheme] = useState<'light' | 'dark'>('light');
	  const [availableLocations, setAvailableLocations] = useState<Array<{ id: number; name: string }>>([]);
	  const [currentLocationId, setCurrentLocationId] = useState<number | null>(null);
	  const [currentLocationName, setCurrentLocationName] = useState<string>('');
	  const [docTitle, setDocTitle] = useState<string>('');
	  const [isPromotionsOpen, setIsPromotionsOpen] = useState(false);
	  const [saasModules, setSaasModules] = useState<string[] | null>(null);
	  const [saasPackageName, setSaasPackageName] = useState<string>('');
	  const [saasLicenseKey, setSaasLicenseKey] = useState<string>('');
	  const [saasTenantName, setSaasTenantName] = useState<string>('');
	  const [saasRenewalDate, setSaasRenewalDate] = useState<string>('');
	  const [saasInvoices, setSaasInvoices] = useState<any[]>([]);
	  const [isSaasDialogOpen, setIsSaasDialogOpen] = useState(false);
	  // Location switching uses the /select-location page (card UI) for a consistent UX.

	  const loadPerms = async () => {
    try {
      const res = await api('/api/auth/permissions');
      const data = await res.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        setPermissionKeys(data.data);
      } else {
        setPermissionKeys([]);
      }
    } catch {
      setPermissionKeys([]);
    }
  };

  useEffect(() => {
    // Basic client-side guard. Server APIs also enforce auth via JWT.
    const token = window.localStorage.getItem('auth_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    try {
      const part = token.split('.')[1];
      const json = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));
      setUserRole(String(json.role || ''));

      // Initialize current location from localStorage if present; fallback to JWT.
      const lsId = window.localStorage.getItem('location_id');
      const lsName = window.localStorage.getItem('location_name');
      const tokenLocId = json.location_id ? Number(json.location_id) : 1;
      const tokenLocName = json.location_name ? String(json.location_name) : '-';
      const initId = lsId ? Number(lsId) : tokenLocId;
      // Only trust the stored name if we also have a stored id (prevents mismatched/stale name after login).
      const initName = lsId ? (lsName || tokenLocName) : tokenLocName;
      setCurrentLocationId(Number.isFinite(initId) ? initId : tokenLocId);
      setCurrentLocationName(initName);

      // Available locations: Admin can load all. Non-admin uses allowed_locations from JWT.
      const allowed = Array.isArray(json.allowed_locations) ? json.allowed_locations : [];
      const allowedClean = allowed
        .map((x: any) => ({ id: Number(x?.id), name: String(x?.name ?? '') }))
        .filter((x: any) => x.id > 0 && x.name);
      if (String(json.role || '').toLowerCase() !== 'admin') {
        setAvailableLocations(allowedClean.length > 0 ? allowedClean : (tokenLocId ? [{ id: tokenLocId, name: tokenLocName }] : []));
      }
    } catch {
      setUserRole('');
    }

    void loadPerms();
    void loadSaas();
	  }, []);

  const loadSaas = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saas/config`);
      const data = await res.json();
      if (data.status === 'success' && data.data) {
        setSaasModules(data.data.modules);
        setSaasPackageName(data.data.name || data.data.package_name);
        setSaasLicenseKey(data.data.license_key || '');
        setSaasTenantName(data.data.tenant_name || '');
        setSaasRenewalDate(data.data.renewal_date || '');
        setSaasInvoices(data.data.invoices || []);
      }
    } catch (err) {
      console.error("SaaS Check Failed", err);
    }
  };

  const handleSaasSync = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/saas/sync`);
      const data = await res.json();
      if (data.status === 'success') {
        await loadSaas();
      }
    } catch (err) {
      console.error("SaaS Sync Failed", err);
    }
  };

	  useEffect(() => {
	    // Keep a lightweight "document title" label in the header.
	    // Next.js updates document.title after navigation; read it on pathname changes.
	    try {
	      const t = window.setTimeout(() => {
	        const raw = (document.title || "").trim();
	        const pretty = raw.includes("|") ? raw.split("|").slice(-1)[0].trim() : raw;
	        setDocTitle(pretty);
	      }, 0);
	      return () => window.clearTimeout(t);
	    } catch {
	      // ignore
	    }
	  }, [pathname]);

  useEffect(() => {
    if (userRole.toLowerCase() !== 'admin') return;

    // Admin can switch context to any location.
    void (async () => {
      try {
        const locs = await fetchLocations();
        const cleaned = Array.isArray(locs)
          ? locs.map((l: any) => ({ id: Number(l.id), name: String(l.name ?? '') })).filter((l: any) => l.id > 0 && l.name)
          : [];
        setAvailableLocations(cleaned);

        // If we have no selection yet, pick #1.
        if (!currentLocationId && cleaned.length > 0) {
          setCurrentLocationId(cleaned[0].id);
          setCurrentLocationName(cleaned[0].name);
          window.localStorage.setItem('location_id', String(cleaned[0].id));
          window.localStorage.setItem('location_name', String(cleaned[0].name));
        }
      } catch {
        // ignore
      }
    })();
  }, [userRole]);

  useEffect(() => {
    // Keep current location name synced when locations list arrives/changes.
    if (!currentLocationId) return;
    const match = availableLocations.find((l) => l.id === currentLocationId);
    if (match?.name && match.name !== currentLocationName) {
      setCurrentLocationName(match.name);
      window.localStorage.setItem('location_name', match.name);
    }
  }, [availableLocations, currentLocationId, currentLocationName]);

  useEffect(() => {
    // Reflect the current theme (class on <html>) so both toggles stay in sync.
    const current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    setTheme(current);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'theme') return;
      const next = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
      setTheme(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    const onPermsUpdated = () => {
      // Re-fetch permissions so nav updates immediately after RBAC changes.
      void (async () => {
        try {
          const res = await api('/api/auth/permissions');
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.data)) {
            setPermissionKeys(data.data);
          } else {
            setPermissionKeys([]);
          }
        } catch {
          setPermissionKeys([]);
        }
      })();
    };

    window.addEventListener('rbac:updated', onPermsUpdated);
    return () => window.removeEventListener('rbac:updated', onPermsUpdated);
  }, []);

  const handleLogout = () => {
    window.localStorage.removeItem('auth_token');
    window.localStorage.removeItem('location_id');
    window.localStorage.removeItem('location_name');
    router.push('/login');
  };

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      window.localStorage.setItem('theme', 'light');
      setTheme('light');
    } else {
      document.documentElement.classList.add('dark');
      window.localStorage.setItem('theme', 'dark');
      setTheme('dark');
    }
  };

  const setLocationContext = (id: number) => {
    const loc = availableLocations.find((l) => l.id === id);
    setCurrentLocationId(id);
    setCurrentLocationName(loc?.name ?? '');
    window.localStorage.setItem('location_id', String(id));
    if (loc?.name) window.localStorage.setItem('location_name', String(loc.name));
    else window.localStorage.removeItem('location_name');
  };

  const openLocationSwitcher = () => {
    const ret = encodeURIComponent(pathname || "/dashboard");
    router.push(`/select-location?return=${ret}`);
  };

  const hasPerm = (perm?: string) => {
    if (!perm) return true;
    if (!permissionKeys) return true; // render immediately; will filter once loaded
    if (permissionKeys.includes('*')) return true;
    return permissionKeys.includes(perm);
  };

  const isModuleAllowed = (module: string) => {
    if (!saasModules) return true; // Wait for load
    if (saasModules.includes('*')) return true;
    return saasModules.includes(module);
  };

  const visibleMainNavItems = mainNavItems.filter((it) => hasPerm((it as any).perm));
  const canSeeCoreFeatures = visibleMainNavItems.length > 0;

  const visibleServiceCenterItems = serviceCenterItems.filter((it) => hasPerm((it as any).perm));
  const canSeeServiceCenter = isModuleAllowed('serviceCenter') && visibleServiceCenterItems.length > 0;

  const visibleVendorItems = vendorItems.filter((it) => hasPerm((it as any).perm));
  const canSeeVendors = isModuleAllowed('vendors') && visibleVendorItems.length > 0;

  const visibleInventoryItems = inventoryItems.filter((it) => {
    const permOk = hasPerm((it as any).perm);
    if (!permOk) return false;
    // Promotions are now handled separately in the Marketing section
    if (it.label === 'Promotions') return false;
    return isModuleAllowed('inventory');
  });
  const canSeeInventory = visibleInventoryItems.length > 0;

  const visibleMarketingItems = marketingItems.filter((it) => hasPerm(it.perm));
  const canSeeMarketing = isModuleAllowed('promotions') && visibleMarketingItems.length > 0;

  const visibleCrmItems = crmItems.filter((it) => hasPerm((it as any).perm));
  const canSeeCrm = isModuleAllowed('crm') && visibleCrmItems.length > 0;

  const visibleSalesItems = salesItems.filter((it) => hasPerm((it as any).perm));
  const canSeeSales = isModuleAllowed('sales') && visibleSalesItems.length > 0;

  const visibleMasterDataItems = masterDataItems.filter((it) => hasPerm((it as any).perm));
  const canSeeMasterData = isModuleAllowed('masterData') && visibleMasterDataItems.length > 0;

  const visibleAccountingItems = accountingItems.filter((it) => hasPerm((it as any).perm));
  const canSeeAccounting = isModuleAllowed('accounting') && visibleAccountingItems.length > 0;

  const visibleProductionItems = productionItems.filter((it) => hasPerm((it as any).perm));
  const canSeeProduction = isModuleAllowed('production') && visibleProductionItems.length > 0;

  const visibleHrmItems = hrmItems.filter((it) => hasPerm((it as any).perm));
  const canSeeHrm = isModuleAllowed('hrm') && visibleHrmItems.length > 0;

  const visibleFrontOfficeItems = frontOfficeItems.filter((it) => hasPerm((it as any).perm));
  const canSeeFrontOffice = isModuleAllowed('frontOffice') && visibleFrontOfficeItems.length > 0;

  const visibleBanquetItems = banquetItems.filter((it) => hasPerm((it as any).perm));
  const canSeeBanquet = isModuleAllowed('banquet') && visibleBanquetItems.length > 0;

  const visibleEcommerceItems = ecommerceItems.filter((it) => hasPerm((it as any).perm));
  const canSeeEcommerce = isModuleAllowed('ecommerce') && visibleEcommerceItems.length > 0;


  const adminItems = userRole.toLowerCase() === 'admin' ? adminNavItems : [];
  const canSeeAdmin = adminItems.length > 0;

  const allHrefs = React.useMemo(() => {
    return [
      ...mainNavItems, ...serviceCenterItems, ...vendorItems, ...inventoryItems,
      ...crmItems, ...salesItems, ...masterDataItems, ...accountingItems,
      ...productionItems, ...hrmItems, ...frontOfficeItems, ...banquetItems, ...ecommerceItems, ...adminItems
    ].map(i => i.href);
  }, [adminItems]);

  const isActiveRoute = (href: string) => {
    if (pathname === href) return true;
    if (!pathname.startsWith(`${href}/`)) return false;
    
    // If it's a sub-path, ensure there isn't a longer, more specific match available.
    const longerMatch = allHrefs.find(otherHref => 
       otherHref !== href && 
       otherHref.length > href.length && 
       (pathname === otherHref || pathname.startsWith(`${otherHref}/`))
    );
    
    return !longerMatch;
  };

  // Auto-open active dropdown on navigation, but allow users to close it manually
  useEffect(() => {
    if (visibleMainNavItems.some(i => isActiveRoute(i.href))) setIsCoreFeaturesOpen(true);
    if (visibleServiceCenterItems.some(i => pathname.startsWith(i.href))) setIsServiceCenterOpen(true);
    if (visibleVendorItems.some(i => pathname.startsWith(i.href)) || pathname.startsWith('/vendors')) setIsVendorsOpen(true);
    if (pathname.startsWith('/inventory')) setIsInventoryOpen(true);
    if (pathname.startsWith('/master-data')) setIsMasterDataOpen(true);
    if (visibleCrmItems.some(i => isActiveRoute(i.href))) setIsCrmOpen(true);
    if (visibleSalesItems.some(i => isActiveRoute(i.href))) setIsSalesOpen(true);
    if (visibleMarketingItems.some(i => isActiveRoute(i.href))) setIsMarketingOpen(true);
    if (pathname.startsWith('/accounting')) setIsAccountingOpen(true);
    if (pathname.startsWith('/production')) setIsProductionOpen(true);
    if (pathname.startsWith('/hrm')) setIsHrmOpen(true);
    if (pathname.startsWith('/front-office')) setIsFrontOfficeOpen(true);
    if (pathname.startsWith('/banquet')) setIsBanquetOpen(true);
    if (pathname.startsWith('/ecommerce')) setIsEcommerceOpen(true);
    if (pathname.startsWith('/admin')) setIsAdminOpen(true);
  }, [pathname, permissionKeys, userRole]);

  const coreFeaturesOpen = isCoreFeaturesOpen;
  const serviceCenterOpen = isServiceCenterOpen;
  const vendorsOpen = isVendorsOpen;
  const inventoryOpen = isInventoryOpen;
  const masterDataOpen = isMasterDataOpen;
  const crmOpen = isCrmOpen;
  const salesOpen = isSalesOpen;
  const accountingOpen = isAccountingOpen;
  const productionOpen = isProductionOpen;
  const marketingOpen = isMarketingOpen;
  const hrmOpen = isHrmOpen;
  const frontOfficeOpen = isFrontOfficeOpen;
  const banquetOpen = isBanquetOpen;
  const ecommerceOpen = isEcommerceOpen;
  const adminOpen = isAdminOpen;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background relative" suppressHydrationWarning>
        <Sidebar variant="sidebar" collapsible="icon" className="border-r-0 hidden lg:flex">
          <SidebarHeader className="h-16 flex items-center px-4 sm:px-6">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 shrink-0 relative">
                <img 
                  src="/icon-bizzflow-logo-optimized.webp" 
                  alt="BizzFlow Icon" 
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <div className="text-lg font-black tracking-tighter text-white italic">
                  BizzFlow
                </div>
                <div className="text-[9px] text-white/60 uppercase tracking-[0.2em] font-black leading-tight">
                  {currentLocationName || "Global Management"}
                </div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-2 py-4 gap-1">
                        <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeCoreFeatures ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsCoreFeaturesOpen((v) => !v)}
                        isActive={coreFeaturesOpen}
                        tooltip="Core Features"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          coreFeaturesOpen ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Core Features</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            coreFeaturesOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {coreFeaturesOpen ? (
                        <SidebarMenuSub>
                          {visibleMainNavItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeServiceCenter ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsServiceCenterOpen((v) => !v)}
                        isActive={serviceCenterOpen}
                        tooltip="Fleet Management"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          serviceCenterOpen ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Wrench className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Fleet Management</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            serviceCenterOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {serviceCenterOpen ? (
                        <SidebarMenuSub>
                          {visibleServiceCenterItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeVendors ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsVendorsOpen((v) => !v)}
                        isActive={vendorsOpen}
                        tooltip="Vendors"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          vendorsOpen ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Truck className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Vendors</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            vendorsOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {vendorsOpen ? (
                        <SidebarMenuSub>
                          {visibleVendorItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeInventory ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsInventoryOpen((v) => !v)}
                        isActive={pathname.startsWith('/inventory')}
                        tooltip="Inventory"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          pathname.startsWith('/inventory') ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Boxes className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Inventory</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            inventoryOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {inventoryOpen ? (
                        <SidebarMenuSub>
                          {visibleInventoryItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeCrm ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsCrmOpen((v) => !v)}
                        isActive={crmOpen}
                        tooltip="CRM"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          crmOpen ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">CRM</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            crmOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {crmOpen ? (
                        <SidebarMenuSub>
                          {visibleCrmItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href} target={item.newTab ? "_blank" : undefined}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeSales ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsSalesOpen((v) => !v)}
                        isActive={salesOpen}
                        tooltip="Sales"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          salesOpen ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <TrendingUp className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Sales</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            salesOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {salesOpen ? (
                        <SidebarMenuSub>
                          {visibleSalesItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href} target={item.newTab ? "_blank" : undefined}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeMarketing ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsMarketingOpen((v) => !v)}
                        isActive={marketingOpen}
                        tooltip="Marketing"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          marketingOpen ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Gift className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Marketing</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            marketingOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {marketingOpen ? (
                        <SidebarMenuSub>
                          {visibleMarketingItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeEcommerce ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsEcommerceOpen((v) => !v)}
                        isActive={ecommerceOpen}
                        tooltip="E-commerce"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          ecommerceOpen ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <ShoppingCart className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">E-commerce</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            ecommerceOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {ecommerceOpen ? (
                        <SidebarMenuSub>
                          {visibleEcommerceItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">

              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeAccounting ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsAccountingOpen((v) => !v)}
                        isActive={pathname.startsWith('/accounting')}
                        tooltip="Accounting"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          pathname.startsWith('/accounting') ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Landmark className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Accounting</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            accountingOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {accountingOpen ? (
                        <SidebarMenuSub>
                          {visibleAccountingItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeProduction ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsProductionOpen((v) => !v)}
                        isActive={pathname.startsWith('/production')}
                        tooltip="Production"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          pathname.startsWith('/production') ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Factory className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Production</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            productionOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {productionOpen ? (
                        <SidebarMenuSub>
                          {visibleProductionItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeHrm ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsHrmOpen((v) => !v)}
                        isActive={pathname.startsWith('/hrm')}
                        tooltip="Human Resources"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          pathname.startsWith('/hrm') ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Human Resources</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            hrmOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {hrmOpen ? (
                        <SidebarMenuSub>
                          {visibleHrmItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeFrontOffice ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsFrontOfficeOpen((v) => !v)}
                        isActive={pathname.startsWith('/front-office')}
                        tooltip="Front Office"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          pathname.startsWith('/front-office') ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Building2 className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Front Office</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            frontOfficeOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {frontOfficeOpen ? (
                        <SidebarMenuSub>
                          {visibleFrontOfficeItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeBanquet ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsBanquetOpen((v) => !v)}
                        isActive={pathname.startsWith('/banquet')}
                        tooltip="Banquet"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          pathname.startsWith('/banquet') ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <LayoutGrid className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Banquet</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            banquetOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {banquetOpen ? (
                        <SidebarMenuSub>
                          {visibleBanquetItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="p-0">
              <SidebarGroupContent>
                <SidebarMenu>
                  {!canSeeMasterData ? null : (
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        type="button"
                        onClick={() => setIsMasterDataOpen((v) => !v)}
                        isActive={pathname.startsWith('/master-data')}
                        tooltip="Master Data"
                        className={cn(
                          "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                          pathname.startsWith('/master-data') ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                        )}
                      >
                        <Grid className="w-5 h-5" />
                        <span className="text-base sm:text-sm font-medium">Master Data</span>
                        <ChevronRight
                          className={cn(
                            "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                            masterDataOpen ? "rotate-90" : "rotate-0"
                          )}
                        />
                      </SidebarMenuButton>

                      {masterDataOpen ? (
                        <SidebarMenuSub>
                          {visibleMasterDataItems.map((item) => (
                            <SidebarMenuSubItem key={item.href}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActiveRoute(item.href)}
                              >
                                <Link href={item.href}>
                                  <item.icon className="w-4 h-4" />
                                  <span>{item.label}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      ) : null}
                    </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="mt-auto p-0">
              <SidebarMenu>
                {!canSeeAdmin ? null : (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      type="button"
                      onClick={() => setIsAdminOpen((v) => !v)}
                      isActive={pathname.startsWith('/admin')}
                      tooltip="Administration"
                      className={cn(
                        "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                        pathname.startsWith('/admin') ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                      )}
                    >
                      <Shield className="w-5 h-5" />
                      <span className="text-base sm:text-sm font-medium">Administration</span>
                      <ChevronRight
                        className={cn(
                          "ml-auto w-4 h-4 transition-transform group-data-[collapsible=icon]:hidden",
                          adminOpen ? "rotate-90" : "rotate-0"
                        )}
                      />
                    </SidebarMenuButton>

                    {adminOpen ? (
                      <SidebarMenuSub>
                        {adminItems.map((item) => (
                          <SidebarMenuSubItem key={item.href}>
                            <SidebarMenuSubButton asChild isActive={isActiveRoute(item.href)}>
                              <Link href={item.href}>
                                <item.icon className="w-4 h-4" />
                                <span>{item.label}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                )}
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={pathname === '/profile'}
                    tooltip="Profile"
                    className={cn(
                      "transition-all duration-200 py-6 sm:py-2 text-white/80 hover:text-white",
                      pathname === '/profile' ? "bg-sidebar-accent text-white" : "hover:bg-sidebar-accent/50"
                    )}
                  >
                    <Link href="/profile">
                      <User className="w-5 h-5" />
                      <span className="text-base sm:text-sm font-medium">Profile</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="px-4 py-2 flex items-center justify-between group-data-[collapsible=icon]:hidden">
                   {/* Removed SaaS info from sidebar as per user request */}
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  className="text-white/70 hover:text-white py-6 sm:py-2"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span className="text-base sm:text-sm font-medium">
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  tooltip="Logout" 
                  className="text-white/70 hover:text-white py-6 sm:py-2"
                  onClick={handleLogout}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-base sm:text-sm font-medium">Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col min-w-0">
          <header className="h-16 border-b bg-card px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:flex gap-2 bg-primary/5 border-primary/20 hover:bg-primary/10 text-primary font-semibold"
                onClick={() => setIsPromotionsOpen(true)}
              >
                <Percent className="w-4 h-4" />
                Promotions
              </Button>

              {saasPackageName && (
                <button 
                  onClick={() => setIsSaasDialogOpen(true)}
                  className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-all group"
                >
                  <Shield className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black uppercase tracking-tight text-primary leading-none">{saasPackageName}</span>
                    <span className="text-[8px] font-bold text-muted-foreground/60 leading-none mt-1 uppercase tracking-widest">Active Plan</span>
                  </div>
                </button>
              )}
              <div className="lg:hidden p-1.5 bg-accent rounded-lg mr-2">
                <Wrench className="w-4 h-4 text-primary" />
              </div>
              <SidebarTrigger className="h-10 w-10 hidden lg:flex" />
              <div className="relative w-48 md:w-96 hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search orders..." 
                  className="pl-9 bg-muted/30 border-none ring-offset-background"
                />
              </div>
              {availableLocations.length > 0 ? (
                <div className="hidden md:flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 w-[240px] justify-between bg-muted/20 border-none"
                    onClick={openLocationSwitcher}
                  >
                    <span className="truncate">{currentLocationName || "Select location"}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : null}
              <div className="lg:hidden flex items-center gap-2">
                <img 
                  src="/icon-bizzflow-logo-optimized.webp" 
                  alt="BizzFlow Icon" 
                  className="w-8 h-8 object-contain"
                />
                <h1 className="font-bold text-lg tracking-tight">BizzFlow</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              {docTitle ? (
                <div className="hidden md:block max-w-[260px] truncate text-sm font-semibold text-foreground/90">
                  {docTitle}
                </div>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                className="relative h-10 w-10"
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              <Button variant="ghost" size="icon" className="relative h-10 w-10">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-accent rounded-full border-2 border-background" />
              </Button>
              <Link href="/profile">
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 border-2 border-primary/10 cursor-pointer hover:border-accent transition-colors">
                  <AvatarImage src="https://picsum.photos/seed/user/32/32" />
                  <AvatarFallback>FO</AvatarFallback>
                </Avatar>
              </Link>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-y-auto pb-24 lg:pb-8" suppressHydrationWarning>
            <div
              className={cn(
                fullWidth ? "w-full" : "max-w-7xl mx-auto",
                "min-h-full flex flex-col"
              )}
            >
              <div className="flex-1 space-y-6 sm:space-y-8">
                {children}
              </div>

              <div className="pt-6 border-t text-[11px] text-muted-foreground flex flex-row flex-wrap items-center justify-between gap-2">
                <span>Powered by Nebulink</span>
                <a
                  className="text-foreground/80 hover:text-foreground underline underline-offset-2"
                  href="https://www.nebulink.com"
                  target="_blank"
                  rel="noreferrer"
                >
                  www.nebulink.com
                </a>
              </div>
            </div>
          </main>
        </SidebarInset>

        <DockMenu />
        <PromotionsDialog 
          open={isPromotionsOpen} 
          onOpenChange={setIsPromotionsOpen} 
          locationId={currentLocationId}
          locationName={currentLocationName}
        />
        <SaasInfoDialog 
          isOpen={isSaasDialogOpen} 
          onClose={() => setIsSaasDialogOpen(false)} 
          tenantName={saasTenantName}
          packageName={saasPackageName}
          licenseKey={saasLicenseKey}
          modules={saasModules}
          renewalDate={saasRenewalDate}
          invoices={saasInvoices}
          onSync={handleSaasSync}
        />
      </div>
    </SidebarProvider>
  );
}
