import { api, ApiSuccess } from './client';
import { TaxRow } from './finance'; // Taxes are in finance

export type PartRow = {
  id: number;
  sku: string | null;
  part_number?: string | null;
  barcode_number?: string | null;
  part_name: string;
  unit: string | null;
  brand_id?: number | null;
  brand_name?: string | null;
  supplier_ids?: number[];
  suppliers?: Array<{ id: number; name: string }>;
  collection_ids?: number[];
  stock_quantity: number;
  on_hand?: number;
  reserved?: number;
  available?: number;
  cost_price: number | null;
  price: number;
  reorder_level: number | null;
  is_active: number;
  is_fifo?: number;
  is_expiry?: number;
  wholesale_price?: number;
  image_filename?: string | null;
  slug?: string | null;
  item_type: "Part" | "Service";
  recipe_type: "Standard" | "A La Carte" | "Recipe";
  allowed_locations?: string | null;
  
  // Shipping & Packing Defaults
  net_weight_kg?: number;
  gross_weight_kg?: number;
  units_per_carton?: number;
  packing_type?: string;
  carton_length_cm?: number;
  carton_width_cm?: number;
  carton_height_cm?: number;
  volume_cbm?: number;
  carton_tare_weight_kg?: number;

  // E-Commerce Rich Data
  is_online?: number;
  out_of_stock?: number;
  discount_type?: 'None' | 'Percentage' | 'Fixed';
  discount_value?: number;
  public_description?: string | null;
  item_section_id?: number | null;
  section_name?: string | null;
  item_department_id?: number | null;
  department_name?: string | null;
  item_category_id?: number | null;
  category_name?: string | null;
  gallery?: Array<{ id: number; filename: string; label: string | null; sort_order: number }>;
  attributes_grouped?: Array<{ id: number; name: string; attributes: any[] }>;
};

export type ItemSection = { id: number; name: string; };
export type ItemDepartment = { id: number; section_id: number; name: string; };
export type ItemCategory = { id: number; name: string; };

