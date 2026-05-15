import { api, ApiSuccess, SystemCheckResponse } from './client';

// Vehicles, Makes, Models
export const fetchMakes = async () => {
  const res = await api('/api/make/list');
  if (!res.ok) throw new Error('Failed to load makes');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchModels = async (makeId?: number) => {
  const qs = makeId ? `?make_id=${encodeURIComponent(String(makeId))}` : '';
  const res = await api(`/api/model/list${qs}`);
  if (!res.ok) throw new Error('Failed to load models');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchVehicles = async (page: number = 1, limit: number = 10, filter: string = 'all', search: string = '') => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    filter,
    search
  });
  const res = await api(`/api/vehicle/list?${params.toString()}`);
  if (!res.ok) return { data: [], total: 0, page, limit, pages: 0 };
  const data = await res.json();
  return data.status === 'success' ? data.data : { data: [], total: 0, page, limit, pages: 0 };
};

// Brands & Units
export type BrandRow = { id: number; name: string; created_at?: string; updated_at?: string };

export const fetchBrands = async (q: string = '') => {
  const res = await api(`/api/brand/list${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  if (!res.ok) throw new Error('Failed to load brands');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createBrand = async (payload: { name: string }) => {
  const res = await api('/api/brand/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create brand');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateBrand = async (id: string | number, payload: { name: string }) => {
  const res = await api(`/api/brand/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update brand');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteBrand = async (id: string | number) => {
  const res = await api(`/api/brand/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete brand');
  return res.json() as Promise<ApiSuccess<null>>;
};

export type UnitRow = { id: number; name: string; symbol: string; base_unit?: string; convert_factor?: number };

export const fetchUnits = async (q: string = '') => {
  const res = await api(`/api/unit/list${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  if (!res.ok) throw new Error('Failed to load units');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createUnit = async (payload: Partial<UnitRow>) => {
  const res = await api('/api/unit/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create unit');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateUnit = async (id: string | number, payload: Partial<UnitRow>) => {
  const res = await api(`/api/unit/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update unit');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteUnit = async (id: string | number) => {
  const res = await api(`/api/unit/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete unit');
  return res.json() as Promise<ApiSuccess<null>>;
};

// Customers
export const fetchCustomers = async (q: string = '') => {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const res = await api(`/api/customer/list${qs}`);
  if (!res.ok) throw new Error('Failed to load customers');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchEcommerceCustomers = async () => {
  const res = await api('/api/customer/ecommerce');
  if (!res.ok) throw new Error('Failed to load storefront customers');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createCustomer = async (payload: any) => {
  const res = await api('/api/customer/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create customer');
  return res.json();
};

export const updateCustomer = async (id: string | number, payload: any) => {
  const res = await api(`/api/customer/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update customer');
  return res.json();
};

export const deleteCustomer = async (id: string | number) => {
  const res = await api(`/api/customer/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete customer');
  return res.json();
};

export const fetchCustomerVehicles = async (customerId: string | number) => {
  const res = await api(`/api/customer/vehicles/${customerId}`);
  if (!res.ok) throw new Error('Failed to load customer vehicles');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchCustomerSummary = async (id: string | number) => {
  const res = await api(`/api/customer/summary/${id}`);
  if (!res.ok) throw new Error('Failed to load customer summary');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

// Categories & Checklists
export const fetchCategories = async () => {
  const res = await api('/api/category/list');
  if (!res.ok) throw new Error('Failed to load categories');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createCategory = async (payload: { name: string }) => {
  const res = await api('/api/category/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create category');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateCategory = async (id: string | number, payload: { name: string }) => {
  const res = await api(`/api/category/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update category');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteCategory = async (id: string | number) => {
  const res = await api(`/api/category/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete category');
  return res.json() as Promise<ApiSuccess<null>>;
};

export interface BayRow {
  id: number;
  location_id: number;
  location_name?: string;
  name: string;
  status: 'Available' | 'Occupied' | 'Out of Service';
  created_at?: string;
}

export interface TechnicianRow {
  id: number;
  name: string;
  role: string;
  created_at: string;
}


export const fetchChecklistTemplates = async () => {
  const res = await api('/api/checklistrepo/list');
  if (!res.ok) throw new Error('Failed to load checklist templates');
  const data = await res.json();
  return data.status === 'success' ? (data.data as any[]) : [];
};

export interface BayListAllRow {
  id: number;
  location_id: number;
  location_name: string;
  name: string;
  status: 'Available' | 'Occupied' | 'Out of Service';
  created_at: string;
}

export const fetchBaysAll = async () => {
  const res = await api('/api/bay/list_all');
  if (!res.ok) throw new Error('Failed to load service bays');
  const data = await res.json();
  return data.status === 'success' ? data.data : { bays: [], locations: [] };
};

export const updateBayStatus = async (id: string | number, status: string) => {
  const res = await api(`/api/bay/update_status/${id}`, { method: 'POST', body: JSON.stringify({ status }) });
  if (!res.ok) throw new Error('Failed to update bay status');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const createChecklistTemplate = async (payload: { description: string }) => {
  const res = await api('/api/checklistrepo/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create checklist item');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateChecklistTemplate = async (id: string | number, payload: { description: string }) => {
  const res = await api(`/api/checklistrepo/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update checklist item');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteChecklistTemplate = async (id: string | number) => {
  const res = await api(`/api/checklistrepo/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete checklist item');
  return res.json() as Promise<ApiSuccess<null>>;
};


export const fetchTechnicians = async () => {
  const res = await api('/api/technician/list');
  if (!res.ok) throw new Error('Failed to load technicians');
  const data = await res.json();
  return data.status === 'success' ? (data.data as TechnicianRow[]) : [];
};

export const createTechnician = async (payload: Partial<TechnicianRow>) => {
  const res = await api('/api/technician/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create technician');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateTechnician = async (id: string | number, payload: Partial<TechnicianRow>) => {
  const res = await api(`/api/technician/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update technician');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteTechnician = async (id: string | number) => {
  const res = await api(`/api/technician/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove technician');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const fetchBays = async (all: boolean = false) => {
  const endpoint = all ? '/api/bay/list_all' : '/api/bay/list';
  const res = await api(endpoint);
  if (!res.ok) throw new Error('Failed to load service bays');
  const data = await res.json();
  // list_all returns { bays: [...] }, list returns [...]
  if (data.status === 'success') {
    return Array.isArray(data.data) ? (data.data as BayRow[]) : (data.data.bays as BayRow[]);
  }
  return [];
};

export const createBay = async (payload: Partial<BayRow>) => {
  const res = await api('/api/bay/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create bay');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateBay = async (id: string | number, payload: Partial<BayRow>) => {
  const res = await api(`/api/bay/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update bay');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteBay = async (id: string | number) => {
  const res = await api(`/api/bay/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove bay');
  return res.json() as Promise<ApiSuccess<null>>;
};

// Misc
export const checkTables = async () => {
  const res = await api('/api/check/check');
  if (!res.ok) throw new Error('Failed to check database tables');
  return res.json() as Promise<SystemCheckResponse>;
};

// Tables (for POS/Dine-in)
export interface TableRow {
  id: number;
  location_id: number;
  name: string;
  capacity: number;
  status: 'Available' | 'Occupied' | 'Reserved';
}

export const fetchTables = async (locationId?: number) => {
  const qs = locationId ? `?location_id=${locationId}` : '';
  const res = await api(`/api/table/list${qs}`);
  if (!res.ok) throw new Error('Failed to load tables');
  const data = await res.json();
  return data.status === 'success' ? (data.data || []) : [];
};

export const createTable = async (payload: any) => {
  const res = await api('/api/table/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create table');
  return res.json();
};

export const updateTable = async (id: string | number, payload: any) => {
  const res = await api(`/api/table/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update table');
  return res.json();
};

export const deleteTable = async (id: string | number) => {
  const res = await api(`/api/table/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete table');
  return res.json();
};


// Collections
export const fetchCollections = async (publicOnly: boolean = false) => {
  const qs = publicOnly ? '?public=1' : '';
  const res = await api(`/api/collection/list${qs}`);
  if (!res.ok) throw new Error('Failed to load collections');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchCollection = async (id: number | string) => {
  const res = await api(`/api/collection/get/${id}`);
  if (!res.ok) throw new Error('Failed to load collection');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createCollection = async (payload: any) => {
  const res = await api('/api/collection/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create collection');
  return res.json();
};

export const updateCollection = async (id: string | number, payload: any) => {
  const res = await api(`/api/collection/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update collection');
  return res.json();
};

export const deleteCollection = async (id: string | number) => {
  const res = await api(`/api/collection/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete collection');
  return res.json();
};

export const fetchCollectionParts = async (id: number | string) => {
  const res = await api(`/api/collection/parts/${id}`);
  if (!res.ok) throw new Error('Failed to load collection parts');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const syncCollectionParts = async (id: number | string, partIds: number[]) => {
  const res = await api(`/api/collection/sync_parts/${id}`, { method: 'POST', body: JSON.stringify({ part_ids: partIds }) });
  if (!res.ok) throw new Error('Failed to sync collection parts');
  return res.json();
};

// --- Vehicles ---
export interface VehicleRow {
  id: number;
  customer_id: number;
  make_id: number;
  model_id: number;
  plate_number: string;
  vehicle_identifier?: string;
  make?: string;
  model?: string;
  vin?: string;
  chassis_number?: string;
  chassis_no?: string;
  engine_number?: string;
  engine_no?: string;
  year_of_manufacture?: string;
  year?: number;
  vehicle_model?: string;
  customer_name?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export const fetchVehicle = async (id: string | number) => {
  const res = await api(`/api/vehicle/get/${id}`);
  if (!res.ok) throw new Error('Failed to load vehicle');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};


export const createVehicle = async (payload: any) => {
  const res = await api('/api/vehicle/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create vehicle');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateVehicle = async (id: string | number, payload: any) => {
  const res = await api(`/api/vehicle/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update vehicle');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteVehicle = async (id: string | number) => {
  const res = await api(`/api/vehicle/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete vehicle');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const uploadVehicleImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);
  const res = await api('/api/upload/vehicle_image', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const uploadVehicleDocument = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api('/api/upload/vehicle_document', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const syncVehicles = async () => {
  const res = await api('/api/vehicle-sync/sync', { method: 'POST' });
  if (!res.ok) throw new Error('Sync failed');
  return res.json() as Promise<ApiSuccess<{ success: number; failed: number }>>;
};

// --- Vehicle Documents ---
export const fetchVehicleDocuments = async (vehicleId: number | string) => {
  const res = await api(`/api/vehicle-document/list/${vehicleId}`);
  if (!res.ok) throw new Error('Failed to load documents');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

export const addVehicleDocument = async (payload: any) => {
  const res = await api('/api/vehicle-document/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to add document');
  return res.json();
};

export const deleteVehicleDocument = async (id: number | string) => {
  const res = await api(`/api/vehicle-document/delete/${id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
};

export const fetchExpiringDocuments = async (days: number = 30) => {
  const res = await api(`/api/vehicle-document/expiring?days=${days}`);
  if (!res.ok) throw new Error('Failed to load expiring documents');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

// --- Makes ---
export const createMake = async (payload: { name: string }) => {
  const res = await api('/api/make/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create make');
  return res.json();
};

export const updateMake = async (id: number | string, payload: { name: string }) => {
  const res = await api(`/api/make/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update make');
  return res.json();
};

export const deleteMake = async (id: number | string) => {
  const res = await api(`/api/make/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete make');
  return res.json();
};

// --- Models ---
export const createModel = async (payload: { make_id: number; name: string }) => {
  const res = await api('/api/model/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create model');
  return res.json();
};

export const updateModel = async (id: number | string, payload: { make_id: number; name: string }) => {
  const res = await api(`/api/model/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update model');
  return res.json();
};

export const deleteModel = async (id: number | string) => {
  const res = await api(`/api/model/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete model');
  return res.json();
};
