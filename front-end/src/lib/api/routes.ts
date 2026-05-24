import { api } from './client';

export interface RouteModel {
  id: number;
  location_id: number;
  name: string;
  description: string | null;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export const fetchRoutes = async () => {
  const res = await api('/api/route/index');
  if (!res.ok) throw new Error('Failed to load routes');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

export const createRoute = async (payload: Partial<RouteModel>) => {
  const res = await api('/api/route/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create route');
  return res.json();
};

export const updateRoute = async (id: number | string, payload: Partial<RouteModel>) => {
  const res = await api(`/api/route/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update route');
  return res.json();
};

export const deleteRoute = async (id: number | string) => {
  const res = await api(`/api/route/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete route');
  return res.json();
};
