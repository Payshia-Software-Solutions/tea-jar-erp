"use client"

import React, { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  rbacCreateRole,
  rbacDeleteRole,
  rbacFetchPermissions,
  rbacFetchRolePermissions,
  rbacFetchRoles,
  rbacSetRolePermissions,
} from "@/lib/api";
import { Loader2, Plus, Shield, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type RoleRow = { id: number; name: string; created_at: string };
type PermRow = { id: number; perm_key: string; description: string | null };

type PermMatrixRow = { module: string; page: string; read: string; write?: string };

const basePagePermissionMatrix: PermMatrixRow[] = [
  // Core Features
  { module: "Core Features", page: "Executive Dashboard", read: "reports.read" },
  { module: "Core Features", page: "Workshop Dashboard", read: "reports.read" },
  { module: "Core Features", page: "AI Business Intelligence", read: "reports.read" },
  { module: "Core Features", page: "Sales Dashboard", read: "reports.read" },
  { module: "Core Features", page: "POS Quick Sale", read: "pos.read", write: "pos.write" },
  { module: "Core Features", page: "Reports", read: "reports.read" },

  // Fleet Management
  { module: "Fleet Management", page: "Create Order", read: "orders.read", write: "orders.write" },
  { module: "Fleet Management", page: "Order Queue", read: "orders.read", write: "orders.write" },
  { module: "Fleet Management", page: "Service Calendar", read: "orders.read" },
  { module: "Fleet Management", page: "Upcoming Services", read: "vehicles.read" },
  { module: "Fleet Management", page: "Active Jobs", read: "orders.read", write: "orders.write" },
  { module: "Fleet Management", page: "Completed Orders", read: "orders.read" },
  { module: "Fleet Management", page: "Bays Board", read: "bays.read", write: "bays.write" },
  { module: "Fleet Management", page: "Vehicles List", read: "vehicles.read", write: "vehicles.write" },
  { module: "Fleet Management", page: "Vehicle Lookup", read: "vehicles.read" },
  { module: "Fleet Management", page: "Technicians", read: "technicians.read", write: "technicians.write" },
  { module: "Fleet Management", page: "Service Bays", read: "bays.read", write: "bays.write" },
  { module: "Fleet Management", page: "Repair Categories", read: "categories.read", write: "categories.write" },
  { module: "Fleet Management", page: "Checklist Items", read: "checklists.read", write: "checklists.write" },
  { module: "Fleet Management", page: "Vehicle Makes", read: "makes.read", write: "makes.write" },
  { module: "Fleet Management", page: "Vehicle Models", read: "models.read", write: "models.write" },
  { module: "Fleet Management", page: "Departments", read: "departments.read", write: "departments.write" },
  { module: "Fleet Management", page: "Fuel Orders", read: "vehicles.read", write: "vehicles.write" },
  { module: "Fleet Management", page: "Fuel Settings", read: "vehicles.write", write: "vehicles.write" },

  // Vendors
  { module: "Vendors", page: "Suppliers", read: "suppliers.read", write: "suppliers.write" },
  { module: "Vendors", page: "Vendor Payments", read: "suppliers.read", write: "accounting.write" },
  { module: "Vendors", page: "Supplier Returns", read: "suppliers.read", write: "suppliers.write" },
  
  // Inventory
  { module: "Inventory", page: "Items", read: "parts.read", write: "parts.write" },
  { module: "Inventory", page: "Barcode Printer", read: "parts.read" },
  { module: "Inventory", page: "Stock Balance", read: "stock.read" },
  { module: "Inventory", page: "Stock Counts", read: "stock.read", write: "stock.adjust" },
  { module: "Inventory", page: "Stock Adjustments", read: "stock.read", write: "stock.adjust" },
  { module: "Inventory", page: "Stock Transfers", read: "transfer.read", write: "transfer.write" },
  { module: "Inventory", page: "Issue Notes", read: "parts.read", write: "parts.write" },
  { module: "Inventory", page: "Purchase Orders", read: "purchase.read", write: "purchase.write" },
  { module: "Inventory", page: "GRN", read: "grn.read", write: "grn.write" },
  { module: "Inventory", page: "Stock Requests", read: "transfer.read", write: "transfer.write" },

  // CRM
  { module: "CRM", page: "Inquiries (Leads)", read: "crm.inquiries.view", write: "crm.inquiries.write" },
  { module: "CRM", page: "Customers", read: "customers.read", write: "customers.write" },
  { module: "CRM", page: "Customer Vehicles", read: "vehicles.read", write: "vehicles.write" },
  { module: "CRM", page: "Routes", read: "customers.read", write: "customers.write" },

  // Sales
  { module: "Sales", page: "Sales Targets", read: "sales.read", write: "sales.write" },
  { module: "Sales", page: "Quotations", read: "sales.read", write: "sales.create" },
  { module: "Sales", page: "Invoices", read: "invoices.read", write: "invoices.write" },
  { module: "Sales", page: "Recurring Invoices", read: "invoices.read", write: "invoices.write" },
  { module: "Sales", page: "Customer Notes", read: "invoices.read", write: "invoices.write" },
  { module: "Sales", page: "Payment Receipts", read: "payments.read", write: "payments.write" },
  { module: "Sales", page: "Cheque Inventory", read: "payments.read", write: "payments.write" },

  // Marketing
  { module: "Marketing", page: "Promotions", read: "promotions.read", write: "promotions.write" },
  { module: "Marketing", page: "SMS Marketing", read: "promotions.read", write: "promotions.write" },
  { module: "Marketing", page: "Email Marketing", read: "promotions.read", write: "promotions.write" },
  { module: "Marketing", page: "Audience Segments", read: "promotions.read", write: "promotions.write" },

  // E-commerce
  { module: "E-commerce", page: "Online Orders", read: "invoices.read", write: "invoices.write" },
  { module: "E-commerce", page: "Storefront Customers", read: "customers.read", write: "customers.write" },
  { module: "E-commerce", page: "Payment Webhook Logs", read: "invoices.read" },
  { module: "E-commerce", page: "Content Management", read: "promotions.read", write: "promotions.write" },
  { module: "E-commerce", page: "Navigation Menu", read: "promotions.read", write: "promotions.write" },
  { module: "E-commerce", page: "Storefront Products", read: "parts.read", write: "parts.write" },
  { module: "E-commerce", page: "Product Reviews", read: "promotions.read", write: "promotions.write" },
  { module: "E-commerce", page: "Coupons & Discounts", read: "promotions.read", write: "promotions.write" },
  { module: "E-commerce", page: "E-commerce Settings", read: "promotions.read", write: "promotions.write" },
  { module: "E-commerce", page: "Developer Options", read: "promotions.read", write: "promotions.write" },

  // Kiosk
  { module: "Kiosk", page: "Experience Bookings", read: "orders.read", write: "orders.write" },
  { module: "Kiosk", page: "Order Requests", read: "orders.read", write: "orders.write" },
  { module: "Kiosk", page: "Kiosk Content", read: "ecommerce.read", write: "ecommerce.write" },
  { module: "Kiosk", page: "Settings", read: "ecommerce.read", write: "ecommerce.write" },

  // Accounting
  { module: "Accounting", page: "Financial Overview", read: "accounting.read" },
  { module: "Accounting", page: "Journal Entries", read: "accounting.read", write: "accounting.write" },
  { module: "Accounting", page: "Expense Payees", read: "accounting.read", write: "accounting.write" },
  { module: "Accounting", page: "Chart of Accounts", read: "accounting.read", write: "accounting.write" },
  { module: "Accounting", page: "Expenses & Vouchers", read: "accounting.read", write: "accounting.write" },
  { module: "Accounting", page: "Bank Reconciliation", read: "accounting.reconcile", write: "accounting.write" },
  { module: "Accounting", page: "Trial Balance", read: "accounting.read" },
  { module: "Accounting", page: "Fiscal Management", read: "fiscal.read", write: "fiscal.write" },
  { module: "Accounting", page: "Balance Sheet", read: "accounting.read" },
  { module: "Accounting", page: "Product Costing Templates", read: "costing.manage", write: "costing.manage" },
  { module: "Accounting", page: "Product & Export Costing", read: "costing.manage", write: "costing.manage" },
  { module: "Accounting", page: "Accounting Settings", read: "accounting.read", write: "accounting.write" },

  // Production
  { module: "Production", page: "Overview", read: "production.read" },
  { module: "Production", page: "Production Orders", read: "production.read", write: "production.write" },
  { module: "Production", page: "Bill of Materials", read: "production.read", write: "production.write" },

  // Human Resources
  { module: "Human Resources", page: "Employees", read: "hrm.read", write: "hrm.write" },
  { module: "Human Resources", page: "Attendance", read: "hrm.read", write: "attendance.write" },
  { module: "Human Resources", page: "Leave Management", read: "hrm.read", write: "leave.write" },
  { module: "Human Resources", page: "Payroll", read: "hrm.read", write: "payroll.write" },
  { module: "Human Resources", page: "Staff Departments", read: "hrm.read", write: "hrm.write" },
  { module: "Human Resources", page: "Staff Categories", read: "hrm.read", write: "hrm.write" },
  { module: "Human Resources", page: "Salary Schemes", read: "hrm.read", write: "hrm.write" },

  // Front Office
  { module: "Front Office", page: "Room Rack", read: "orders.read", write: "orders.write" },
  { module: "Front Office", page: "Calendar View", read: "orders.read" },
  { module: "Front Office", page: "Reservations", read: "orders.read", write: "orders.write" },
  { module: "Front Office", page: "Rooms & Rates", read: "parts.read", write: "parts.write" },

  // Banquet
  { module: "Banquet", page: "Banquet Overview", read: "orders.read" },
  { module: "Banquet", page: "Event Calendar", read: "orders.read" },
  { module: "Banquet", page: "Banquet Bookings", read: "orders.read", write: "orders.write" },
  { module: "Banquet", page: "Banquet Halls", read: "orders.read", write: "orders.write" },
  { module: "Banquet", page: "Banquet Menus", read: "orders.read", write: "orders.write" },
  { module: "Banquet", page: "Banquet Resources", read: "orders.read", write: "orders.write" },
  { module: "Banquet", page: "Banquet Vendors", read: "orders.read", write: "orders.write" },

  // Master Data
  { module: "Master Data", page: "Product Collections", read: "parts.read", write: "parts.write" },
  { module: "Master Data", page: "Item Sections", read: "parts.read", write: "parts.write" },
  { module: "Master Data", page: "Item Departments", read: "parts.read", write: "parts.write" },
  { module: "Master Data", page: "Item Categories", read: "parts.read", write: "parts.write" },
  { module: "Master Data", page: "Technical Specifications", read: "parts.read", write: "parts.write" },
  { module: "Master Data", page: "Units", read: "units.read", write: "units.write" },
  { module: "Master Data", page: "Taxes", read: "taxes.read", write: "taxes.write" },
  { module: "Master Data", page: "Banks & Branches", read: "banks.read", write: "banks.write" },
  { module: "Master Data", page: "Shipping Carriers", read: "parts.read", write: "parts.write" },
  { module: "Master Data", page: "Restaurant Tables", read: "bays.read", write: "bays.write" },
  { module: "Master Data", page: "Brands", read: "brands.read", write: "brands.write" },

  // Admin & Settings
  { module: "Admin & Settings", page: "Users", read: "users.read", write: "users.write" },
  { module: "Admin & Settings", page: "RBAC Roles", read: "rbac.read", write: "rbac.write" },
  { module: "Admin & Settings", page: "Locations", read: "locations.read", write: "locations.write" },
  { module: "Admin & Settings", page: "Company", read: "company.write", write: "settings.write" },
  { module: "Admin & Settings", page: "System Settings", read: "settings.read", write: "settings.write" },
  { module: "Admin & Settings", page: "Printer Setup", read: "settings.read", write: "settings.write" },
  { module: "Admin & Settings", page: "Shipping Management", read: "locations.read", write: "locations.write" },
  { module: "Admin & Settings", page: "Database Schema", read: "settings.read", write: "settings.write" },
  { module: "Admin & Settings", page: "Table Verification", read: "settings.read", write: "settings.write" },
  { module: "Admin & Settings", page: "Subscription", read: "settings.read", write: "settings.write" },
  { module: "Admin & Settings", page: "Document Cancellations", read: "accounting.write", write: "accounting.write" },
];

export default function RbacPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [perms, setPerms] = useState<PermRow[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [roleKeys, setRoleKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [loadingRolePerms, setLoadingRolePerms] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [filter, setFilter] = useState("");

  const selectedRole = useMemo(
    () => roles.find((r) => r.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  const matrixKeys = useMemo(() => {
    const s = new Set<string>();
    for (const row of basePagePermissionMatrix) {
      s.add(row.read);
      if (row.write) s.add(row.write);
    }
    return s;
  }, []);

  const pagePermissionMatrix = useMemo<PermMatrixRow[]>(() => {
    // Bring any "advanced" permission keys into the same table automatically.
    const extras = perms
      .filter((p) => !matrixKeys.has(p.perm_key))
      .map((p) => {
        // Simple heuristic: if key contains .write/create/update, it's a write permission
        const isWriteKey = p.perm_key.includes('.write') || p.perm_key.includes('.create') || p.perm_key.includes('.update');
        return { 
          module: "Other / Advanced", 
          page: p.perm_key, 
          read: isWriteKey ? (p.perm_key.split('.')[0] + '.read') : p.perm_key, 
          write: isWriteKey ? p.perm_key : undefined 
        };
      });
    return [...basePagePermissionMatrix, ...extras];
  }, [perms, matrixKeys]);

  const filteredMatrix = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return pagePermissionMatrix;
    return pagePermissionMatrix.filter((row) => {
      const hay = `${row.module} ${row.page} ${row.read} ${row.write ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pagePermissionMatrix, filter]);

  const groupedMatrix = useMemo(() => {
    const groups: Record<string, PermMatrixRow[]> = {};
    filteredMatrix.forEach(row => {
      if (!groups[row.module]) groups[row.module] = [];
      groups[row.module].push(row);
    });
    return groups;
  }, [filteredMatrix]);

  const toggleModule = (moduleName: string, checked: boolean) => {
    const rows = groupedMatrix[moduleName];
    if (!rows) return;
    
    setRoleKeys(prev => {
      const next = new Set(prev);
      rows.forEach(row => {
        if (checked) {
          next.add(row.read);
          if (row.write) next.add(row.write);
        } else {
          next.delete(row.read);
          if (row.write) next.delete(row.write);
        }
      });
      return next;
    });
  };

  const isModuleSelected = (moduleName: string) => {
    const rows = groupedMatrix[moduleName];
    if (!rows || rows.length === 0) return false;
    return rows.every(row => roleKeys.has(row.read) && (!row.write || roleKeys.has(row.write)));
  };

  const load = async () => {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([rbacFetchRoles(), rbacFetchPermissions()]);
      setRoles(r);
      setPerms(p);
      const firstNonAdmin = r.find((x: RoleRow) => x.name !== "Admin") ?? r[0] ?? null;
      setSelectedRoleId(firstNonAdmin ? firstNonAdmin.id : null);
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadRolePerms = async (roleId: number) => {
    setLoadingRolePerms(true);
    try {
      const keys: string[] = await rbacFetchRolePermissions(String(roleId));
      setRoleKeys(new Set(keys));
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
      setRoleKeys(new Set());
    } finally {
      setLoadingRolePerms(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (selectedRoleId) void loadRolePerms(selectedRoleId);
  }, [selectedRoleId]);

  const setReadWrite = (readKey: string, writeKey: string | undefined, mode: "read" | "write", checked: boolean) => {
    setRoleKeys((prev) => {
      const next = new Set(prev);

      if (mode === "write") {
        if (!writeKey) return next;
        if (checked) {
          next.add(readKey);
          next.add(writeKey);
        } else {
          next.delete(writeKey);
        }
        return next;
      }

      // mode === "read"
      if (checked) {
        next.add(readKey);
      } else {
        // If read is removed, write must also be removed.
        next.delete(readKey);
        if (writeKey) next.delete(writeKey);
      }
      return next;
    });
  };

  const save = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const res = await rbacSetRolePermissions(String(selectedRoleId), Array.from(roleKeys).sort());
      if (res.status !== 'success') {
        throw new Error(res.message || 'Failed to save');
      }
      await loadRolePerms(selectedRoleId);
      window.dispatchEvent(new Event('rbac:updated'));
      toast({ title: "Saved", description: "Role permissions updated" });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newRoleName.trim();
    if (!name) return;
    try {
      await rbacCreateRole({ name });
      toast({ title: "Created", description: "Role created" });
      setIsCreateOpen(false);
      setNewRoleName("");
      await load();
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  const delRole = async (r: RoleRow) => {
    if (!confirm(`Delete role "${r.name}"?`)) return;
    try {
      await rbacDeleteRole(String(r.id));
      toast({ title: "Deleted", description: "Role deleted", variant: "destructive" });
      await load();
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <DashboardLayout fullWidth>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground mt-1">Admin-only RBAC configuration</p>
        </div>
        <Button className="gap-2 bg-primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4" />
          New Role
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading RBAC data...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-none shadow-md lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Roles</CardTitle>
              <CardDescription>Select a role to edit permissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {roles.map((r) => (
                <div
                  key={r.id}
                  className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                    selectedRoleId === r.id ? "bg-muted/40 border-primary/30" : "hover:bg-muted/20"
                  }`}
                  onClick={() => setSelectedRoleId(r.id)}
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">ROLE ID: #{r.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.name === "Admin" && <Badge variant="outline">Superuser</Badge>}
                    {r.name !== "Admin" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          void delRole(r);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-none shadow-md lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Permissions {selectedRole ? <span className="text-muted-foreground font-normal">for {selectedRole.name}</span> : null}
                  </CardTitle>
                  <CardDescription>
                    Admin role is implicit and cannot be edited.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search permissions..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full sm:w-[200px]"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (confirm("Clear all permissions for this role?")) setRoleKeys(new Set());
                    }}
                    disabled={!selectedRoleId || selectedRole?.name === "Admin" || saving || loadingRolePerms || roleKeys.size === 0}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={() => void save()}
                    disabled={!selectedRoleId || selectedRole?.name === "Admin" || saving || loadingRolePerms}
                  >
                    {(saving || loadingRolePerms) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <Accordion type="multiple" defaultValue={Object.keys(groupedMatrix)} className="w-full border rounded-lg overflow-hidden divide-y">
                {Object.entries(groupedMatrix).map(([moduleName, rows]) => {
                  const moduleSelected = isModuleSelected(moduleName);
                  return (
                    <AccordionItem key={moduleName} value={moduleName} className="border-none">
                      <div className="flex items-center pr-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                        <AccordionTrigger className="px-4 py-3 hover:no-underline flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm uppercase tracking-wider">{moduleName}</span>
                            <Badge variant="secondary" className="font-mono text-[10px]">
                              {rows.length} {rows.length === 1 ? 'perm' : 'perms'}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <div 
                          className="flex items-center gap-2 px-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Checkbox 
                            id={`select-all-${moduleName}`}
                            checked={moduleSelected}
                            disabled={selectedRole?.name === "Admin" || !selectedRoleId || loadingRolePerms || saving}
                            onCheckedChange={(v) => toggleModule(moduleName, Boolean(v))}
                          />
                          <Label 
                            htmlFor={`select-all-${moduleName}`}
                            className="text-[10px] font-bold uppercase tracking-tighter cursor-pointer text-muted-foreground whitespace-nowrap"
                          >
                            {moduleSelected ? "Unselect All" : "Select All"}
                          </Label>
                        </div>
                      </div>
                    <AccordionContent className="p-0">
                      <div className="divide-y bg-background">
                        <div className="grid grid-cols-1 sm:grid-cols-3 bg-muted/5 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b">
                          <div>Page / Resource</div>
                          <div>Read Access</div>
                          <div>Write Access</div>
                        </div>
                        {rows.map((row) => {
                          const readChecked = roleKeys.has(row.read);
                          const writeChecked = row.write ? roleKeys.has(row.write) : false;
                          const disabled = selectedRole?.name === "Admin" || !selectedRoleId || loadingRolePerms || saving;
                          return (
                            <div key={`${row.module}-${row.page}`} className="grid grid-cols-1 sm:grid-cols-3 gap-2 px-4 py-3 items-center hover:bg-muted/5 transition-colors">
                              <div className="text-sm font-medium">{row.page}</div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`read-${row.read}`}
                                  checked={readChecked}
                                  disabled={disabled || writeChecked}
                                  onCheckedChange={(v) => setReadWrite(row.read, row.write, "read", Boolean(v))}
                                />
                                <Label htmlFor={`read-${row.read}`} className="text-xs cursor-pointer text-muted-foreground">Allow View</Label>
                              </div>
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  id={`write-${row.write}`}
                                  checked={writeChecked}
                                  disabled={disabled || !row.write}
                                  onCheckedChange={(v) => setReadWrite(row.read, row.write, "write", Boolean(v))}
                                />
                                <Label htmlFor={`write-${row.write}`} className="text-xs cursor-pointer text-muted-foreground">
                                  {row.write ? "Allow Edit" : "N/A"}
                                </Label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <form onSubmit={createRole}>
            <DialogHeader>
              <DialogTitle>Create Role</DialogTitle>
              <DialogDescription>Roles are assigned by setting the user’s role at registration.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="rolename" className="text-right">Name</Label>
                <Input
                  id="rolename"
                  className="col-span-3"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="e.g., Manager"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
