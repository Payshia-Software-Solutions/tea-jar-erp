"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Terminal, 
  Code, 
  Database, 
  ExternalLink, 
  Copy, 
  Check, 
  Globe, 
  Shield, 
  Server,
  Key,
  Box,
  Image as ImageIcon,
  Layers,
  Info,
  Lock,
  Zap,
  Globe2,
  Table,
  MapPin,
  Settings,
  ShoppingBag,
  Users,
  CreditCard,
  Target,
  FolderTree,
  RefreshCw,
  ShieldCheck,
  ShieldAlert
} from "lucide-react";
import { CONTENT_BASE_URL, fetchApiClients, fetchSystemSettings, type ApiClientRow } from "@/lib/api";

import { useToast } from "@/hooks/use-toast";

export default function EcommerceDeveloperPage() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const [apiClients, setApiClients] = useState<ApiClientRow[]>([]);
  const [systemSettings, setSystemSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<{success: boolean, message: string, url: string} | null>(null);

  useEffect(() => {
    const loadDevData = async () => {
      try {
        const [clients, settings] = await Promise.all([
          fetchApiClients(),
          fetchSystemSettings()
        ]);
        setApiClients(clients);
        setSystemSettings(settings);
      } catch (e) {
        console.error("Failed to load developer data", e);
      } finally {
        setLoading(false);
      }
    };
    loadDevData();
  }, []);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost/rapair-management/server/public");
  const publicApiKey = systemSettings.PUBLIC_WEBSITE_API_KEY || "d5c7854b02485ed0e601d9486838093cb7881dfb8d6920c1543bf8ad9ddc12fc";

  return (
    <DashboardLayout title="Developer Options">
      <div className="flex flex-col gap-6 w-full pb-20 animate-in fade-in duration-500">
        
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            <span>E-commerce</span>
            <span className="opacity-20">/</span>
            <span className="text-foreground">Developer Options</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">API Documentation & Integration</h1>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1.5 py-1 px-3">
              <Zap className="w-3 h-3 fill-current" />
              API v2.5 Active
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-3xl">Comprehensive technical specifications for exposing your inventory to external storefronts, mobile apps, and 3rd party integrations using API Key authentication.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border shadow-sm bg-primary/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Status</p>
                <p className="text-sm font-bold text-emerald-600">Operational</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Public Domain</p>
                <p className="text-sm font-bold truncate max-w-[150px]">{API_BASE.replace('http://', '').replace('https://', '')}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Auth Method</p>
                <p className="text-sm font-bold">X-API-Key Header</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Data Format</p>
                <p className="text-sm font-bold">JSON / Sanitized</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="public-api" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-muted/50 p-1 rounded-xl h-auto">
            <TabsTrigger value="public-api" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
              <Globe2 className="w-4 h-4 mr-2" />
              Catalog
            </TabsTrigger>
            <TabsTrigger value="orders-users" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Orders & Users
            </TabsTrigger>
            <TabsTrigger value="geo-settings" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
              <MapPin className="w-4 h-4 mr-2" />
              Geo & Setup
            </TabsTrigger>
            <TabsTrigger value="auth-keys" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="content" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
              <ImageIcon className="w-4 h-4 mr-2" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm py-2">
              <Zap className="w-4 h-4 mr-2" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          {/* ... existing tabs content ... */}

          <TabsContent value="webhooks" className="mt-6 space-y-6">
            <Card className="border shadow-md overflow-hidden">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  PayHere Webhook Simulator
                </CardTitle>
                <CardDescription>Simulate a server-to-server notification from PayHere to test local fulfillment logic.</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Test Order ID</label>
                      <Input id="sim-order-id" placeholder="e.g. WEB-AD747ACF" className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Test Amount</label>
                      <Input id="sim-amount" placeholder="e.g. 45.00" defaultValue="45.00" className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status Code</label>
                      <select id="sim-status" className="w-full h-12 rounded-xl border bg-background px-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none">
                        <option value="2">2 - Success</option>
                        <option value="0">0 - Pending</option>
                        <option value="-1">-1 - Canceled</option>
                        <option value="-2">-2 - Failed</option>
                      </select>
                    </div>
                    <Button 
                      disabled={simulating}
                      onClick={async () => {
                        const orderId = (document.getElementById('sim-order-id') as HTMLInputElement).value;
                        const amount = (document.getElementById('sim-amount') as HTMLInputElement).value;
                        const status = (document.getElementById('sim-status') as HTMLSelectElement).value;
                        
                        if (!orderId) {
                          toast({ title: "Validation Error", description: "Please enter an Order ID", variant: "destructive" });
                          return;
                        }
                        
                        setSimulating(true);
                        setSimResult(null);
                        
                        const merchantId = systemSettings.payhere_merchant_id || '1210000';
                        const currency = 'LKR';
                        
                        const formData = new FormData();
                        formData.append('merchant_id', merchantId);
                        formData.append('order_id', orderId);
                        formData.append('payhere_amount', amount);
                        formData.append('payhere_currency', currency);
                        formData.append('status_code', status);
                        formData.append('payment_id', 'PAY-' + Math.random().toString(36).substr(2, 9).toUpperCase());
                        formData.append('md5sig', 'SIMULATED'); 
                        formData.append('simulated', '1'); 
                        
                        const targetUrl = API_BASE.includes('localhost:9003') 
                          ? 'http://localhost/rapair-management/server/public/api/payment/payhere_notify'
                          : `${API_BASE}/api/payment/payhere_notify`;

                        try {
                          const res = await fetch(targetUrl, {
                            method: 'POST',
                            body: formData
                          });
                          const text = await res.text();
                          setSimResult({ success: res.ok, message: text, url: targetUrl });
                          toast({ 
                            title: res.ok ? "Simulation Successful" : "Simulation Error", 
                            description: `Server responded with: ${text}` 
                          });
                        } catch (e: any) {
                          setSimResult({ success: false, message: e.message, url: targetUrl });
                          toast({ title: "Connection Failed", description: e.message, variant: "destructive" });
                        } finally {
                          setSimulating(false);
                        }
                      }}
                      className="w-full h-12 rounded-xl font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                      {simulating ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...</> : "Trigger Simulation"}
                    </Button>

                    {simResult && (
                      <div className={`p-4 rounded-xl border ${simResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-red-50 border-red-100 text-red-800'} animate-in slide-in-from-top-2 duration-300`}>
                        <p className="text-xs font-bold flex items-center gap-2 mb-1">
                          {simResult.success ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                          {simResult.success ? 'Webhook Delivered' : 'Delivery Failed'}
                        </p>
                        <p className="text-[10px] font-medium opacity-80 leading-relaxed italic">
                          Response: {simResult.message}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="bg-muted/30 rounded-2xl p-6 border border-dashed space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      Local Sandbox Mode
                    </h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This tool bypasses the public internet requirement by sending a POST request directly to your local PHP server.
                    </p>
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-muted-foreground uppercase">Computed Target Endpoint</p>
                       <code className="text-[10px] block p-2 bg-background rounded border font-mono break-all">
                        {API_BASE.includes('localhost:9003') 
                          ? 'http://localhost/rapair-management/server/public/api/payment/payhere_notify'
                          : `${API_BASE}/api/payment/payhere_notify`}
                       </code>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[10px] text-amber-800 leading-relaxed font-medium">
                      Note: The MD5 signature validation may fail if your Merchant Secret is not set correctly in System Settings, but the request will ALWAYS be recorded in the Webhook Logs.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Public Endpoints - Catalog */}
          <TabsContent value="public-api" className="mt-6 space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-800 mb-6">
               <Info className="w-5 h-5 mt-0.5 shrink-0" />
               <div className="space-y-1">
                 <p className="text-sm font-bold">Location-Aware Inventory</p>
                 <p className="text-xs leading-relaxed opacity-80">All catalog endpoints now require a <code>location_id</code> parameter to return accurate stock levels for specific branches. Only items marked as <strong>Online Enabled</strong> are exposed.</p>
               </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card className="border shadow-md overflow-hidden flex flex-col">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Box className="w-5 h-5 text-primary" />
                      Products & Stock
                    </CardTitle>
                    <CardDescription>Fetch products with real-time location balances.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 flex-1">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Badge className="bg-emerald-500 hover:bg-emerald-600 font-bold text-[10px]">GET</Badge>
                          <code className="text-xs font-mono text-primary font-bold">/api/publicitem/inventory?location_id=1</code>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => copy(`${API_BASE}/api/publicitem/inventory?location_id=1`, 'pub-list')} className="h-7 text-[10px] uppercase font-bold tracking-widest gap-2">
                          {copied === 'pub-list' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                          Copy
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Optional Filters</p>
                        <div className="text-[11px] space-y-1">
                          <div className="flex items-center gap-2"><code className="text-primary font-bold">collection_id</code><span className="text-muted-foreground opacity-60">Filter by collection (e.g. Featured)</span></div>
                          <div className="flex items-center gap-2"><code className="text-primary font-bold">category_id</code><span className="text-muted-foreground opacity-60">Filter by specific category</span></div>
                        </div>
                      </div>

                      <div className="bg-black/95 rounded-lg p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto shadow-inner h-[200px]">
                        <pre>{`{
  "status": "success",
  "data": [
    {
      "id": 1042,
      "name": "Premium Ceylon Tea",
      "sku": "PCT-001",
      "price": 1250,
      "is_in_stock": true,
      "stock_qty": 45,
      "attributes": [...]
    }
  ]
}`}</pre>
                      </div>
                    </div>
                  </CardContent>
               </Card>

               <Card className="border shadow-md overflow-hidden flex flex-col">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="w-5 h-5 text-primary" />
                      Classifications
                    </CardTitle>
                    <CardDescription>Get active storefront categories and collections.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6 flex-1">
                    <div className="space-y-4">
                      {[
                        { label: 'Sections', path: '/api/publicclassification/sections' },
                        { label: 'Departments', path: '/api/publicclassification/departments' },
                        { label: 'Categories', path: '/api/publicclassification/categories' },
                        { label: 'Collections', path: '/api/publicclassification/collections' },
                        { label: 'Collection Products', path: '/api/publiccollection/products/{id}?location_id=1' },
                      ].map(item => (
                        <div key={item.path} className="flex items-center justify-between gap-4 border-b pb-2 last:border-0 last:pb-0">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.label}</span>
                            <code className="text-[11px] font-mono text-primary">{item.path}</code>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => copy(`${API_BASE}${item.path}`, item.label)} className="h-7 text-[10px]">
                            {copied === item.label ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
               </Card>
            </div>
          </TabsContent>

          {/* Orders & Users */}
          <TabsContent value="orders-users" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card className="border shadow-md">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-primary" />
                      Order Placement
                    </CardTitle>
                    <CardDescription>Checkout and Order creation endpoints.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-500 font-bold text-[10px]">POST</Badge>
                      <code className="text-xs font-mono font-bold">/api/publicorder/create</code>
                    </div>
                    <p className="text-xs text-muted-foreground">Accepts full order JSON including items, customer details, and shipping address. Automatically links to existing customers or creates guest records.</p>
                    <div className="bg-black/95 rounded-lg p-4 font-mono text-[10px] text-blue-300 overflow-x-auto h-[200px]">
                      <pre>{`{
  "location_id": 1,
  "customer_details": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "0771234567"
  },
  "items": [
    { "item_id": 102, "quantity": 2, "unit_price": 500, "line_total": 1000 }
  ],
  "total_amount": 1000,
  "payment_method": "COD"
}`}</pre>
                    </div>
                  </CardContent>
               </Card>

               <Card className="border shadow-md">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      Customer Accounts
                    </CardTitle>
                    <CardDescription>Manage e-commerce user profiles and sessions.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-4">
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <Badge className="bg-blue-500 font-bold text-[10px]">POST</Badge>
                           <code className="text-xs font-mono font-bold">/api/publicecomuser/register</code>
                         </div>
                       </div>
                       <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <Badge className="bg-blue-500 font-bold text-[10px]">POST</Badge>
                           <code className="text-xs font-mono font-bold">/api/publicecomuser/login</code>
                         </div>
                       </div>
                       <p className="text-xs text-muted-foreground leading-relaxed p-3 bg-muted/50 rounded-lg">
                         E-commerce users are stored in the core <code>customers</code> table with an <code>is_ecommerce_user</code> flag and encrypted passwords.
                       </p>
                    </div>
                  </CardContent>
               </Card>
            </div>
          </TabsContent>

          {/* Geo & Setup */}
          <TabsContent value="geo-settings" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
               <Card className="border shadow-md">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-primary" />
                      Geographic Data
                    </CardTitle>
                    <CardDescription>Fetch administrative regions for addresses.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       {['countries', 'provinces', 'districts', 'cities'].map(geo => (
                         <div key={geo} className="p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors group">
                           <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{geo}</p>
                           <div className="flex items-center justify-between">
                             <code className="text-[11px] font-mono truncate">/api/publicgeo/{geo}</code>
                             <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100" onClick={() => copy(`${API_BASE}/api/publicgeo/${geo}`, geo)}>
                               <Copy className="w-3 h-3" />
                             </Button>
                           </div>
                         </div>
                       ))}
                    </div>
                  </CardContent>
               </Card>

               <Card className="border shadow-md">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FolderTree className="w-5 h-5 text-primary" />
                      Storefront Navigation
                    </CardTitle>
                    <CardDescription>Fetch multi-level navigation menus.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-4 border-b pb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Get Menu Tree</p>
                        <code className="text-xs font-mono text-primary">/api/publicstorefrontmenu/menus?location_id=1</code>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copy(`${API_BASE}/api/publicstorefrontmenu/menus?location_id=1`, 'nav-call')}>
                         {copied === 'nav-call' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Returns a hierarchical JSON tree of active menu items for a specific location.
                    </p>
                    <div className="bg-black/95 rounded-lg p-3 font-mono text-[9px] text-emerald-400 overflow-x-auto h-[120px]">
                      <pre>{`{
  "status": "success",
  "data": [
    {
      "id": 1,
      "label": "Shop",
      "link_type": "Internal",
      "is_mega_menu": true,
      "children": [...]
    }
  ]
}`}</pre>
                    </div>
                  </CardContent>
               </Card>

               <Card className="border shadow-md">
                  <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary" />
                      Storefront Config
                    </CardTitle>
                    <CardDescription>IPG, Analytics, and Pixel settings.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="flex items-center justify-between gap-4 border-b pb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-bold">Public Storefront Settings</p>
                        <code className="text-xs font-mono text-primary">/api/publicsettings/storefront?location_id=1</code>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => copy(`${API_BASE}/api/publicsettings/storefront?location_id=1`, 'settings-call')}>
                         {copied === 'settings-call' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { icon: CreditCard, label: 'PayHere' },
                        { icon: Target, label: 'Analytics' },
                        { icon: Globe, label: 'Pixel' }
                      ].map(item => (
                        <div key={item.label} className="flex flex-col items-center gap-2 p-3 rounded-xl border bg-card shadow-sm">
                           <item.icon className="w-5 h-5 text-muted-foreground" />
                           <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
               </Card>
            </div>
          </TabsContent>

          {/* API Keys (Same as before but with updated layout) */}
          <TabsContent value="auth-keys" className="mt-6 space-y-6">
             {/* ... existing API Keys content ... */}
             <Card className="border shadow-md overflow-hidden">
               <CardHeader className="bg-muted/30 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Key className="w-5 h-5 text-primary" />
                    Storefront API Access Keys
                  </CardTitle>
                  <CardDescription>Manage keys used by external storefronts to authenticate with this API.</CardDescription>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y">
                     <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <Badge className="bg-primary/10 text-primary hover:bg-primary/20 font-bold border-none">DEFAULT KEY</Badge>
                              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Public Access</span>
                           </div>
                        </div>
                        <div className="relative group">
                           <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                              <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                           </div>
                           <Input 
                              readOnly 
                              value={publicApiKey} 
                              className="font-mono text-[11px] pl-9 pr-24 h-10 bg-muted/30 border-dashed focus-visible:ring-0" 
                           />
                           <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">
                              <Button size="sm" onClick={() => copy(publicApiKey, 'key-global')} className="h-7 text-[10px] font-bold uppercase tracking-tighter px-3">
                                 {copied === 'key-global' ? 'Copied!' : 'Copy Key'}
                              </Button>
                           </div>
                        </div>
                     </div>
                     <div className="p-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Domain Restricted Clients</h4>
                        <div className="space-y-3">
                           {apiClients.length === 0 ? (
                              <p className="text-xs text-muted-foreground italic">No specific domain-restricted clients configured.</p>
                           ) : (
                              apiClients.map(client => (
                                 <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50 text-sm">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                          <Globe2 className="w-4 h-4 text-muted-foreground" />
                                       </div>
                                       <div>
                                          <p className="font-bold">{client.client_name}</p>
                                          <p className="text-[10px] text-muted-foreground font-mono">{client.domain}</p>
                                       </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={() => copy(client.api_key, `key-${client.id}`)} className="h-8 gap-2 text-[10px] font-bold uppercase">
                                       {copied === `key-${client.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                       Key
                                    </Button>
                                 </div>
                              ))
                           )}
                        </div>
                     </div>
                  </div>
               </CardContent>
            </Card>
          </TabsContent>

          {/* Media Assets */}
          <TabsContent value="content" className="mt-6 space-y-6">
            <Card className="border shadow-md">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <h3 className="font-bold text-lg">Media Assets & Image CDN</h3>
                  <p className="text-sm text-muted-foreground">High-performance image delivery for your storefront thumbnails and product galleries.</p>
                </div>
                <div className="grid gap-4">
                  <div className="p-4 rounded-xl border bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Base CDN URL</p>
                      <Button variant="ghost" size="sm" onClick={() => copy(CONTENT_BASE_URL, 'cdn-base')} className="h-6 text-[10px]">
                        {copied === 'cdn-base' ? 'COPIED' : 'COPY'}
                      </Button>
                    </div>
                    <code className="block p-3 rounded bg-muted font-mono text-sm break-all">{CONTENT_BASE_URL}</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center pt-10">
           <div className="flex items-center gap-6 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> API v2.5.0</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"></div> SDK v1.3.0</div>
              <div className="opacity-40">Build 2026.05.08</div>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
