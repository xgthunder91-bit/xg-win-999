const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const API_BASE_URL: string = String(RAW_BASE).replace(/\/$/, '');

let adminKey = '';
export function setAdminKey(key: string) {
  adminKey = key;
}
export function getAdminKey() {
  return adminKey;
}

function buildUrl(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(
    endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
  );
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

async function handle<T>(res: Response): Promise<T> {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json && json.success === false)) {
    const message = (json && json.message) || `Request failed (${res.status})`;
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return json as T;
}

export async function adminGet<T = any>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const res = await fetch(buildUrl(endpoint, { ...params, key: adminKey }), {
    headers: { Accept: 'application/json', 'x-admin-key': adminKey },
  });
  return handle<T>(res);
}

export async function adminPost<T = any>(endpoint: string, body: Record<string, any> = {}): Promise<T> {
  const res = await fetch(buildUrl(endpoint), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'x-admin-key': adminKey,
    },
    body: JSON.stringify({ ...body, adminKey }),
  });
  return handle<T>(res);
}