// Collections
export const fetchInventoryCollections = async () => {
  const res = await api('/api/inventory/collections');
  if (!res.ok) throw new Error('Failed to load collections');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchItemSections = async () => {
  const res = await api('/api/item-breakdown/sections');
  if (!res.ok) throw new Error('Failed to load sections');
  const data = await res.json();
  return data.status === 'success' ? data.data as ItemSection[] : data as ItemSection[];
};

export const createItemSection = async (payload: { name: string }) => {
  const res = await api('/api/item-breakdown/create_section', { method: 'POST', body: JSON.stringify(payload) });
  return res.json();
};

export const updateItemSection = async (id: number | string, payload: { name: string }) => {
  const res = await api(`/api/item-breakdown/update_section/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  return res.json();
};

export const deleteItemSection = async (id: number | string) => {
  const res = await api(`/api/item-breakdown/delete_section/${id}`, { method: 'DELETE' });
  return res.json();
};

export const fetchItemDepartments = async (sectionId?: number | string) => {
  const qs = sectionId ? `?section_id=${sectionId}` : '';
  const res = await api(`/api/item-breakdown/departments${qs}`);
  if (!res.ok) throw new Error('Failed to load departments');
  const data = await res.json();
  return data.status === 'success' ? data.data as ItemDepartment[] : data as ItemDepartment[];
};

export const createItemDepartment = async (payload: { section_id: number; name: string }) => {
  const res = await api('/api/item-breakdown/create_department', { method: 'POST', body: JSON.stringify(payload) });
  return res.json();
};

export const updateItemDepartment = async (id: number | string, payload: { section_id: number; name: string }) => {
  const res = await api(`/api/item-breakdown/update_department/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  return res.json();
};

export const deleteItemDepartment = async (id: number | string) => {
  const res = await api(`/api/item-breakdown/delete_department/${id}`, { method: 'DELETE' });
  return res.json();
};

export const fetchItemCategories = async () => {
  const res = await api('/api/item-breakdown/categories');
  if (!res.ok) throw new Error('Failed to load categories');
  const data = await res.json();
  return data.status === 'success' ? data.data as ItemCategory[] : data as ItemCategory[];
};

export const createItemCategory = async (payload: { name: string }) => {
  const res = await api('/api/item-breakdown/create_category', { method: 'POST', body: JSON.stringify(payload) });
  return res.json();
};

export const updateItemCategory = async (id: number | string, payload: { name: string }) => {
  const res = await api(`/api/item-breakdown/update_category/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  return res.json();
};

export const deleteItemCategory = async (id: number | string) => {
  const res = await api(`/api/item-breakdown/delete_category/${id}`, { method: 'DELETE' });
  return res.json();
};

// Attributes Groups
export const fetchAttributeGroups = async () => {
  const res = await api('/api/attribute/list_groups');
  if (!res.ok) throw new Error('Failed to load attribute groups');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createAttributeGroup = async (payload: any) => {
  const res = await api('/api/attribute/create_group', { method: 'POST', body: JSON.stringify(payload) });
  return res.json();
};

export const updateAttributeGroup = async (id: number | string, payload: any) => {
  const res = await api(`/api/attribute/update_group/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  return res.json();
};

export const deleteAttributeGroup = async (id: number | string) => {
  const res = await api(`/api/attribute/delete_group/${id}`, { method: 'DELETE' });
  return res.json();
};

// Attributes
export const fetchAttributes = async (groupId?: number | string) => {
  const url = groupId ? `/api/attribute/list/${groupId}` : '/api/attribute/list';
  const res = await api(url);
  if (!res.ok) throw new Error('Failed to load attributes');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createAttribute = async (payload: any) => {
  const res = await api('/api/attribute/create', { method: 'POST', body: JSON.stringify(payload) });
  return res.json();
};

export const updateAttribute = async (id: number | string, payload: any) => {
  const res = await api(`/api/attribute/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  return res.json();
};

export const deleteAttribute = async (id: number | string) => {
  const res = await api(`/api/attribute/delete/${id}`, { method: 'DELETE' });
  return res.json();
};

export const assignAttributeGroupToPart = async (partId: number, groupId: number) => {
  const res = await api('/api/attribute/assign_to_part', {
    method: 'POST',
    body: JSON.stringify({ part_id: partId, group_id: groupId })
  });
  return res.json();
};

export const unassignAttributeGroupFromPart = async (partId: number, groupId: number) => {
  const res = await api('/api/attribute/unassign_from_part', {
    method: 'POST',
    body: JSON.stringify({ part_id: partId, group_id: groupId })
  });
  return res.json();
};

// Gallery
export const uploadPartGalleryImage = async (partId: string | number, file: File, label?: string) => {
  const formData = new FormData();
  formData.append('image', file);
  if (label) formData.append('label', label);
  formData.append('part_id', String(partId));

  const res = await api('/api/upload/part_gallery', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Upload failed');
  }
  return res.json();
};

export const deletePartGalleryImage = async (id: number | string) => {
  const res = await api(`/api/part/gallery_delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete gallery image');
  return res.json();
};

export const updatePartGallery = async (partId: number | string, images: any[]) => {
  const res = await api(`/api/part/gallery_update/${partId}`, {
    method: 'POST',
    body: JSON.stringify({ images })
  });
  return res.json();
};

export const fetchParts = async (q: string = '') => {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const res = await api(`/api/part/list${qs}`);
  if (!res.ok) throw new Error('Failed to load parts');
  const data = await res.json();
  return data.status === 'success' ? (data.data as PartRow[]) : data;
};

export const fetchPart = async (id: string | number) => {
  const res = await api(`/api/part/get/${id}`);
  if (!res.ok) throw new Error('Failed to load part');
  const data = await res.json();
  return data.status === 'success' ? (data.data as PartRow) : data;
};

export const fetchPartsForSupplier = async (supplierId: number, q: string = '') => {
  const qs = `?supplier_id=${encodeURIComponent(String(supplierId))}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
  const res = await api(`/api/part/list${qs}`);
  if (!res.ok) throw new Error('Failed to load parts');
  const data = await res.json();
  return data.status === 'success' ? (data.data as PartRow[]) : data;
};

export const createPart = async (payload: Partial<PartRow> & { supplier_ids?: number[] }) => {
  const res = await api('/api/part/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create part');
  return res.json() as Promise<ApiSuccess<{ id: number }>>;
};

export const updatePart = async (id: string | number, payload: Partial<PartRow> & { supplier_ids?: number[] }) => {
  const res = await api(`/api/part/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update part');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const bulkUpdatePartDiscount = async (payload: { ids: number[], discount_type: string, discount_value: number }) => {
    const res = await api('/api/part/bulk_update_discount', { 
        method: 'POST', 
        body: JSON.stringify(payload) 
    });
    if (!res.ok) throw new Error('Failed to bulk update discounts');
    return res.json() as Promise<ApiSuccess<null>>;
};

export const deletePart = async (id: string | number) => {
  const res = await api(`/api/part/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete part');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const adjustPartStock = async (payload: { part_id: number; qty_change: number; notes?: string }) => {
  const res = await api('/api/part/adjust_stock', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to adjust stock');
  }
  return res.json() as Promise<ApiSuccess<null>>;
};

export const fetchPartMovements = async (
  id: string | number,
  limit: number = 200,
  locationId?: number | string,
  fromDate?: string,
  toDate?: string,
  offset: number = 0
) => {
  const qs = new URLSearchParams();
  qs.set('limit', String(limit));
  qs.set('offset', String(offset));
  if (locationId) qs.set('location_id', String(locationId));
  if (fromDate) qs.set('from', fromDate);
  if (toDate) qs.set('to', toDate);
  const res = await api(`/api/part/movements/${id}?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load stock movements');
  const data = await res.json();
  return data.status === 'success' ? data.data : { data: [], total: 0 };
};

export type LocationStock = {
  part_id: number;
  location_id: number;
  on_hand: number;
  reserved: number;
  available: number;
};

export const fetchPartLocationStock = async (partId: string | number, locationId: string | number) => {
  const pid = encodeURIComponent(String(partId));
  const lid = encodeURIComponent(String(locationId));
  const res = await api(`/api/part/location_stock/${pid}?location_id=${lid}`);
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to load location stock');
  }
  const data = await res.json();
  return data.status === 'success' ? (data.data as LocationStock) : (data as LocationStock);
};

export const fetchLocationStockBalances = async (locationId: number, q: string = '') => {
  const qs = new URLSearchParams();
  qs.set('location_id', String(locationId));
  if (q) qs.set('q', q);
  const res = await api(`/api/part/location_balances?${qs.toString()}`);
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to load location stock');
  }
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

// Batch & Stock Adjustment Sub-module
export const fetchInventoryBatches = async (partId: string | number, locationId: string | number) => {
  const res = await api(`/api/part/batches/${partId}?location_id=${locationId}`);
  if (!res.ok) throw new Error('Failed to load inventory batches');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

export const fetchPartBatches = fetchInventoryBatches; // Alias

export interface LocationStockBalanceRow {
  id: number;
  part_id: number;
  location_id: number;
  on_hand: number;
  reserved: number;
  available: number;
  cost_price: number;
  reorder_level: number;
  part_name?: string;
  sku?: string;
  location_name?: string;
  unit?: string;
  batches?: any[];
}


export interface StockAdjustmentBatchRow {
  id: number;
  batch_no: string;
  adjustment_number?: string;
  location_id: number;
  notes: string;
  status: string;
  reason?: string;
  total_qty_change?: number;
  line_count?: number;
  adjusted_at?: string;
  created_at: string;
  created_by?: number;
  created_by_name?: string;
}


export const fetchStockAdjustmentBatchForLocation = async (id: number | string) => {

  const res = await api(`/api/inventory/adjustment_batch/${id}`);
  if (!res.ok) throw new Error('Failed to load adjustment batch');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createStockAdjustmentBatchForLocation = async (payload: any) => {
  const res = await api('/api/inventory/adjustment_batch/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create adjustment batch');
  return res.json();
};


export interface StockAdjustmentBatchItem {
  id: number;
  batch_id: number;
  part_id: number;
  system_qty: number;
  actual_qty: number;
  difference: number;
  unit_cost: number;
  part_name?: string;
  sku?: string;
}

export const fetchStockAdjustmentBatches = async (q: string = '') => {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const res = await api(`/api/stockadjustment/list${qs}`);
  if (!res.ok) throw new Error('Failed to load stock adjustments');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchStockAdjustmentBatchesForLocation = async (q: string = '', locationId?: number | string) => {
  const qs = new URLSearchParams();
  if (q) qs.set('q', q);
  
  const headers: Record<string, string> = {};
  if (locationId) headers['X-Location-Id'] = String(locationId);

  const res = await api(`/api/stockadjustment/list?${qs.toString()}`, {
    headers: Object.keys(headers).length ? headers : undefined,
  });
  if (!res.ok) throw new Error('Failed to load stock adjustments');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchStockAdjustmentBatch = async (id: string | number) => {
  const res = await api(`/api/stockadjustment/get/${id}`);
  if (!res.ok) throw new Error('Failed to load stock adjustment');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createStockAdjustmentBatch = async (payload: any) => {
  const res = await api('/api/stockadjustment/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to create stock adjustment');
  }
  return res.json() as Promise<ApiSuccess<{ id: number }>>;
};

// Suppliers
export type SupplierRow = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_reg_no?: string | null;
  is_active: number;
  tax_ids?: number[];
  taxes?: TaxRow[];
};

export const fetchSuppliers = async (q: string = '') => {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const res = await api(`/api/supplier/list${qs}`);
  if (!res.ok) throw new Error('Failed to load suppliers');
  const data = await res.json();
  return data.status === 'success' ? (data.data as SupplierRow[]) : data;
};

export const fetchSupplier = async (id: string | number) => {
  const res = await api(`/api/supplier/get/${id}`);
  if (!res.ok) throw new Error('Failed to load supplier');
  const data = await res.json();
  return data.status === 'success' ? (data.data as SupplierRow) : data;
};

export const createSupplier = async (payload: Partial<SupplierRow>) => {
  const res = await api('/api/supplier/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create supplier');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateSupplier = async (id: string | number, payload: Partial<SupplierRow>) => {
  const res = await api(`/api/supplier/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update supplier');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteSupplier = async (id: string | number) => {
  const res = await api(`/api/supplier/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete supplier');
  return res.json() as Promise<ApiSuccess<null>>;
};

export type PurchaseOrderItemRow = {
  id?: number;
  purchase_order_id?: number;
  part_id: number;
  part_name?: string;
  sku?: string;
  qty_ordered: number;
  qty_received?: number;
  unit_cost: number;
  line_total?: number;
};

export const setPurchaseOrderStatus = async (id: number | string, status: string) => {
  const res = await api(`/api/purchaseorder/set_status/${id}`, { method: 'POST', body: JSON.stringify({ status }) });
  if (!res.ok) throw new Error('Failed to update purchase order status');
  return res.json();
};


export type PurchaseOrderRow = {
  id: number;
  supplier_id: number;
  supplier_name?: string;
  po_number: string;
  location_id?: number;
  location_name?: string;
  ordered_at: string;
  expected_at: string | null;
  status: 'Draft' | 'Sent' | 'Approved' | 'Received' | 'Partial' | 'Completed' | 'Cancelled';
  total_amount: number;
  tax_amount: number;
  grand_total: number;
  notes: string | null;
  items?: PurchaseOrderItemRow[];
  last_grn_number?: string;
  created_at: string;
  updated_at?: string;
};


export interface GrnRow {
  id: number;
  grn_number: string;
  supplier_id: number;
  supplier_name?: string;
  po_id?: number | null;
  po_number?: string | null;
  location_id: number;
  location_name?: string;
  received_at: string;
  reference_no?: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  grand_total: number;
  items?: GrnItemRow[];
}

export interface GrnItemRow {
  id?: number;
  grn_id?: number;
  part_id: number;
  part_name?: string;
  sku?: string;
  qty_received: number;
  unit_cost: number;
  line_total?: number;
}


export interface StockRequisitionRow {
  id: number;
  requisition_no: string;
  requisition_number?: string;
  location_id: number;
  location_name?: string;
  to_location_name?: string;
  to_location_id?: number;
  department_id?: number;
  department_name?: string;
  status: string;
  notes?: string;
  total_qty_requested?: number;
  total_qty_fulfilled?: number;
  created_at: string;
}



export interface StockTransferRow {
  id: number;
  transfer_no: string;
  transfer_number?: string;
  from_location_id: number;
  to_location_id: number;
  from_location_name?: string;
  to_location_name?: string;
  status: string;
  sent_at?: string;
  received_at?: string;
  line_count?: number;
  created_at: string;
}




// Purchase Orders (PO)
export const fetchPurchaseOrders = async (q: string = '') => {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const res = await api(`/api/purchase/list${qs}`);
  if (!res.ok) throw new Error('Failed to load purchase orders');
  const data = await res.json();
  return data.status === 'success' ? (data.data as PurchaseOrderRow[]) : data;
};

export const fetchPurchaseOrder = async (id: string | number) => {
  const res = await api(`/api/purchase/get/${id}`);
  if (!res.ok) throw new Error('Failed to load purchase order');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createPurchaseOrder = async (payload: any) => {
  const res = await api('/api/purchase/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to create purchase order');
  }
  return res.json() as Promise<ApiSuccess<{ id: number }>>;
};

export const updatePurchaseOrder = async (id: string | number, payload: any) => {
  const res = await api(`/api/purchase/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update purchase order');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updatePurchaseOrderStatus = async (id: string | number, status: string) => {
  const res = await api(`/api/purchase/set_status/${id}`, { method: 'POST', body: JSON.stringify({ status }) });
  if (!res.ok) throw new Error('Failed to update PO status');
  return res.json() as Promise<ApiSuccess<null>>;
};

// Good Receive Note (GRN)
export const fetchGrns = async (q: string = '') => {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const res = await api(`/api/grn/list${qs}`);
  if (!res.ok) throw new Error('Failed to load GRNs');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchGrn = async (id: string | number) => {
  const res = await api(`/api/grn/get/${id}`);
  if (!res.ok) throw new Error('Failed to load GRN');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createGrn = async (payload: any, locationIdOverride?: number | null) => {
  const headers: Record<string, string> = {};
  if (locationIdOverride) headers["X-Location-Id"] = String(locationIdOverride);

  const res = await api('/api/grn/create', {
    method: 'POST',
    body: JSON.stringify(payload),
    ...(Object.keys(headers).length ? { headers } : {}),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to create GRN');
  }
  return res.json() as Promise<ApiSuccess<{ id: number }>>;
};
export const cancelGrn = async (id: number, reason: string) => {
  const res = await api(`/api/grn/cancel/${id}`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to cancel GRN');
  }
  return res.json();
};
export const cancelSupplierPayment = async (id: number, reason: string) => {
  const res = await api(`/api/supplier/cancel_payment/${id}`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to cancel supplier payment');
  }
  return res.json();
};

// Transfers & Requisitions
export const fetchTransfers = async () => {
  const res = await api('/api/stocktransfer/list');
  if (!res.ok) throw new Error('Failed to load transfers');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchTransfer = async (id: string | number) => {
  const res = await api(`/api/stocktransfer/get/${id}`);
  if (!res.ok) throw new Error('Failed to load transfer');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createTransfer = async (payload: any) => {
  const res = await api('/api/stocktransfer/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to create transfer');
  }
  return res.json();
};

export const receiveTransfer = async (id: string | number) => {
  const res = await api(`/api/stocktransfer/receive/${id}`, { method: 'POST' });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to receive transfer');
  }
  return res.json();
};

export const fetchRequisitions = async () => {
  const res = await api('/api/stockrequisition/list');
  if (!res.ok) throw new Error('Failed to load requisitions');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchRequisition = async (id: string | number) => {
  const res = await api(`/api/stockrequisition/get/${id}`);
  if (!res.ok) throw new Error('Failed to load requisition');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createRequisition = async (payload: any) => {
  const res = await api('/api/stockrequisition/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to create requisition');
  }
  return res.json();
};

export const approveRequisition = async (id: string | number) => {
  const res = await api(`/api/stockrequisition/approve/${id}`, { method: 'POST' });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to approve requisition');
  }
  return res.json();
};

export const uploadPartImage = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);

  const res = await api('/api/upload/part_image', {
    method: 'POST',
    body: formData,
    // Note: client.ts should handle removing Content-Type for FormData
  });

  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Upload failed');
  }
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const setPartImage = async (id: string | number, filename: string) => {
  const res = await api(`/api/part/set_image/${id}`, {
    method: 'POST',
    body: JSON.stringify({ image_filename: filename }),
  });
  if (!res.ok) throw new Error('Failed to set part image');
  return res.json() as Promise<ApiSuccess<null>>;
};
