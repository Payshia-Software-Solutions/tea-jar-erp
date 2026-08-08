import { api, ApiSuccess } from './client';

export type ProductionOrderStatus = 'Pending' | 'In Progress' | 'Completed' | 'Cancelled';

export type ProductionOrderRow = {
  id: number;
  bom_id: number;
  bom_name?: string;
  location_id: number;
  location_name?: string;
  qty: number;
  actual_yield?: number | null;
  status: ProductionOrderStatus;
  notes: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
};

export type ProductionBomRow = {
  id: number;
  name: string;
  output_part_id: number;
  output_part_name?: string;
  is_active: number;
  created_at: string;
};

// Production Orders
export const fetchProductionOrders = async (filters: { status?: string; location_id?: number } = {}) => {
  const qs = new URLSearchParams();
  if (filters.status) qs.set('status', filters.status);
  if (filters.location_id) qs.set('location_id', String(filters.location_id));
  
  const res = await api(`/api/productionorder/list?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load production orders');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchProductionOrderStats = async () => {
  const res = await api('/api/productionorder/stats');
  if (!res.ok) throw new Error('Failed to load production statistics');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchProductionOrder = async (id: number | string) => {
  const res = await api(`/api/productionorder/get/${id}`);
  if (!res.ok) throw new Error('Failed to load production order');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createProductionOrder = async (payload: any) => {
  const res = await api('/api/productionorder/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to create production order');
  }
  return res.json() as Promise<ApiSuccess<number[]>>;
};

export const startProduction = async (id: number | string) => {
  const res = await api(`/api/productionorder/start/${id}`, { method: 'POST' });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to start production');
  }
  return res.json() as Promise<ApiSuccess<null>>;
};

export const completeProduction = async (id: number | string, payload: { actual_yield?: number; outputs?: any[]; waste_reason?: string }) => {
  const res = await api(`/api/productionorder/complete/${id}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to complete production');
  }
  return res.json() as Promise<ApiSuccess<null>>;
};

// BOMs
export const fetchBoms = async (activeOnly: boolean = false) => {
  const qs = activeOnly ? '?active=1' : '';
  const res = await api(`/api/productionbom/list${qs}`);
  if (!res.ok) throw new Error('Failed to load BOMs');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchBom = async (id: number | string) => {
  const res = await api(`/api/productionbom/get/${id}`);
  if (!res.ok) throw new Error('Failed to load BOM');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createBom = async (payload: any) => {
  const res = await api('/api/productionbom/create', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create BOM');
  return res.json() as Promise<ApiSuccess<{ id: number }>>;
};

export const updateBom = async (id: number | string, payload: any) => {
  const res = await api(`/api/productionbom/update/${id}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update BOM');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const fetchBomByPart = async (partId: number | string) => {
  const res = await api(`/api/productionbom/getByPart/${partId}`);
  if (!res.ok) throw new Error('Failed to load BOM for part');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const deleteBom = async (id: number | string) => {
  const res = await api(`/api/productionbom/delete/${id}`, {
    method: 'POST',
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to delete BOM');
  }
  return res.json() as Promise<ApiSuccess<null>>;
};

