/**
 * Core API fetch wrapper
 */
export const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

export const api = async (path: string, options: RequestInit = {}): Promise<Response> => {
  const baseUrl = BASE_URL;
  const token =
    typeof window !== 'undefined' ? window.localStorage.getItem('auth_token') : null;
  const locationId =
    typeof window !== 'undefined' ? window.localStorage.getItem('location_id') : null;
  const defaults: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(locationId ? { 'X-Location-Id': String(locationId) } : {}),
    },
    credentials: 'omit',
  };
  // Merge headers safely (caller can override).
  const merged: RequestInit = {
    ...defaults,
    ...options,
    headers: {
      ...(defaults.headers as Record<string, string>),
      ...((options.headers as Record<string, string>) ?? {}),
    },
  };

  // If body is FormData, remove Content-Type to let browser set it with boundary
  if (options.body instanceof FormData) {
    const headers = merged.headers as Record<string, string>;
    delete headers['Content-Type'];
  }
  const response = await fetch(`${baseUrl}${path}`, merged);
  // Global 401 interceptor - token expired or invalid, force logout immediately.
  if (response.status === 401 && typeof window !== 'undefined') {
    window.localStorage.removeItem('auth_token');
    window.localStorage.removeItem('location_id');
    window.location.href = '/login';
  }
  return response;
};

export interface SystemCheckItem {
  name: string;
  available: boolean;
  message: string;
}

export interface SystemCheckResponse {
  status: 'success' | 'error';
  message: string;
  checks: SystemCheckItem[];
  missingTables: string[];
}

export interface ApiSuccess<T> {
  status: 'success';
  message: string;
  data: T;
}
