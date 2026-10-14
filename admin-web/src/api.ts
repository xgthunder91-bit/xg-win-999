const RAW_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const API_BASE_URL: string = String(RAW_BASE).replace(/\/$/, '');

const TOKEN_KEY = 'xgwin99_admin_token';
const USER_KEY = 'xgwin99_admin_user';

let adminToken = '';

export function setAdminToken(token: string, username?: string) {
  adminToken = token || '';
  try {
    if (adminToken) {
      localStorage.setItem(TOKEN_KEY, adminToken);
      if (username) localStorage.setItem(USER_KEY, username);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function getAdminToken() {
  return adminToken;
}

export function getAdminUser() {
  try {
    return localStorage.getItem(USER_KEY) || '';
  } catch {
    return '';
  }
}

export function restoreAdminToken() {
  try {
    adminToken = localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    adminToken = '';
  }
  return adminToken;
}

export function clearAdminToken() {
  setAdminToken('');
}

function buildUrl(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(
    endpoint.startsWith('http')
      ? endpoint
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
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

export async function adminLogin<T = any>(username: string, password: string): Promise<T> {
  const res = await fetch(buildUrl('/admin/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const json = await handle<T>(res);
  const data = (json as any)?.data;
  if (data && data.token) setAdminToken(data.token, data.username || username);
  return json;
}

export async function adminLogout(): Promise<void> {
  try {
    await fetch(buildUrl('/admin/logout'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-key': adminToken },
      body: JSON.stringify({ adminKey: adminToken }),
    });
  } catch {
    // ignore
  }
  clearAdminToken();
}

function authHeaders(): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json' };
  if (adminToken) h['x-admin-key'] = adminToken;
  return h;
}

export async function adminGet<T = any>(
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const res = await fetch(buildUrl(endpoint, params), { headers: authHeaders() });
  return handle<T>(res);
}

export async function adminPost<T = any>(endpoint: string, body: Record<string, any> = {}): Promise<T> {
  const res = await fetch(buildUrl(endpoint), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}