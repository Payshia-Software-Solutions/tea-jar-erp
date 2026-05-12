/**
 * API Module Barrel Export
 */
import { api } from './client';
export * from './client';
export * from './orders';
export * from './inventory';
export * from './finance';
export * from './cancellation';
export * from './admin';
export * from './hrm';
export * from './reports';
export * from './dashboard';
export * from './master-data';
export * from './promotions';
export * from './storefront';
export * from './production';
export * from './marketing';
export * from './email-marketing';
export * from './expense';
export * from './payee';
export * from './intelligence';
export * from './crm';

// Helper for content URLs (preserving legacy function)
export const CONTENT_BASE_URL =
  (process.env.NEXT_PUBLIC_CONTENT_BASE_URL ?? 'https://content-provider.payshia.com/service-center-system/').replace(/\/+$/, '') + '/';

export const contentUrl = (folder: 'vehicles' | 'orders' | 'items' | 'company' | 'brands' | 'employees' | 'documents', filename?: string | null) => {
  if (!filename) return '';
  // If it's already a full URL, return it
  if (filename.startsWith('http')) return filename;
  // If it's a local blob URL, return it
  if (filename.startsWith('blob:')) return filename;
  
  // Strip any leading slashes and take only the basename to be safe against legacy path data
  const safe = filename.split(/[/\\]/).pop() || '';
  return `${CONTENT_BASE_URL}${folder}/${encodeURIComponent(safe)}`;
};

// --- Shipping Zones ---

export interface ShippingZone {
  id: number;
  name: string;
  base_fee: number;
  free_threshold: number | null;
  is_active: number;
}

export const fetchShippingZones = async () => {
  const res = await api('/api/shippingzone/index');
  return res.json();
};

