"use client";

import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  BarChart3,
  PlayCircle,
  CheckCircle2,
  Grid,
  Car,
  Tag,
  Layers,
  Users,
  Tags,
  CheckSquare,
  Gift,
  Boxes,
  Truck,
  FileText,
  PackageCheck,
  ArrowLeftRight,
  FileX,
  History,
  ClipboardList as ClipboardListIcon,
  Shield,
  ShieldCheck,
  Database,
  Settings,
  Percent,
  Receipt,
  Landmark,
  LayoutGrid,
  CreditCard,
  TrendingUp,
  Factory,
  Building2,
  Banknote,
  ShoppingCart,
  MessageSquare,
  Mail,
  Calendar as CalendarIcon,
  Utensils,
  Calculator,
  FolderTree,
  Ticket
} from "lucide-react";

export type NavItem = {
  icon: any;
  label: string;
  href: string;
  perm?: string;
  newTab?: boolean;
};

export const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Executive Dashboard", href: "/dashboard/overall" },
  { icon: LayoutDashboard, label: "Workshop Dashboard", href: "/dashboard" },
  { icon: MessageSquare, label: "AI Business Intelligence", href: "/ai/insights", perm: "reports.read" },
  { icon: TrendingUp, label: "Sales Dashboard", href: "/dashboard/sales", perm: "reports.read" },
  { icon: LayoutDashboard, label: "POS Quick Sale", href: "/cms/pos", perm: "invoices.write" },
  { icon: BarChart3, label: "Reports", href: "/reports", perm: "reports.read" },
];

export const serviceCenterItems: NavItem[] = [
  { icon: PlusCircle, label: "Create Order", href: "/orders/new", perm: "orders.write" },
  { icon: ClipboardList, label: "Order Queue", href: "/orders", perm: "orders.read" },
  { icon: PlayCircle, label: "Active Jobs", href: "/orders/active", perm: "orders.read" },
  { icon: CheckCircle2, label: "Completed Orders", href: "/orders/completed", perm: "orders.read" },
  { icon: Grid, label: "Bays Board", href: "/dashboard/bays", perm: "bays.read" },
  { icon: Car, label: "Vehicles List", href: "/master-data/vehicles", perm: "vehicles.read" },
  { icon: Users, label: "Technicians", href: "/master-data/technicians", perm: "technicians.read" },
  { icon: Grid, label: "Service Bays", href: "/master-data/bays", perm: "bays.read" },
  { icon: Tags, label: "Repair Categories", href: "/master-data/categories", perm: "categories.read" },
  { icon: CheckSquare, label: "Checklist Items", href: "/master-data/checklists", perm: "checklists.read" },
];

export const vendorItems: NavItem[] = [
  { icon: Truck, label: "Suppliers", href: "/inventory/suppliers", perm: "suppliers.read" },
  { icon: Receipt, label: "Vendor Payments", href: "/vendors/payments", perm: "suppliers.read" },
  { icon: ArrowLeftRight, label: "Supplier Returns", href: "/vendors/returns", perm: "suppliers.read" },
];

export const inventoryItems: NavItem[] = [
  { icon: Boxes, label: "Items", href: "/inventory/items", perm: "parts.read" },
  { icon: History, label: "Stock Balance", href: "/inventory/stock", perm: "stock.read" },
  { icon: ArrowLeftRight, label: "Stock Adjustments", href: "/inventory/stock/adjustments", perm: "stock.read" },
  { icon: ArrowLeftRight, label: "Stock Transfers", href: "/inventory/transfers", perm: "transfer.read" },
  { icon: FileText, label: "Purchase Orders", href: "/inventory/purchase-orders", perm: "purchase.read" },
  { icon: PackageCheck, label: "GRN", href: "/inventory/grn", perm: "grn.read" },
  { icon: ClipboardListIcon, label: "Stock Requests", href: "/inventory/stock-requests", perm: "transfer.read" },
];

export const crmItems: NavItem[] = [
  { icon: MessageSquare, label: "Inquiries (Leads)", href: "/crm/inquiries", perm: "crm.inquiries.view" },
  { icon: Users, label: "Customers", href: "/cms/customers", perm: "customers.read" },
  { icon: Car, label: "Customer Vehicles", href: "/cms/vehicles", perm: "vehicles.read" },
];

