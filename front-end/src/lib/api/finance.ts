import { api, ApiSuccess } from './client';

export interface TaxRow {
  id: number;
  name: string;
  code?: string;
  rate?: number;
  rate_percent: number;
  apply_on: 'base' | 'base_plus_previous';
  sort_order: number;
  is_active: 0 | 1;
  created_at?: string;
  updated_at?: string;
}


export const fetchTaxes = async (q: string = '', params: { all?: boolean } = {}) => {
  const qs = new URLSearchParams();
  if (q) qs.append('q', q);
  if (params.all) qs.append('all', '1');
  const res = await api(`/api/tax/list${qs.toString() ? '?' + qs.toString() : ''}`);
  if (!res.ok) throw new Error('Failed to load taxes');
  const data = await res.json();
  return data.status === 'success' ? (data.data as TaxRow[]) : [];
};

export const createTax = async (payload: Partial<TaxRow>) => {
  const res = await api('/api/tax/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create tax');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const updateTax = async (id: string | number, payload: Partial<TaxRow>) => {
  const res = await api(`/api/tax/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update tax');
  return res.json() as Promise<ApiSuccess<null>>;
};

export const deleteTax = async (id: string | number) => {
  const res = await api(`/api/tax/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove tax');
  return res.json() as Promise<ApiSuccess<null>>;
};

// Invoices
export const fetchInvoices = async (filters: { status?: string; customer_id?: string } = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.customer_id) params.append('customer_id', filters.customer_id);
  const res = await api(`/api/invoice/list${params.toString() ? '?' + params.toString() : ''}`);
  if (!res.ok) throw new Error('Failed to load invoices');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

export const fetchInvoiceDetails = async (id: string | number) => {
  const res = await api(`/api/invoice/details/${id}`);
  if (!res.ok) throw new Error('Failed to load invoice details');
  const data = await res.json();
  return data.status === 'success' ? data.data : null;
};

export const createInvoice = async (payload: any) => {
  const res = await api('/api/invoice/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create invoice');
  return res.json();
};

export const addInvoicePayment = async (id: string | number, payload: any) => {
  const res = await api(`/api/invoice/addPayment/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to add payment');
  return res.json();
};

export const addBulkInvoicePayments = async (payload: any) => {
  const res = await api('/api/invoice/addBulkPayment', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to record bulk payments');
  return res.json();
};


export const cancelInvoice = async (id: number, reason: string) => {
  const res = await api(`/api/invoice/cancel/${id}`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to cancel invoice');
  }
  return res.json();
};

// Recurring Invoices
export const fetchRecurringInvoices = async (filters: { status?: string; customer_id?: string } = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.customer_id) params.append('customer_id', filters.customer_id);
  const res = await api(`/api/recurring-invoice/list${params.toString() ? '?' + params.toString() : ''}`);
  if (!res.ok) throw new Error('Failed to load recurring templates');
  const data = await res.json();
  return data.success ? data.data : [];
};

export const fetchRecurringInvoiceDetails = async (id: string | number) => {
  const res = await api(`/api/recurring-invoice/get/${id}`);
  if (!res.ok) throw new Error('Failed to load template details');
  const data = await res.json();
  return data.success ? data.data : null;
};

export const createRecurringInvoice = async (payload: any) => {
  const res = await api('/api/recurring-invoice/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create recurring template');
  return res.json();
};

export const updateRecurringInvoice = async (id: string | number, payload: any) => {
  const res = await api(`/api/recurring-invoice/update/${id}`, { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update recurring template');
  return res.json();
};

export const convertInvoiceToRecurring = async (id: string | number, payload: any) => {
  const res = await api(`/api/invoice/convert_to_recurring/${id}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to convert to recurring');
  }
  return res.json();
};

export const processRecurringInvoices = async () => {
  const res = await api('/api/recurring-invoice/process', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to process recurring invoices');
  return res.json();
};

// Payment Receipts
export const createPaymentReceipt = async (payload: any) => {
  const res = await api('/api/paymentreceipt/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create payment receipt');
  return res.json();
};

export const fetchPaymentReceipts = async (filters: any = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== "" && value !== null) {
      params.append(key, String(value));
    }
  });
  const res = await api(`/api/paymentreceipt/list?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load payment receipts');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

export const fetchPaymentReceiptDetails = async (id: string | number) => {
  const res = await api(`/api/paymentreceipt/details/${id}`);
  if (!res.ok) throw new Error('Failed to load receipt details');
  const data = await res.json();
  return data.status === 'success' ? data.data : null;
};

export const cancelPaymentReceipt = async (id: number, reason: string) => {
  const res = await api(`/api/paymentreceipt/cancel/${id}`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Failed to cancel payment receipt');
  }
  return res.json();
};

export const fetchChequeInventory = async (status?: string) => {
  const params = status ? `?status=${status}` : '';
  const res = await api(`/api/paymentreceipt/cheques${params}`);
  if (!res.ok) throw new Error('Failed to load cheque inventory');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

export const updateChequeStatus = async (chequeId: string | number, status: string, clearedDate?: string) => {
  const res = await api(`/api/paymentreceipt/chequestatus/${chequeId}`, {
    method: 'POST',
    body: JSON.stringify({ status, cleared_date: clearedDate })
  });
  if (!res.ok) throw new Error('Failed to update cheque status');
  return res.json();
};

export const bulkUpdateChequeStatus = async (ids: number[], status: string, clearedDate?: string) => {
  const res = await api(`/api/paymentreceipt/bulkchequestatus`, {
    method: 'POST',
    body: JSON.stringify({ ids, status, cleared_date: clearedDate }),
  });
  if (!res.ok) throw new Error('Failed to update cheques (bulk)');
  return res.json();
};

export const fetchCustomerCheques = async (customerId: string | number) => {
  const res = await api(`/api/paymentreceipt/customercheques/${customerId}`);
  if (!res.ok) throw new Error('Failed to load customer cheques');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};



// Banks
export interface Bank {
  id: number;
  name: string;
  code?: string;
  swift_code?: string;
  is_active: number;
}

export const fetchBanks = async () => {
  const res = await api('/api/bank/list');
  if (!res.ok) throw new Error('Failed to load banks');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

export const fetchBank = async (id: string | number) => {
  const res = await api('/api/bank/details/' + id);
  if (!res.ok) throw new Error('Failed to load bank details');
  const data = await res.json();
  return data.status === 'success' ? data.data : null;
};

export const createBank = async (data: any) => {
  const res = await api('/api/bank/store', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create bank');
  return res.json();
};

export const updateBank = async (id: string | number, data: any) => {
  const res = await api('/api/bank/update/' + id, { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update bank');
  return res.json();
};

export const deleteBank = async (id: string | number) => {
  const res = await api('/api/bank/delete/' + id, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete bank');
  return res.json();
};

export const syncBanksFromInternet = async () => {
  const res = await api('/api/bank/sync', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to sync bank data');
  return res.json();
};

export const fetchBankBranches = async (bankId: string | number, all = false) => {
  const params = all ? '?all=1' : '';
  const res = await api('/api/bankbranch/bank/' + bankId + params);
  if (!res.ok) throw new Error('Failed to load branches');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

export const createBankBranch = async (data: any) => {
  const res = await api('/api/bankbranch/store', { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to create branch');
  return res.json();
};

export const updateBankBranch = async (id: string | number, data: any) => {
  const res = await api('/api/bankbranch/update/' + id, { method: 'POST', body: JSON.stringify(data) });
  if (!res.ok) throw new Error('Failed to update branch');
  return res.json();
};

export const deleteBankBranch = async (id: string | number) => {
  const res = await api('/api/bankbranch/delete/' + id, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete branch');
  return res.json();
};

// Accounting & Journals
export const fetchAccounts = async (params?: any) => {
  const q = new URLSearchParams(params).toString();
  const res = await api(`/api/account/list?${q}`);
  if (!res.ok) throw new Error('Failed to fetch accounts');
  const data = await res.json();
  return data.data;
};

export const createAccount = async (payload: any) => {
  const res = await api('/api/account/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create account');
  return res.json();
};

export const fetchJournalEntries = async (filters: any = {}) => {
  const params = new URLSearchParams(filters);
  const res = await api(`/api/journal/list?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load journal entries');
  return res.json();
};

export const fetchJournalItems = async (entryId: string | number) => {
  const res = await api(`/api/journal/items?id=${entryId}`);
  if (!res.ok) throw new Error('Failed to load journal items');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

export const postJournalEntry = async (payload: any) => {
  const res = await api('/api/journal/post', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to post journal entry');
  return res.json();
};

export const fetchAccountLedger = async (id: string | number, params?: any) => {
  const qs = new URLSearchParams(params).toString();
  const res = await api(`/api/account/ledger/${id}?${qs}`);
  if (!res.ok) throw new Error('Failed to load account ledger');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchAccountingSettings = async () => {
  const res = await api('/api/settings/accounting');
  if (!res.ok) throw new Error('Failed to load accounting settings');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const updateAccountingSettings = async (payload: any) => {
  const res = await api('/api/settings/accounting', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update accounting settings');
  return res.json();
};

export const fetchAccountMappings = async () => {
  const res = await api('/api/account/mappings');
  if (!res.ok) throw new Error('Failed to load account mappings');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const updateAccountMapping = async (payload: any) => {
  const res = await api('/api/account/mappings', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to update account mapping');
  return res.json();
};

// Supplier Finance
export const postSupplierPayment = async (payload: any) => {
  const res = await api('/api/account/post_supplier_payment', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to post supplier payment');
  return res.json();
};

export const postPurchaseReturn = async (payload: any) => {
  const res = await api('/api/account/post_purchase_return', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to post purchase return');
  return res.json();
};

export const fetchSupplierPayments = async (filters: any = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const res = await api(`/api/supplier/payments?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch supplier payments');
  const json = await res.json();
  return json.data;
};

export const fetchSupplierReturns = async (filters: any = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const res = await api(`/api/supplier/returns?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch supplier returns');
  const json = await res.json();
  return json.data;
};

export const fetchSupplierSummary = async (supplierId: number | string) => {
  const res = await api(`/api/supplier/summary/${supplierId}`);
  if (!res.ok) throw new Error('Failed to fetch supplier summary');
  const json = await res.json();
  return json.data;
};

export const fetchSupplierPaymentDetails = async (id: number | string) => {
  const res = await api(`/api/supplier/payment_details/${id}`);
  if (!res.ok) throw new Error('Failed to fetch payment details');
  const json = await res.json();
  return json.data;
};

// Fiscal / Reconciliation
export const fetchFiscalPeriods = async () => {
  const res = await api('/api/fiscal/periods');
  if (!res.ok) throw new Error('Failed to load fiscal periods');
  const data = await res.json();
  return data.data || [];
};

export const createFiscalYear = async (payload: any) => {
  const res = await api('/api/fiscal/create', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to create fiscal year');
  return res.json();
};

export const activateFiscalYear = async (id: number) => {
  const res = await api(`/api/fiscal/activate/${id}`, { method: "POST" });
  if (!res.ok) throw new Error('Failed to activate fiscal year');
  return res.json();
};

export const finalizeReconciliation = async (payload: any) => {
  const res = await api('/api/reconciliation/finalize', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to finalize reconciliation');
  return res.json();
};

export const fetchFiscalSummary = async (id: number) => {
  const res = await api(`/api/fiscal/summary/${id}`);
  if (!res.ok) throw new Error('Failed to load fiscal summary');
  const data = await res.json();
  return data.data || null;
};

export const postFiscalClose = async (payload: any) => {
  const res = await api('/api/fiscal/close', { method: 'POST', body: JSON.stringify(payload) });
  if (!res.ok) throw new Error('Failed to close fiscal year');
  return res.json();
};

export const fetchUnreconciledTransactions = async (accountId: number, asOfDate: string) => {
  const res = await api(`/api/reconciliation/unreconciled?account_id=${accountId}&as_of_date=${asOfDate}`);
  if (!res.ok) throw new Error('Failed to load unreconciled transactions');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

export const fetchReconciliationHistory = async (accountId: number) => {
  const res = await api(`/api/reconciliation/history?account_id=${accountId}`);
  if (!res.ok) throw new Error('Failed to load reconciliation history');
  const data = await res.json();
  return data.status === 'success' ? data.data : data;
};

// Quotations
export const fetchQuotations = async (filters: any = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.append(key, String(value));
    }
  });
  const res = await api(`/api/quotation/list?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to load quotations');
  const data = await res.json();
  return data.status === 'success' ? data.data : [];
};

export const fetchQuotationDetails = async (id: string | number) => {
  const res = await api(`/api/quotation/details/${id}`);
  if (!res.ok) throw new Error('Failed to load quotation details');
  const data = await res.json();
  return data.status === 'success' ? data.data : null;
};

export const createQuotation = async (payload: any) => {
  const res = await api('/api/quotation/create', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to create quotation');
  }
  return res.json();
};

export const updateQuotationStatus = async (id: string | number, status: string) => {
  const res = await api(`/api/quotation/set_status/${id}`, {
    method: 'POST',
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error('Failed to update quotation status');
  return res.json();
};

export const convertQuotationToInvoice = async (id: string | number) => {
  const res = await api(`/api/quotation/convert_to_invoice/${id}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || 'Failed to convert to invoice');
  }
  return res.json();
};