export const createShippingZone = async (data: any) => {
  const res = await api('/api/shippingzone/store', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updateShippingZone = async (id: number, data: any) => {
  const res = await api(`/api/shippingzone/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteShippingZone = async (id: number) => {
  const res = await api(`/api/shippingzone/delete/${id}`, {
    method: 'POST'
  });
  return res.json();
};

// --- Districts ---
export interface District {
  id: number;
  name: string;
  shipping_zone_id: number | null;
  zone_name?: string;
}

export const fetchDistricts = async () => {
  const res = await api('/api/district/index');
  return res.json();
};

export const createDistrict = async (data: any) => {
  const res = await api('/api/district/store', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updateDistrict = async (id: number, data: any) => {
  const res = await api(`/api/district/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteDistrict = async (id: number) => {
  const res = await api(`/api/district/delete/${id}`, {
    method: 'POST'
  });
  return res.json();
};

// --- Cities ---
export interface City {
  id: number;
  name: string;
  district_id: number;
  district_name?: string;
}

export const fetchCities = async (districtId?: number) => {
  const url = districtId ? `/api/city/index?district_id=${districtId}` : '/api/city/index';
  const res = await api(url);
  return res.json();
};

export const createCity = async (data: any) => {
  const res = await api('/api/city/store', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updateCity = async (id: number, data: any) => {
  const res = await api(`/api/city/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteCity = async (id: number) => {
  const res = await api(`/api/city/delete/${id}`, {
    method: 'POST'
  });
  return res.json();
};

// --- Shipping Providers ---
export interface ShippingProvider {
  id: number;
  name: string;
  base_cost: number;
  is_active: number;
}

export const fetchShippingProviders = async () => {
  const res = await api('/api/shipping/providers');
  return res.json();
};

export const createShippingProvider = async (data: any) => {
  const res = await api('/api/shipping/providers/create', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updateShippingProvider = async (id: number, data: any) => {
  const res = await api(`/api/shipping/providers/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteShippingProvider = async (id: number) => {
  const res = await api(`/api/shipping/providers/delete/${id}`, {
    method: 'POST'
  });
  return res.json();
};

// --- Shipping Costing Templates ---
export interface ShippingCostingItem {
  id?: number;
  name: string;
  cost_type: 'Fixed' | 'Percentage' | 'Per Unit';
  value: number;
  calculated_amount?: number;
}

export interface ShippingCostingTemplate {
  id: number;
  name: string;
  is_active: number;
  items?: ShippingCostingItem[];
}

export const fetchCostingTemplates = async (all = false) => {
  const res = await api(`/api/shipping/templates${all ? '?all=1' : ''}`);
  return res.json();
};

export const fetchCostingTemplate = async (id: number) => {
  const res = await api(`/api/shipping/templates/view/${id}`);
  return res.json();
};

export const createCostingTemplate = async (data: any) => {
  const res = await api('/api/shipping/templates/create', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updateCostingTemplate = async (id: number, data: any) => {
  const res = await api(`/api/shipping/templates/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteCostingTemplate = async (id: number) => {
  const res = await api(`/api/shipping/templates/delete/${id}`, {
    method: 'POST'
  });
  return res.json();
};

// --- Shipping Costing Sheets ---
export interface ShippingCostingSheet {
  id: number;
  template_id: number | null;
  customer_id: number | null;
  customer_name?: string;
  template_name?: string;
  reference_number: string | null;
  base_carrier_cost: number;
  total_quantity: number;
  total_cost: number;
  status: 'Draft' | 'Finalized';
  created_at: string;
  shipping_term?: string;
  freight_type?: string;
  shipment_mode?: string;
  profit_method?: string;
  profit_value?: number;
  items?: ShippingCostingItem[];
}

export const fetchCostingSheets = async (customerId?: number) => {
  const res = await api(`/api/shipping/sheets${customerId ? `?customer_id=${customerId}` : ''}`);
  return res.json();
};

export const fetchCostingSheet = async (id: number) => {
  const res = await api(`/api/shipping/sheets/view/${id}`);
  return res.json();
};

export const createCostingSheet = async (data: any) => {
  const res = await api('/api/shipping/sheets/create', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updateCostingSheet = async (id: number, data: any) => {
  const res = await api(`/api/shipping/sheets/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteCostingSheet = async (id: number) => {
  const res = await api(`/api/shipping/sheets/delete/${id}`, {
    method: 'POST'
  });
  return res.json();
};

export const bulkDeleteCostingSheets = async (ids: number[]) => {
  const res = await api('/api/shipping/sheets/bulk-delete', {
    method: 'POST',
    body: JSON.stringify({ ids })
  });
  return res.json();
};

export const duplicateCostingSheet = async (id: number) => {
  const res = await api(`/api/shipping/sheets/duplicate/${id}`, {
    method: 'POST'
  });
  return res.json();
};

// --- Logistics Factors ---
export interface LogisticsFactor {
  id: number;
  name: string;
  type: string;
  absorption_method: 'Value' | 'Quantity' | 'Weight' | 'Volume';
  is_active: boolean;
  default_terms?: string;
  created_at: string;
}

// Logistics & Packing Interfaces
export interface PackagingType {
  id: number;
  name: string;
  type: string;
  length_cm: number;
  width_cm: number;
  height_cm: number;
  cbm: number;
  tare_weight_kg: number;
  max_weight_capacity_kg: number;
}

export interface PalletType {
  id: number;
  name: string;
  length_cm: number;
  width_cm: number;
  max_load_height_cm: number;
  tare_weight_kg: number;
  max_weight_capacity_kg: number;
}

export interface ContainerType {
  id: number;
  name: string;
  max_cbm_capacity: number;
  max_weight_capacity_kg: number;
  max_standard_pallets: number;
}

export const fetchPackagingTypes = async () => {
  const res = await api('/api/shipping/packing_packaging');
  return res.json();
};

export const createPackagingType = async (data: any) => {
  const res = await api('/api/shipping/packing_packaging/create', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deletePackagingType = async (id: number) => {
  const res = await api(`/api/shipping/packing_packaging/delete/${id}`, {
    method: 'POST'
  });
  return res.json();
};

export const updatePackagingType = async (id: number, data: any) => {
  const res = await api(`/api/shipping/packing_packaging/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const fetchPalletTypes = async () => {
  const res = await api('/api/shipping/packing_pallets');
  return res.json();
};

export const createPalletType = async (data: any) => {
  const res = await api('/api/shipping/packing_pallets/create', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updatePalletType = async (id: number, data: any) => {
  const res = await api(`/api/shipping/packing_pallets/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deletePalletType = async (id: number) => {
  const res = await api(`/api/shipping/packing_pallets/delete/${id}`, {
    method: 'POST'
  });
  return res.json();
};

export const fetchContainerTypes = async () => {
  const res = await api('/api/shipping/packing_containers');
  return res.json();
};

export interface LogisticsCategory {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export const fetchLogisticsFactors = async (all = false) => {
  const res = await api(`/api/shipping/factors${all ? '?all=1' : ''}`);
  return res.json();
};

export const createLogisticsFactor = async (data: any) => {
  const res = await api('/api/shipping/factor-create', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updateLogisticsFactor = async (id: number, data: any) => {
  const res = await api(`/api/shipping/factor-update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteLogisticsFactor = async (id: number) => {
  const res = await api(`/api/shipping/factor-delete/${id}`, {
    method: 'POST'
  });
  return res.json();
};

// --- Logistics Categories ---
export const fetchLogisticsCategories = async () => {
  const res = await api('/api/shipping/categories');
  return res.json();
};

export const createLogisticsCategory = async (data: Partial<LogisticsCategory>) => {
  const res = await api('/api/shipping/category-create', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const updateLogisticsCategory = async (id: number, data: Partial<LogisticsCategory>) => {
  const res = await api(`/api/shipping/category-update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  return res.json();
};

export const deleteLogisticsCategory = async (id: number) => {
  const res = await api(`/api/shipping/category-delete/${id}`, {
    method: 'POST'
  });
  return res.json();
};

export const fetchTermDefaults = async (term: string) => {
  const res = await api(`/api/shipping/term-defaults/${term}`);
  return res.json();
};

export const importExportDefaults = async () => {
  const res = await api('/api/shipping/seed-defaults', {
    method: 'POST'
  });
  return res.json();
};

// --- Hotel / Front Office ---
export const fetchHotelReservations = async () => {
  const res = await api('/api/hotel/reservations');
  return res.json();
};

// --- Banquet ---
export const fetchBanquetBookings = async () => {
  const res = await api('/api/banquet/bookings');
  return res.json();
};