export const marketingItems: NavItem[] = [
  { icon: Gift, label: "Promotions", href: "/inventory/promotions", perm: "promotions.read" },
  { icon: MessageSquare, label: "SMS Marketing", href: "/cms/marketing/sms", perm: "promotions.write" },
  { icon: Mail, label: "Email Marketing", href: "/cms/marketing/email", perm: "promotions.write" },
  { icon: Users, label: "Audience Segments", href: "/cms/marketing/segments", perm: "promotions.write" },
];

export const salesItems: NavItem[] = [
  { icon: FileText, label: "Quotations", href: "/sales/quotations", perm: "sales.read" },
  { icon: FileText, label: "Invoices", href: "/cms/invoices", perm: "invoices.read" },
  { icon: History, label: "Recurring Invoices", href: "/cms/invoices/recurring", perm: "invoices.read" },
  { icon: Receipt, label: "Payment Receipts", href: "/cms/payment-receipts", perm: "payments.read" },
  { icon: Landmark, label: "Cheque Inventory", href: "/cms/cheques", perm: "payments.read" },
];

export const masterDataItems: NavItem[] = [
  { icon: LayoutGrid, label: "Product Collections", href: "/master-data/collections", perm: "parts.read" },
  { icon: LayoutGrid, label: "Item Sections", href: "/master-data/item-sections", perm: "parts.read" },
  { icon: Layers, label: "Item Departments", href: "/master-data/item-departments", perm: "parts.read" },
  { icon: Grid, label: "Item Categories", href: "/master-data/item-categories", perm: "parts.read" },
  { icon: Settings, label: "Technical Specifications", href: "/master-data/attributes", perm: "parts.read" },
  { icon: Tags, label: "Units", href: "/master-data/units", perm: "units.read" },
  { icon: Percent, label: "Taxes", href: "/master-data/taxes", perm: "taxes.read" },
  { icon: Landmark, label: "Banks & Branches", href: "/master-data/banks", perm: "banks.read" },
  { icon: Truck, label: "Shipping Carriers", href: "/master-data/shipping-carriers", perm: "parts.read" },
  { icon: Grid, label: "Departments", href: "/master-data/departments", perm: "departments.read" },
  { icon: Grid, label: "Restaurant Tables", href: "/master-data/tables", perm: "tables.read" },
  { icon: Tag, label: "Brands", href: "/master-data/brands", perm: "brands.read" },
  { icon: Tag, label: "Vehicle Makes", href: "/master-data/makes", perm: "makes.read" },
  { icon: Layers, label: "Vehicle Models", href: "/master-data/models", perm: "models.read" },
];

export const accountingItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Financial Overview", href: "/accounting" },
  { icon: History, label: "Journal Entries", href: "/accounting/journal" },
  { icon: Users, label: "Expense Payees", href: "/accounting/payees" },
  { icon: LayoutGrid, label: "Chart of Accounts", href: "/accounting/accounts" },
  { icon: Receipt, label: "Expenses & Vouchers", href: "/accounting/expenses" },
  { icon: CheckCircle2, label: "Bank Reconciliation", href: "/accounting/reconciliation", perm: "accounting.reconcile" },
  { icon: BarChart3, label: "Trial Balance", href: "/accounting/trial-balance" },
  { icon: History, label: "Fiscal Management", href: "/accounting/fiscal-years" },
  { icon: TrendingUp, label: "Balance Sheet", href: "/accounting/balance-sheet" },
  { icon: Calculator, label: "Product Costing Templates", href: "/admin/shipping/templates", perm: "costing.manage" },
  { icon: FileText, label: "Product & Export Costing", href: "/accounts/costing-sheet", perm: "costing.manage" },
  { icon: Settings, label: "Accounting Settings", href: "/accounting/settings" },
];

export const productionItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview", href: "/production", perm: "production.read" },
  { icon: ClipboardList, label: "Production Orders", href: "/production/orders", perm: "production.read" },
  { icon: Factory, label: "Bill of Materials", href: "/production/bom", perm: "production.read" },
];

