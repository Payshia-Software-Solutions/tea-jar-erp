import { api } from "./index";

export interface CustomerNoteRow {
  id: number;
  note_no: string;
  type: "Credit Note" | "Debit Note";
  customer_id: number;
  customer_name?: string;
  customer_phone?: string;
  location_id: number;
  date: string;
  amount: number;
  reason: string;
  created_at: string;
}

export const fetchCustomerNotes = async (params: { customer_id?: string; from?: string; to?: string } = {}) => {
  const qs = new URLSearchParams();
  if (params.customer_id) qs.set("customer_id", params.customer_id);
  if (params.from) qs.set("from", params.from);
  if (params.to) qs.set("to", params.to);

  const res = await api(`/api/customer-note?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to load customer notes");
  const data = await res.json();
  return data.status === "success" ? (data.data as CustomerNoteRow[]) : [];
};

export const createCustomerNote = async (payload: {
  type: "Credit Note" | "Debit Note";
  customer_id: number;
  date: string;
  amount: number;
  reason: string;
  location_id?: number;
}) => {
  const res = await api(`/api/customer-note/store`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Failed to create customer note");
  const data = await res.json();
  if (data.status !== "success") throw new Error(data.message || "Error creating note");
  return data.data;
};
