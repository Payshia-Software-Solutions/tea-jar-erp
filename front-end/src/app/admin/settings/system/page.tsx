"use client"

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { fetchSystemSettings, updateSystemSettings, testSms, fetchApiClients, createApiClient, deleteApiClient, regenerateApiClientKey, toggleApiClientStatus, ApiClientRow, fetchLocations, ServiceLocation, syncMorningMileage } from "@/lib/api";
import { Settings, Mail, MessageSquare, Save, Loader2, Link2, ShieldCheck, UserCheck, Smartphone, Globe, Copy, RotateCw, CheckCircle2, AlertCircle, Plus, Trash2, ExternalLink, Eye, EyeOff, CreditCard, Factory, Building2, Banknote, ShoppingCart, Code2, Terminal, Truck, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [apiClients, setApiClients] = useState<ApiClientRow[]>([]);
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [showKeyId, setShowKeyId] = useState<number | null>(null);
  const [newClient, setNewClient] = useState<{ client_name: string; domain: string; location_id: number | null }>({ client_name: "", domain: "", location_id: null });
  const [addingClient, setAddingClient] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeGateway, setActiveGateway] = useState<string | null>("payhere");
  const [isAddingGateway, setIsAddingGateway] = useState(false);
  
  const [settings, setSettings] = useState<Record<string, string>>({
    mail_host: "",
    mail_port: "",
    mail_user: "",
    mail_pass: "",
    mail_encryption: "tls",
    mail_from_addr: "",
    mail_from_name: "",
    sms_gateway_url: "",
    sms_api_key: "",
    sms_sender_id: "",
    payhere_merchant_id_live: "",
    payhere_secret_live: "",
    payhere_merchant_id_sandbox: "",
    payhere_secret_sandbox: "",
    payhere_is_sandbox: "1",
    stripe_publishable_key_live: "",
    stripe_secret_key_live: "",
    stripe_publishable_key_sandbox: "",
    stripe_secret_key_sandbox: "",
    stripe_is_sandbox: "1",
    online_sales_enabled: "0",
    online_sales_cod: "1",
    online_sales_ipg: "1",
    FLEET_API_URL: "",
    FLEET_API_TOKEN: "",
    MILEAGE_API_URL: "",
    MILEAGE_API_TOKEN: ""
  });

  const loadSettings = async () => {
    try {
      const s = await fetchSystemSettings();
      setSettings(prev => ({ ...prev, ...s }));
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const loadApiClients = async () => {
    try {
      const res = await fetchApiClients();
      setApiClients(res);
    } catch (err) { console.error(err); }
  };

  const loadLocations = async () => {
    try {
      const res = await fetchLocations();
      setLocations(Array.isArray(res) ? res : []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadSettings(), loadApiClients(), loadLocations()]).finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, val: string) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await updateSystemSettings(settings);
      toast({ title: "Success", description: "System settings updated successfully." });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleTestSms = async () => {
    const num = testPhone.trim();
    if (!num) {
      toast({ title: "Phone Required", description: "Please enter a phone number to test.", variant: "destructive" });
      return;
    }
    setTestingSms(true);
    try {
      await testSms(num);
      toast({ title: "Sent", description: "Test SMS sent successfully. Check your phone." });
    } catch (err) {
      toast({ title: "Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setTestingSms(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.client_name || !newClient.domain) return;
    setAddingClient(true);
    try {
      await createApiClient(newClient);
      toast({ title: "Client Added", description: "New API client created successfully." });
      setNewClient({ client_name: "", domain: "", location_id: null });
      setIsDialogOpen(false);
      await loadApiClients();
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setAddingClient(false);
    }
  };

  const handleRegenerateKey = async (id: number) => {
    try {
      const newKey = await regenerateApiClientKey(id);
      setApiClients(prev => prev.map(c => c.id === id ? { ...c, api_key: newKey } : c));
      toast({ title: "Key Regenerated", description: "API key updated." });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleDeleteClient = async (id: number) => {
    try {
      await deleteApiClient(id);
      setApiClients(prev => prev.filter(c => c.id !== id));
      toast({ title: "Deleted", description: "Client removed." });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const handleToggleStatus = async (id: number, currentStatus: number) => {
    try {
      const newStatus = currentStatus === 1 ? false : true;
      await toggleApiClientStatus(id, newStatus);
      setApiClients(prev => prev.map(c => c.id === id ? { ...c, is_active: newStatus ? 1 : 0 } : c));
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Copied!", description: "API Key copied to clipboard." });
  };

  const [syncingMileage, setSyncingMileage] = useState(false);
  const handleSyncMorningMileage = async () => {
    try {
      setSyncingMileage(true);
      const res = await syncMorningMileage();
      toast({ title: "Sync Complete", description: `Morning mileage synced successfully. Updated: ${res.data?.updated || 0} vehicles.` });
    } catch (err) {
      toast({ title: "Sync Failed", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSyncingMileage(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground font-medium">Loading system configurations...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" />
          System Settings
        </h1>
        <p className="text-muted-foreground mt-1">Configure global communication gateways and server infrastructure</p>
      </div>

      <Tabs defaultValue="mail" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 w-full bg-muted/50 p-1 rounded-xl h-auto md:h-14 gap-1">
          <TabsTrigger value="mail" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
            <Mail className="w-4 h-4" /> Email
          </TabsTrigger>
          <TabsTrigger value="sms" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> SMS
          </TabsTrigger>
          <TabsTrigger value="public-api" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
            <Globe className="w-4 h-4" /> Public API
          </TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> Payments
          </TabsTrigger>
          <TabsTrigger value="external-apis" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all flex items-center gap-2">
            <Terminal className="w-4 h-4" /> External APIs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mail">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-primary/[0.03] border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Outgoing Mail Server</CardTitle>
                  <CardDescription>Configure SMTP credentials for system notifications and invoices.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 border-b pb-2 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" />
                    Connection Details
                  </h3>
                  <div className="grid gap-2">
                    <Label htmlFor="mail_host">SMTP Host</Label>
                    <Input id="mail_host" placeholder="smtp.example.com" value={settings.mail_host} onChange={(e) => handleChange('mail_host', e.target.value)} />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="mail_port">SMTP Port</Label>
                      <Input id="mail_port" placeholder="587" value={settings.mail_port} onChange={(e) => handleChange('mail_port', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mail_encryption">Encryption</Label>
                      <Select value={settings.mail_encryption} onValueChange={(v) => handleChange('mail_encryption', v)}>
                        <SelectTrigger id="mail_encryption">
                          <SelectValue placeholder="Select encryption" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tls">TLS (STARTTLS)</SelectItem>
                          <SelectItem value="ssl">SSL / Implicit TLS</SelectItem>
                          <SelectItem value="none">None (Insecure)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 border-b pb-2 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Authentication
                  </h3>
                  <div className="grid gap-2">
                    <Label htmlFor="mail_user">Username</Label>
                    <Input id="mail_user" placeholder="user@example.com" value={settings.mail_user} onChange={(e) => handleChange('mail_user', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="mail_pass">Password</Label>
                    <Input id="mail_pass" type="password" placeholder="••••••••" value={settings.mail_pass} onChange={(e) => handleChange('mail_pass', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 border-b pb-2 flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5" />
                    Sender Identity
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="mail_from_addr">From Email Address</Label>
                      <Input id="mail_from_addr" placeholder="no-reply@servicebay.com" value={settings.mail_from_addr} onChange={(e) => handleChange('mail_from_addr', e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="mail_from_name">From Name</Label>
                      <Input id="mail_from_name" placeholder="ServiceBay Notifications" value={settings.mail_from_name} onChange={(e) => handleChange('mail_from_name', e.target.value)} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-6 flex justify-end">
              <Button onClick={save} disabled={saving} size="lg" className="px-8 shadow-md">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Mail Configuration
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="sms">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-primary/[0.03] border-b pb-4">
               <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">SMS Gateway Configuration</CardTitle>
                  <CardDescription>Setup your API provider for automated transaction alerts and booking confirmations.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 border-b pb-2 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" />
                    Gateway Details
                  </h3>
                  <div className="grid gap-2">
                    <Label htmlFor="sms_gateway_url">Gateway API URL</Label>
                    <Input id="sms_gateway_url" placeholder="https://api.smsprovider.com/v1/send" value={settings.sms_gateway_url} onChange={(e) => handleChange('sms_gateway_url', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sms_api_key">API Token / Key</Label>
                    <Input id="sms_api_key" type="password" placeholder="••••••••" value={settings.sms_api_key} onChange={(e) => handleChange('sms_api_key', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="sms_sender_id">Sender ID</Label>
                    <Input id="sms_sender_id" placeholder="SERVICEBAY" value={settings.sms_sender_id} onChange={(e) => handleChange('sms_sender_id', e.target.value)} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground/60 border-b pb-2 flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5" />
                    Test Connectivity
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Verify your credentials by sending a test message. Make sure to **Save** your settings before testing if you have made changes.
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="test_phone">Recipient Number</Label>
                    <Input id="test_phone" placeholder="9477..." onChange={(e) => setTestPhone(e.target.value)} />
                  </div>
                  <Button variant="secondary" onClick={handleTestSms} disabled={testingSms || !testPhone.trim()} className="w-full">
                    {testingSms ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                    Send Test SMS
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-6 flex justify-end">
              <Button onClick={save} disabled={saving} size="lg" className="px-8 shadow-md">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save SMS Gateway
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="public-api">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-primary/[0.03] border-b pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Domain-Specific API Keys</CardTitle>
                    <CardDescription>Manage keys and restricted domains for external website integrations.</CardDescription>
                  </div>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 shadow-sm">
                      <Plus className="w-4 h-4" />
                      Add API Client
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Register API Client</DialogTitle>
                      <DialogDescription>
                        Create a new secure key tied to a specific website domain.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="client_name">Client Name (Reference)</Label>
                        <Input id="client_name" placeholder="e.g. Main E-commerce Site" value={newClient.client_name} onChange={(e) => setNewClient(p => ({ ...p, client_name: e.target.value }))} />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="domain">Target Domain (Origin)</Label>
                        <Input id="domain" placeholder="https://www.example.com" value={newClient.domain} onChange={(e) => setNewClient(p => ({ ...p, domain: e.target.value }))} />
                        <p className="text-[10px] text-muted-foreground">The protocol (http/https) and domain must match exactly.</p>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="loc-select">Link to Location</Label>
                        <Select 
                          value={newClient.location_id ? String(newClient.location_id) : "none"} 
                          onValueChange={(v) => setNewClient(p => ({ ...p, location_id: v === "none" ? null : Number(v) }))}
                        >
                          <SelectTrigger id="loc-select">
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Location (Global)</SelectItem>
                            {locations.map(l => (
                              <SelectItem key={l.id} value={String(l.id)}>{l.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground italic">Essential for returning location-specific analytics codes.</p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddClient} disabled={addingClient || !newClient.client_name || !newClient.domain}>
                        {addingClient ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Client
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead className="w-[200px]">Client / Domain</TableHead>
                      <TableHead>Linked Location</TableHead>
                      <TableHead>API Key</TableHead>
                      <TableHead className="w-[100px] text-center">Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-40 text-center">
                          <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <ShieldCheck className="w-8 h-8 opacity-20" />
                            <p>No API clients registered yet.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      apiClients.map((client) => (
                        <TableRow key={client.id} className="group">
                          <TableCell>
                            <div className="font-medium text-sm">{client.client_name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <ExternalLink className="w-2.5 h-2.5" />
                               {client.domain}
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.location_name ? (
                              <Badge variant="outline" className="gap-1.5 bg-blue-50 text-blue-700 border-blue-200">
                                <MapPin className="w-3 h-3" />
                                {client.location_name}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No Link</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 max-w-[250px]">
                              <code className="font-mono text-[10px] bg-muted/40 px-2 py-1 rounded truncate flex-1">
                                {showKeyId === client.id ? client.api_key : "••••••••••••••••••••••••••••••••"}
                              </code>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7" 
                                onClick={() => setShowKeyId(showKeyId === client.id ? null : client.id)}
                              >
                                {showKeyId === client.id ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7" 
                                onClick={() => copyToClipboard(client.api_key)}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Switch 
                              checked={client.is_active === 1} 
                              onCheckedChange={() => handleToggleStatus(client.id, client.is_active)} 
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                                    <RotateCw className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Regenerate Key for "{client.client_name}"?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will immediately block access for any site using the current key.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRegenerateKey(client.id)} className="bg-destructive hover:bg-destructive/90">
                                      Regenerate
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete API Client?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{client.client_name}"? This action cannot be undone and will permanently block its API access.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteClient(client.id)} className="bg-destructive hover:bg-destructive/90">
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            
            <CardFooter className="bg-muted/30 border-t p-6">
              <div className="grid gap-4 w-full">
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <Link2 className="w-4 h-4" />
                  Integration Guide
                </div>
                <div className="grid sm:grid-cols-2 gap-6 items-start">
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      To connect your external website, use the URLs below and include the <code className="bg-muted px-1 rounded">X-API-Key</code> header from the table above.
                    </p>
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 mt-2">
                      <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                      <p className="text-[10px] text-blue-700 leading-relaxed">
                        The <strong>Domain Binding</strong> feature ensures that keys only work when requests originate from their registered website.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 p-4 bg-background rounded-xl border">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground">Base Inventory URL:</p>
                      <code className="text-[10px] break-all block bg-muted p-1.5 rounded select-all cursor-pointer">
                        {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : ''}/api/publicitem/inventory
                      </code>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground">Product Detail URL:</p>
                      <code className="text-[10px] break-all block bg-muted p-1.5 rounded">
                        .../api/publicitem/get/{"{id}"}
                      </code>
                    </div>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        <TabsContent value="payments">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-primary/[0.03] border-b pb-4">
               <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Online Payment Gateways</CardTitle>
                  <CardDescription>Configure PayHere Sri Lanka and other online sales settings.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                  {/* Global Options */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="text-lg font-bold">Global Sales Options</h3>
                        <p className="text-xs text-muted-foreground">Configure how online orders are accepted across all channels.</p>
                      </div>
                    </div>
                    
                    <div className="grid gap-6 md:grid-cols-3">
                      <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/10 shadow-sm">
                        <div className="space-y-1">
                          <Label className="text-base font-bold">Enable Online Sales</Label>
                          <p className="text-[11px] text-muted-foreground">Master switch for website orders.</p>
                        </div>
                        <Switch 
                          checked={settings.online_sales_enabled === "1"} 
                          onCheckedChange={(v) => handleChange('online_sales_enabled', v ? "1" : "0")} 
                        />
                      </div>

                      <div className="space-y-3 p-4 bg-muted/30 rounded-xl border flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <Label className="font-bold">Cash on Delivery</Label>
                          <Switch 
                            checked={settings.online_sales_cod === "1"} 
                            onCheckedChange={(v) => handleChange('online_sales_cod', v ? "1" : "0")} 
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Allow orders without immediate payment.</p>
                      </div>

                      <div className="space-y-3 p-4 bg-muted/30 rounded-xl border flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                          <Label className="font-bold">Online Payment (IPG)</Label>
                          <Switch 
                            checked={settings.online_sales_ipg === "1"} 
                            onCheckedChange={(v) => handleChange('online_sales_ipg', v ? "1" : "0")} 
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Require immediate payment via gateways.</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Providers List */}
                  <div className="space-y-6 pt-4">
                    <div className="flex items-center justify-between border-b pb-4">
                      <div>
                        <h3 className="text-lg font-bold">Payment Providers</h3>
                        <p className="text-xs text-muted-foreground">Manage and configure your integrated payment gateways.</p>
                      </div>
                      <Button 
                        onClick={() => { setIsAddingGateway(true); setActiveGateway(null); }}
                        variant="outline" 
                        size="sm" 
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add New IPG
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {/* Provider List Row */}
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {['payhere', 'stripe'].map((gw) => (
                          <button
                            key={gw}
                            onClick={() => { setActiveGateway(gw); setIsAddingGateway(false); }}
                            className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all min-w-[160px] ${
                              activeGateway === gw && !isAddingGateway
                                ? "border-primary bg-primary/5 shadow-md shadow-primary/10" 
                                : "border-muted bg-card hover:border-muted-foreground/30"
                            }`}
                          >
                            <div className={`p-3 rounded-xl mb-3 ${activeGateway === gw && !isAddingGateway ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                              <CreditCard className="w-6 h-6" />
                            </div>
                            <span className="font-bold capitalize">{gw}</span>
                            <Badge variant={activeGateway === gw && !isAddingGateway ? "default" : "secondary"} className="mt-2 text-[9px]">
                              {gw === 'payhere' ? "Sri Lanka" : "International"}
                            </Badge>
                          </button>
                        ))}
                      </div>

                      {/* Detail View / Configuration Area */}
                      {(activeGateway || isAddingGateway) && (
                        <div className="bg-muted/20 rounded-2xl border p-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
                          {isAddingGateway ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <div className="p-4 bg-primary/10 rounded-full text-primary mb-4">
                                <Plus className="w-8 h-8" />
                              </div>
                              <h4 className="text-xl font-bold">Add New Gateway</h4>
                              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                Please select a supported gateway from the list above or contact support to request a new integration.
                              </p>
                              <Button variant="ghost" className="mt-4" onClick={() => setIsAddingGateway(false)}>
                                Cancel
                              </Button>
                            </div>
                          ) : activeGateway === 'payhere' ? (
                            <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                                    <ShieldCheck className="w-8 h-8" />
                                  </div>
                                  <div>
                                    <h4 className="text-2xl font-bold">PayHere Sri Lanka</h4>
                                    <p className="text-sm text-muted-foreground">The leading payment gateway for Sri Lankan businesses.</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-2 bg-amber-50 rounded-xl border border-amber-100">
                                  <div className="space-y-0.5">
                                    <Label className="text-xs font-bold text-amber-900">Sandbox Mode</Label>
                                    <p className="text-[10px] text-amber-600">Use test environment for development</p>
                                  </div>
                                  <Switch 
                                    checked={settings.payhere_is_sandbox === "1"} 
                                    onCheckedChange={(v) => handleChange('payhere_is_sandbox', v ? "1" : "0")} 
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-6 pt-4">
                                <div className="space-y-4 p-8 bg-card rounded-2xl border-2 border-primary/10 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 bg-primary/10 rounded-bl-2xl text-primary text-xs font-black uppercase tracking-widest">Live Production</div>
                                  <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1 grid gap-4">
                                      <Label className="text-sm font-bold">Merchant ID</Label>
                                      <Input className="h-12 text-base" placeholder="e.g. 123456" value={settings.payhere_merchant_id_live} onChange={(e) => handleChange('payhere_merchant_id_live', e.target.value)} />
                                    </div>
                                    <div className="flex-1 grid gap-4">
                                      <Label className="text-sm font-bold">Merchant Secret</Label>
                                      <Input className="h-12 text-base" type="password" placeholder="••••••••••••••••" value={settings.payhere_secret_live} onChange={(e) => handleChange('payhere_secret_live', e.target.value)} />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-4 p-8 bg-card rounded-2xl border-2 border-orange-500/10 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 bg-orange-500/10 rounded-bl-2xl text-orange-600 text-xs font-black uppercase tracking-widest">Sandbox Environment</div>
                                  <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1 grid gap-4">
                                      <Label className="text-sm font-bold">Sandbox Merchant ID</Label>
                                      <Input className="h-12 text-base border-orange-200 dark:border-orange-500/20" placeholder="e.g. 123456" value={settings.payhere_merchant_id_sandbox} onChange={(e) => handleChange('payhere_merchant_id_sandbox', e.target.value)} />
                                    </div>
                                    <div className="flex-1 grid gap-4">
                                      <Label className="text-sm font-bold">Sandbox Merchant Secret</Label>
                                      <Input className="h-12 text-base border-orange-200 dark:border-orange-500/20" type="password" placeholder="••••••••••••••••" value={settings.payhere_secret_sandbox} onChange={(e) => handleChange('payhere_secret_sandbox', e.target.value)} />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-6 flex items-start gap-4">
                                <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                                  <AlertCircle className="w-6 h-6" />
                                </div>
                                <div className="space-y-2 flex-1">
                                  <p className="font-bold text-amber-900">Configure Webhook Notifications</p>
                                  <p className="text-sm text-amber-800 leading-relaxed">
                                    To receive automatic payment updates, copy the URL below and paste it as the <strong>Notify URL</strong> in your PayHere Merchant Panel Settings.
                                  </p>
                                  <div className="flex items-center gap-2 mt-4">
                                    <code className="flex-1 bg-white/50 border border-amber-200 p-3 rounded-xl text-xs font-mono select-all">
                                      {typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : ''}/api/payment/payhere_notify
                                    </code>
                                    <Button size="icon" variant="ghost" className="h-11 w-11 rounded-xl bg-white border border-amber-200" onClick={() => {
                                      navigator.clipboard.writeText(`${window.location.protocol}//${window.location.host}/api/payment/payhere_notify`);
                                      toast({ title: "Copied!", description: "Notify URL copied to clipboard." });
                                    }}>
                                      <Copy className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : activeGateway === 'stripe' ? (
                            <div className="space-y-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-blue-100 rounded-2xl text-blue-600">
                                    <Globe className="w-8 h-8" />
                                  </div>
                                  <div>
                                    <h4 className="text-2xl font-bold">Stripe Payments</h4>
                                    <p className="text-sm text-muted-foreground">International payment processing for global customers.</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-xl border border-blue-100">
                                  <div className="space-y-0.5">
                                    <Label className="text-xs font-bold text-blue-900">Test Mode</Label>
                                    <p className="text-[10px] text-blue-600">Use Stripe test keys for development</p>
                                  </div>
                                  <Switch 
                                    checked={settings.stripe_is_sandbox === "1"} 
                                    onCheckedChange={(v) => handleChange('stripe_is_sandbox', v ? "1" : "0")} 
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 gap-6 pt-4">
                                <div className="space-y-6 p-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-primary/10 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 bg-primary/10 rounded-bl-2xl text-primary text-xs font-black uppercase tracking-widest">Live</div>
                                  <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1 grid gap-4">
                                      <Label className="text-sm font-bold">Live Publishable Key</Label>
                                      <Input className="h-12 text-base" placeholder="pk_live_..." value={settings.stripe_publishable_key_live} onChange={(e) => handleChange('stripe_publishable_key_live', e.target.value)} />
                                    </div>
                                    <div className="flex-1 grid gap-4">
                                      <Label className="text-sm font-bold">Live Secret Key</Label>
                                      <Input className="h-12 text-base" type="password" placeholder="sk_live_..." value={settings.stripe_secret_key_live} onChange={(e) => handleChange('stripe_secret_key_live', e.target.value)} />
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-6 p-8 bg-white dark:bg-slate-900 rounded-2xl border-2 border-blue-500/10 shadow-sm relative overflow-hidden">
                                  <div className="absolute top-0 right-0 p-3 bg-blue-500/10 rounded-bl-2xl text-blue-600 text-xs font-black uppercase tracking-widest">Test</div>
                                  <div className="flex flex-col md:flex-row gap-8">
                                    <div className="flex-1 grid gap-4">
                                      <Label className="text-sm font-bold">Test Publishable Key</Label>
                                      <Input className="h-12 text-base border-blue-200 dark:border-blue-500/20" placeholder="pk_test_..." value={settings.stripe_publishable_key_sandbox} onChange={(e) => handleChange('stripe_publishable_key_sandbox', e.target.value)} />
                                    </div>
                                    <div className="flex-1 grid gap-4">
                                      <Label className="text-sm font-bold">Test Secret Key</Label>
                                      <Input className="h-12 text-base border-blue-200 dark:border-blue-500/20" type="password" placeholder="sk_test_..." value={settings.stripe_secret_key_sandbox} onChange={(e) => handleChange('stripe_secret_key_sandbox', e.target.value)} />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* API Integration Section */}
                  <div className="pt-8 border-t space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                        <Terminal className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">API Integration Reference</h3>
                        <p className="text-xs text-muted-foreground">Sample data set for public checkout integration.</p>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl overflow-hidden border shadow-inner">
                      <div className="flex items-center justify-between px-6 py-3 bg-slate-800 border-b">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-slate-400" />
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Sample Checkout Payload (POST)</span>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-400 uppercase">application/json</Badge>
                      </div>
                      <div className="p-6">
                        <pre className="text-xs text-emerald-400 font-mono leading-relaxed overflow-x-auto whitespace-pre">
{`{
  "location_id": 1,
  "customer_details": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "0771234567"
  },
  "shipping_address": "No 123, Main Street, Colombo",
  "billing_address": "No 123, Main Street, Colombo",
  "total_amount": 12500.00,
  "payment_method": "IPG",
  "items": [
    {
      "item_id": 45,
      "description": "Brake Pad Front",
      "quantity": 1,
      "unit_price": 8500.00,
      "line_total": 8500.00
    },
    {
      "item_id": 12,
      "description": "Oil Filter",
      "quantity": 2,
      "unit_price": 2000.00,
      "line_total": 4000.00
    }
  ]
}`}
                        </pre>
                      </div>
                      <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700/50">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          Endpoint: /api/public/checkout
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/30 border-t p-6 flex justify-end">
                <Button onClick={save} disabled={saving} size="lg" className="px-8 shadow-md">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Payment Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        <TabsContent value="external-apis">
          <Card className="border-none shadow-lg overflow-hidden">
            <CardHeader className="bg-primary/[0.03] border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">External API Integrations</CardTitle>
                  <CardDescription>Manage endpoints and authentication tokens for third-party service connections.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-8">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground/60 border-b pb-2">
                    <Truck className="w-4 h-4" />
                    Fleet Management (Export API)
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="FLEET_API_URL">API Endpoint URL</Label>
                      <Input 
                        id="FLEET_API_URL" 
                        placeholder="http://220.247.236.239/api/Export_API/vehicales_INFO.php" 
                        value={settings.FLEET_API_URL} 
                        onChange={(e) => handleChange('FLEET_API_URL', e.target.value)} 
                      />
                      <p className="text-[10px] text-muted-foreground">The base URL for fetching vehicle information from the external fleet system.</p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="FLEET_API_TOKEN">Authentication Token</Label>
                      <div className="relative">
                        <Input 
                          id="FLEET_API_TOKEN" 
                          type="password" 
                          placeholder="••••••••••••••••" 
                          value={settings.FLEET_API_TOKEN} 
                          onChange={(e) => handleChange('FLEET_API_TOKEN', e.target.value)} 
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">The secure token used to authorize requests to the fleet API.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground/60 border-b pb-2">
                    <Smartphone className="w-4 h-4" />
                    Vehicle Mileage & Odometer API
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="MILEAGE_API_URL">Mileage API Endpoint</Label>
                      <Input 
                        id="MILEAGE_API_URL" 
                        placeholder="https://api.gps-provider.com/v1/mileage" 
                        value={settings.MILEAGE_API_URL} 
                        onChange={(e) => handleChange('MILEAGE_API_URL', e.target.value)} 
                      />
                      <p className="text-[10px] text-muted-foreground">URL to fetch real-time mileage or odometer readings for vehicles.</p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="MILEAGE_API_TOKEN">Mileage API Token</Label>
                      <Input 
                        id="MILEAGE_API_TOKEN" 
                        type="password" 
                        placeholder="••••••••••••••••" 
                        value={settings.MILEAGE_API_TOKEN} 
                        onChange={(e) => handleChange('MILEAGE_API_TOKEN', e.target.value)} 
                      />
                      <p className="text-[10px] text-muted-foreground">Authorization token for the mileage service.</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <Button onClick={handleSyncMorningMileage} disabled={syncingMileage} variant="secondary" className="gap-2">
                      {syncingMileage ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                      Sync Morning Mileage Now
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-muted/20 rounded-xl border border-dashed flex flex-col items-center justify-center py-10 text-center">
                   <div className="p-3 bg-muted rounded-full mb-3">
                     <Plus className="w-6 h-6 text-muted-foreground/50" />
                   </div>
                   <h4 className="text-sm font-bold text-muted-foreground">Add New Integration</h4>
                   <p className="text-xs text-muted-foreground max-w-xs mt-1">
                     Additional API integrations (e.g., GPS tracking, fuel management) can be configured here as they are added to the system.
                   </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t p-6 flex justify-end">
              <Button onClick={save} disabled={saving} size="lg" className="px-8 shadow-md">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save API Configurations
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