export const hrmItems: NavItem[] = [
  { icon: Users, label: "Employees", href: "/hrm/employees", perm: "hrm.read" },
  { icon: ClipboardList, label: "Attendance", href: "/hrm/attendance", perm: "hrm.read" },
  { icon: FileText, label: "Leave Management", href: "/hrm/leave", perm: "hrm.read" },
  { icon: Landmark, label: "Payroll", href: "/hrm/payroll", perm: "hrm.read" },
  { icon: Building2, label: "Staff Departments", href: "/hrm/settings/departments", perm: "hrm.write" },
  { icon: Layers, label: "Staff Categories", href: "/hrm/settings/categories", perm: "hrm.write" },
  { icon: Banknote, label: "Salary Schemes", href: "/hrm/settings/salary-schemes", perm: "hrm.write" },
];

export const frontOfficeItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Room Rack", href: "/front-office/dashboard", perm: "orders.read" },
  { icon: CalendarIcon, label: "Calendar View", href: "/front-office/calendar", perm: "orders.read" },
  { icon: ClipboardList, label: "Reservations", href: "/front-office/reservations", perm: "orders.read" },
  { icon: Building2, label: "Rooms & Rates", href: "/front-office/rooms", perm: "parts.read" },
];

export const banquetItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Banquet Overview", href: "/banquet/dashboard", perm: "orders.read" },
  { icon: CalendarIcon, label: "Event Calendar", href: "/banquet/calendar", perm: "orders.read" },
  { icon: ClipboardList, label: "Banquet Bookings", href: "/banquet/bookings", perm: "orders.read" },
  { icon: LayoutGrid, label: "Banquet Halls", href: "/banquet/halls", perm: "orders.read" },
  { icon: Utensils, label: "Banquet Menus", href: "/banquet/menus", perm: "orders.read" },
  { icon: Boxes, label: "Banquet Resources", href: "/banquet/resources", perm: "orders.read" },
  { icon: Truck, label: "Banquet Vendors", href: "/banquet/vendors", perm: "orders.read" },
];

export const ecommerceItems: NavItem[] = [
  { icon: ShoppingCart, label: "Online Orders", href: "/ecommerce/orders", perm: "invoices.read" },
  { icon: Users, label: "Storefront Customers", href: "/ecommerce/customers", perm: "customers.read" },
  { icon: History, label: "Payment Webhook Logs", href: "/ecommerce/payment-logs", perm: "invoices.read" },
  { icon: LayoutGrid, label: "Content Management", href: "/ecommerce/content", perm: "promotions.write" },
  { icon: FolderTree, label: "Navigation Menu", href: "/ecommerce/navigation", perm: "promotions.write" },
  { icon: Boxes, label: "Storefront Products", href: "/ecommerce/products", perm: "parts.read" },
  { icon: MessageSquare, label: "Product Reviews", href: "/ecommerce/reviews", perm: "promotions.write" },
  { icon: Ticket, label: "Coupons & Discounts", href: "/ecommerce/coupons", perm: "promotions.write" },
  { icon: Settings, label: "E-commerce Settings", href: "/ecommerce/settings", perm: "promotions.write" },
  { icon: Calculator, label: "Developer Options", href: "/ecommerce/developer", perm: "promotions.write" },
];

export const adminNavItems: NavItem[] = [
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: Shield, label: "RBAC Roles", href: "/admin/rbac" },
  { icon: Database, label: "Locations", href: "/admin/locations" },
  { icon: Settings, label: "Company", href: "/admin/company" },
  { icon: Settings, label: "System Settings", href: "/admin/settings/system" },
  { icon: Truck, label: "Shipping Management", href: "/admin/shipping" },
  { icon: Layers, label: "Database Schema", href: "/admin/schema" },
  { icon: ShieldCheck, label: "Table Verification", href: "/reports/database" },
  { icon: CreditCard, label: "Subscription", href: "/admin/subscription" },
  { icon: FileX, label: "Document Cancellations", href: "/accounting/cancellations", perm: "accounting.write" },
];

