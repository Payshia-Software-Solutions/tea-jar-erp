import { api, type ApiSuccess } from "./client";

export interface StorefrontMenuItem {
  id: number;
  parent_id: number | null;
  location_id: number | null;
  label: string;
  link_type: 'Internal' | 'External' | 'Category' | 'Collection' | 'Heading';
  link_value: string | null;
  sort_order: number;
  is_active: number;
  is_mega_menu: number;
  children?: StorefrontMenuItem[];
}

export async function fetchStorefrontMenus(activeOnly = false, locationId?: number | null): Promise<StorefrontMenuItem[]> {
  let params = new URLSearchParams();
  if (activeOnly) params.append('active', '1');
  if (locationId) params.append('location_id', locationId.toString());
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await api(`/api/storefront-menu/index${qs}`);
  if (!res.ok) throw new Error(`Failed to load menus: ${res.statusText}`);
  const json: ApiSuccess<StorefrontMenuItem[]> = await res.json();
  return json.status === 'success' ? json.data : [];
}

export async function fetchStorefrontMenusList(activeOnly = false, locationId?: number | null): Promise<StorefrontMenuItem[]> {
  let params = new URLSearchParams();
  if (activeOnly) params.append('active', '1');
  if (locationId) params.append('location_id', locationId.toString());
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await api(`/api/storefront-menu/list${qs}`);
  if (!res.ok) throw new Error(`Failed to load menu list: ${res.statusText}`);
  const json: ApiSuccess<StorefrontMenuItem[]> = await res.json();
  return json.status === 'success' ? json.data : [];
}

export async function createStorefrontMenu(data: Partial<StorefrontMenuItem>): Promise<{ id: number }> {
  const res = await api('/api/storefront-menu/create', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to create menu item' }));
    throw new Error(error.message || 'Failed to create menu item');
  }
  const json: ApiSuccess<{ id: number }> = await res.json();
  return json.data;
}

export async function updateStorefrontMenu(id: number, data: Partial<StorefrontMenuItem>): Promise<void> {
  const res = await api(`/api/storefront-menu/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update menu item' }));
    throw new Error(error.message || 'Failed to update menu item');
  }
}

export async function deleteStorefrontMenu(id: number): Promise<void> {
  const res = await api(`/api/storefront-menu/delete/${id}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to delete menu item' }));
    throw new Error(error.message || 'Failed to delete menu item');
  }
}

export async function sortStorefrontMenus(items: { id: number, sort_order: number }[]): Promise<void> {
  const res = await api('/api/storefront-menu/sort', {
    method: 'POST',
    body: JSON.stringify({ items })
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update sort order' }));
    throw new Error(error.message || 'Failed to update sort order');
  }
}

export async function fetchStorefrontSettings(): Promise<Record<string, string>> {
  const res = await api('/api/storefront-settings/index');
  if (!res.ok) throw new Error(`Failed to load settings: ${res.statusText}`);
  const json: ApiSuccess<Record<string, string>> = await res.json();
  return json.status === 'success' ? json.data : {};
}

export async function updateStorefrontSettings(data: Record<string, string>): Promise<void> {
  const res = await api('/api/storefront-settings/update', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update settings' }));
    throw new Error(error.message || 'Failed to update settings');
  }
}

export async function uploadStorefrontAsset(file: File): Promise<{ filename: string, url: string }> {
  const fd = new FormData();
  fd.append('file', file);
  const res = await api('/api/upload/storefront_asset', {
    method: 'POST',
    body: fd
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Upload failed' }));
    throw new Error(error.message || 'Upload failed');
  }
  const json: ApiSuccess<{ filename: string, url: string }> = await res.json();
  return json.data;
}
