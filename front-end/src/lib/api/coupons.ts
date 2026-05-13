import { api } from './client';

export const couponApi = {
  getAll: async () => {
    const res = await api('/api/coupon');
    const data = await res.json();
    return data.status === 'success' ? data.data : data;
  },
  get: async (id: string | number) => {
    const res = await api(`/api/coupon/get/${id}`);
    const data = await res.json();
    return data.status === 'success' ? data.data : data;
  },
  create: async (data: any) => {
    const res = await api('/api/coupon/store', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.status !== 'success') throw new Error(result.message || 'Failed to create coupon');
    return result.data;
  },
  update: async (id: string | number, data: any) => {
    const res = await api(`/api/coupon/update/${id}`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (result.status !== 'success') throw new Error(result.message || 'Failed to update coupon');
    return result.data;
  },
  delete: async (id: string | number) => {
    const res = await api(`/api/coupon/delete/${id}`, {
      method: 'POST'
    });
    const result = await res.json();
    if (result.status !== 'success') throw new Error(result.message || 'Failed to delete coupon');
    return result.data;
  },
  getUsage: async (id: string | number) => {
    const res = await api(`/api/coupon/usage/${id}`);
    const data = await res.json();
    return data.status === 'success' ? data.data : data;
  },
};
