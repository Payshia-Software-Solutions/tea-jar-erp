import { api, type ApiSuccess } from "./client";

export interface ReviewImage {
  id: number;
  review_id: number;
  image_path: string;
}

export interface ProductReview {
  id: number;
  part_id: number;
  customer_id: number;
  rating: number;
  comment: string;
  admin_reply?: string;
  replied_at?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  updated_at: string;
  product_name?: string;
  part_number?: string;
  customer_name?: string;
  images?: ReviewImage[];
}

export async function fetchReviews(status?: string): Promise<ProductReview[]> {
  const qs = status ? `?status=${status}` : '';
  const res = await api(`/api/reviews/index${qs}`);
  if (!res.ok) throw new Error(`Failed to load reviews: ${res.statusText}`);
  const json: ApiSuccess<ProductReview[]> = await res.json();
  return json.status === 'success' ? json.data : [];
}

export async function approveReview(id: number): Promise<void> {
  const res = await api(`/api/reviews/approve/${id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to approve review');
}

export async function rejectReview(id: number): Promise<void> {
  const res = await api(`/api/reviews/reject/${id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reject review');
}

export async function deleteReview(id: number): Promise<void> {
  const res = await api(`/api/reviews/delete/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete review');
}

export async function submitReview(formData: FormData): Promise<{ id: number }> {
  const res = await api('/api/reviews/submit', {
    method: 'POST',
    body: formData // Use FormData for file uploads
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to submit review' }));
    throw new Error(error.message || 'Failed to submit review');
  }
  const json: ApiSuccess<{ id: number }> = await res.json();
  return json.data;
}

export async function fetchProductReviews(partId: number, all = false): Promise<ProductReview[]> {
  const qs = all ? '?all=1' : '';
  const res = await api(`/api/reviews/product/${partId}${qs}`);
  if (!res.ok) throw new Error('Failed to load product reviews');
  const json: ApiSuccess<ProductReview[]> = await res.json();
  return json.status === 'success' ? json.data : [];
}

export async function replyToReview(id: number, reply: string): Promise<void> {
  const res = await api(`/api/reviews/reply/${id}`, {
    method: 'POST',
    body: JSON.stringify({ reply }),
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to save reply');
}
