const DEFAULT_API_BASE =
  (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const API_BASE_URL: string = DEFAULT_API_BASE;

function buildUrl(endpoint: string): string {
  if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    return endpoint;
  }
  const base = API_BASE_URL.replace(/\/$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
}

export async function apiPost<T = any>(endpoint: string, data?: any): Promise<T> {
  const res = await fetch(buildUrl(endpoint), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(data || {}),
  });

  const json = await res.json().catch(() => ({}));
  return json as T;
}

export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const res = await fetch(buildUrl(endpoint), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  const json = await res.json().catch(() => ({}));
  return json as T;
}
