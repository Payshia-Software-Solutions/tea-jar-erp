import { api } from './client';

export const fetchDashboardDetails = async () => {
  const res = await api('/api/report/overview');
  if (!res.ok) throw new Error('Failed to load dashboard overview');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

// --- Specialized Reports ---

export const fetchStockBalance = async (params: { location_id?: string; group?: string; q?: string; as_of?: string; batches?: boolean } = {}) => {
  const qs = new URLSearchParams();
  if (params.location_id) qs.set('location_id', params.location_id);
  if (params.group) qs.set('group', params.group);
  if (params.q) qs.set('q', params.q);
  if (params.as_of) qs.set('as_of', params.as_of);
  if (params.batches) qs.set('batches', '1');

  const res = await api(`/api/report/stock_balance?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load stock balance report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchLowStockReport = async (params: { location_id?: string; q?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.location_id) qs.set('location_id', params.location_id);
  if (params.q) qs.set('q', params.q);

  const res = await api(`/api/report/low_stock?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load low stock report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchItemMovements = async (params: { part_id: number; location_id?: string; from?: string; to?: string; movement_type?: string; limit?: number; offset?: number }) => {
  const qs = new URLSearchParams();
  qs.set('part_id', String(params.part_id));
  if (params.location_id) qs.set('location_id', params.location_id);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.movement_type) qs.set('movement_type', params.movement_type);
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.offset) qs.set('offset', String(params.offset));

  const res = await api(`/api/report/item_movements?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load item movements');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchStockTransferReport = async (params: { location_id?: string; from?: string; to?: string; status?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.location_id) qs.set('location_id', params.location_id);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.status) qs.set('status', params.status);

  const res = await api(`/api/report/stock_transfers?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load stock transfers report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchVehiclesReport = async (params: { q?: string; department_id?: number } = {}) => {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.department_id) qs.set('department_id', String(params.department_id));

  const res = await api(`/api/report/vehicles?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load vehicles report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchVehicleHistory = async (params: { vehicle_id: number; from?: string; to?: string }) => {
  const qs = new URLSearchParams();
  qs.set('vehicle_id', String(params.vehicle_id));
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);

  const res = await api(`/api/report/vehicle_history?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load vehicle history');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchItemsReport = async (params: { q?: string; brand_id?: number; supplier_id?: number; active?: number } = {}) => {
  const qs = new URLSearchParams();
  if (params.q) qs.set('q', params.q);
  if (params.brand_id) qs.set('brand_id', String(params.brand_id));
  if (params.supplier_id) qs.set('supplier_id', String(params.supplier_id));
  if (params.active !== undefined) qs.set('active', String(params.active));

  const res = await api(`/api/report/items?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load items report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

// --- Sales Reports ---

export const fetchSalesReportSummary = async (params: { location_id?: string; from?: string; to?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.location_id) qs.set('location_id', params.location_id);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);

  const res = await api(`/api/report/sales_summary?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load sales summary report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchInvoiceReport = async (params: { location_id?: string; from?: string; to?: string; status?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.location_id) qs.set('location_id', params.location_id);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.status) qs.set('status', params.status);

  const res = await api(`/api/report/invoice_report?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load invoice report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchPaymentReceiptReport = async (params: { location_id?: string; from?: string; to?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.location_id) qs.set('location_id', params.location_id);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);

  const res = await api(`/api/report/payment_receipt_report?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load payment receipts report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchDayEndSalesReport = async (params: { location_id?: string; date?: string }) => {
  const qs = new URLSearchParams();
  if (params.location_id) qs.set('location_id', params.location_id);
  if (params.date) qs.set('date', params.date);

  const res = await api(`/api/report/day_end_sales?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load day end sales report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchLocationSalesReport = async (params: { from?: string; to?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);

  const res = await api(`/api/report/location_sales?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load location sales report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchTopSellingItemsReport = async (params: { location_id?: string; from?: string; to?: string; limit?: number } = {}) => {
  const qs = new URLSearchParams();
  if (params.location_id) qs.set('location_id', params.location_id);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.limit) qs.set('limit', String(params.limit));

  const res = await api(`/api/report/top_selling_items?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load top selling items report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchCustomerSalesReport = async (params: { from?: string; to?: string; limit?: number } = {}) => {
  const qs = new URLSearchParams();
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);
  if (params.limit) qs.set('limit', String(params.limit));

  const res = await api(`/api/report/customer_sales?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load customer sales report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchTaxReport = async (params: { location_id?: string; from?: string; to?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.location_id) qs.set('location_id', params.location_id);
  if (params.from) qs.set('from', params.from);
  if (params.to) qs.set('to', params.to);

  const res = await api(`/api/report/tax_report?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to load tax report');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchDatabaseAudit = async () => {
  const res = await api('/api/report/database_audit');
  if (!res.ok) throw new Error('Failed to load database audit');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchSchemaDiff = async () => {
  const res = await api('/api/report/schema_diff');
  if (!res.ok) throw new Error('Failed to load schema diff');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const syncSchema = async (tableName?: string) => {
  const url = tableName ? `/api/report/schema_sync?table=${tableName}` : '/api/report/schema_sync';
  const res = await api(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to sync schema');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const createSchemaSnapshot = async (tableName?: string) => {
  const url = tableName ? `/api/report/schema_snapshot?table=${tableName}` : '/api/report/schema_snapshot';
  const res = await api(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create snapshot');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const optimizeDatabase = async () => {
  const res = await api('/api/report/database_optimize', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to optimize database');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const dropDatabaseTable = async (tableName: string) => {
  const res = await api(`/api/report/database_drop?table=${tableName}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to drop table');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

// --- Aliases for Backward Compatibility ---
export const fetchReportStockBalance = fetchStockBalance;
export const fetchReportStockTransfers = fetchStockTransferReport;
export const fetchReportVehicleHistory = fetchVehicleHistory;
export const fetchReportVehicles = fetchVehiclesReport;
export const fetchReportItems = fetchItemsReport;
export const fetchReportLowStock = fetchLowStockReport;
export const fetchReportItemMovements = fetchItemMovements;

export const fetchMaintenanceHistory = fetchVehicleHistory;
export const fetchReportOverview = fetchDashboardDetails;
