import { api, ApiSuccess } from './client';
import { Building2, Layers, Banknote, ArrowRight, Settings, Gavel } from "lucide-react";

// Users & RBAC
export const adminFetchUsers = async () => {
  const res = await api('/api/admin/users');
  if (!res.ok) throw new Error('Failed to load users');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const adminSetUserRole = async (userId: string | number, roleId: number) => {
  const res = await api(`/api/admin/set_user_role/${userId}`, { method: 'POST', body: JSON.stringify({ role_id: roleId }) });
  if (!res.ok) throw new Error('Failed to update user role');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const adminSetUserLocation = async (userId: string | number, locationId: number) => {
  const res = await api(`/api/admin/set_user_location/${userId}`, { method: 'POST', body: JSON.stringify({ location_id: locationId }) });
  if (!res.ok) throw new Error('Failed to update user location');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const adminSetUserLocations = async (userId: string | number, locationIds: number[]) => {
  const res = await api(`/api/admin/set_user_locations/${userId}`, { method: 'POST', body: JSON.stringify({ location_ids: locationIds }) });
  if (!res.ok) throw new Error('Failed to update user locations');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const adminFetchUserLocations = async (userId: string | number) => {
  const res = await api(`/api/admin/user_locations/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user locations');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const adminSetUserActive = async (userId: string | number, active: number) => {
  const res = await api(`/api/admin/set_user_active/${userId}`, { method: 'POST', body: JSON.stringify({ active }) });
  if (!res.ok) throw new Error('Failed to update user status');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const rbacFetchRoles = async () => {
  const res = await api('/api/rbac/roles');
  if (!res.ok) throw new Error('Failed to load roles');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const rbacFetchPermissions = async () => {
  const res = await api('/api/rbac/permissions');
  if (!res.ok) throw new Error('Failed to load permissions');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const rbacFetchRolePermissions = async (roleId: string | number) => {
  const res = await api(`/api/rbac/role_permissions/${roleId}`);
  if (!res.ok) throw new Error('Failed to load role permissions');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const rbacSetRolePermissions = async (roleId: string | number, permissions: string[]) => {
  const res = await api(`/api/rbac/set_role_permissions/${roleId}`, { method: 'POST', body: JSON.stringify({ permissions }) });
  if (!res.ok) throw new Error('Failed to update role permissions');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const rbacCreateRole = async (payload: { name: string; description?: string }) => {
  const res = await api('/api/rbac/create_role', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create role');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const rbacDeleteRole = async (id: string | number) => {
  const res = await api(`/api/rbac/delete_role/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete role');
  return res.json() as Promise<ApiSuccess<null>>;
};

export interface ApiClientRow {
  id: number;
  client_name: string;
  domain: string;
  api_key: string;
  location_id?: number | null;
  location_name?: string | null;
  is_active: number;
  created_at: string;
  last_used_at?: string;
}

export const fetchApiClients = async () => {
  const res = await api('/api/apiclient/list');
  if (!res.ok) throw new Error('Failed to load API clients');
  const data = await res.json();
  return data.data || [];
};

export const createApiClient = async (payload: { client_name: string; domain: string; location_id?: number | null }) => {
  const res = await api('/api/apiclient/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Failed to create API client');
  }
  return res.json();
};

export const deleteApiClient = async (id: string | number) => {
  const res = await api(`/api/apiclient/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete API client');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const regenerateApiClientKey = async (id: string | number) => {
  const res = await api(`/api/apiclient/regenerate/${id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to regenerate API key');
  return res.json();
};

export const toggleApiClientStatus = async (id: string | number, is_active: number) => {
  const res = await api(`/api/apiclient/toggle/${id}`, { method: 'POST', body: JSON.stringify({ is_active }) });
  if (!res.ok) throw new Error('Failed to toggle API client status');
  return res.json() as Promise<ApiSuccess<null>>;
};

// Locations & Departments
export interface ServiceLocation {
  id: number;
  name: string;
  location_type: 'service' | 'warehouse';
  address?: string | null;
  phone?: string | null;
  tax_no?: string | null;
  tax_label?: string | null;
  allow_service_charge?: number;
  service_charge_rate?: number;
  allow_dine_in?: number;
  allow_take_away?: number;
  allow_retail?: number;
  is_pos_active?: number;
  allow_production?: number;
  allow_online?: number;
  google_analytics_code?: string | null;
  facebook_pixel_code?: string | null;
  default_customer_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export type ServiceLocationRow = ServiceLocation;

export const fetchLocations = async () => {
  const res = await api('/api/location/list');
  if (!res.ok) throw new Error('Failed to load locations');
  const data = await res.json();
  return data.status === 'success' ? (data.data as ServiceLocation[]) : data;
};

export const fetchLocation = async (id: string | number) => {
  const res = await api(`/api/location/get/${id}`);
  if (!res.ok) throw new Error('Failed to load location');
  const data = await res.json();
  return data.status === 'success' ? (data.data as ServiceLocation) : data;
};

export type DepartmentRow = { id: number; location_id: number; name: string; created_at?: string; updated_at?: string };

export const fetchDepartments = async () => {
  const res = await api('/api/department/list');
  if (!res.ok) throw new Error('Failed to load departments');
  const data = await res.json();
  return data.status === 'success' ? (data.data as DepartmentRow[]) : data;
};

export const createDepartment = async (payload: { name: string }) => {
  const res = await api('/api/department/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create department');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const createLocation = async (payload: Partial<ServiceLocation>) => {
  const res = await api('/api/location/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create location');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateLocation = async (id: string | number, payload: Partial<ServiceLocation>) => {
  const res = await api(`/api/location/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update location');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteLocation = async (id: string | number) => {
  const res = await api(`/api/location/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete location');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteDepartment = async (id: string | number) => {
  const res = await api(`/api/department/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete department');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateDepartment = async (id: string | number, payload: any) => {
  const res = await api(`/api/department/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update department');
  return res.json() as Promise<ApiSuccess<null>>;
};


// Settings
export interface CompanyRow {
  id: number;
  name: string;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  tax_no?: string | null;
  tax_label?: string | null;
  logo_filename?: string | null;
  tax_ids_json?: string | null; // Stores JSON array of enabled tax IDs
  created_at?: string;
  updated_at?: string;
}

export const fetchCompany = async () => {
  const res = await api('/api/company/get');
  if (!res.ok) throw new Error('Failed to load company details');
  const data = await res.json();
  return data.status === 'success' ? (data.data as CompanyRow) : data;
};

export const updateCompany = async (payload: Partial<CompanyRow> & { tax_ids?: number[] }) => {
  const res = await api('/api/company/update', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update company');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const fetchSystemSettings = async (): Promise<Record<string, string>> => {
  const res = await api('/api/settings/system');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to fetch system settings');
  }
  const data = await res.json();
  return data.data || {};
};

export const testSms = async (phone: string, message: string) => {
  const res = await api('/api/settings/testSms', { method: 'POST', body: JSON.stringify({ phone, message }) });
  if (!res.ok) throw new Error('Failed to test SMS');
  return res.json();
};

export const updateSystemSettings = async (settings: Record<string, string>): Promise<void> => {
  const res = await api('/api/settings/updateSystem', { method: 'POST', body: JSON.stringify(settings) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to update system settings');
  }
};
export const fetchStorefrontSettings = async (locationId: string | number = 1) => {
  const res = await api(`/api/storefront-settings/index?location_id=${locationId}`);
  if (!res.ok) throw new Error('Failed to load storefront settings');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const updateStorefrontSettings = async (payload: any) => {
  const res = await api('/api/storefront-settings/update', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('Failed to update storefront settings');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const testSmtpSettings = async (payload: any) => {
  const res = await api('/api/storefront-settings/testSmtp', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    let message = 'Failed to test SMTP settings';
    try {
        const err = await res.json();
        message = err.message || err.error || message;
    } catch (e) {
        message = `Server Error (${res.status})`;
    }
    throw new Error(message);
  }
  return res.json();
};

export const uploadStorefrontIcon = async (formData: FormData) => {
  const res = await api('/api/storefront-settings/uploadIcon', {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload icon');
  return res.json();
};
