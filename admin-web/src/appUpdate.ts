export const APP_VERSION = '1.0.0';

export interface UpdateInfo {
  version: string;
  sizeMB?: number;
  apkUrl?: string;
  notes?: string;
}

export async function fetchUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<UpdateInfo>;
    if (data && data.version && String(data.version) !== APP_VERSION) {
      return {
        version: String(data.version),
        sizeMB: typeof data.sizeMB === 'number' ? data.sizeMB : undefined,
        apkUrl: data.apkUrl || undefined,
        notes: data.notes || undefined,
      };
    }
  } catch {
    /* offline / blocked */
  }
  return null;
}
