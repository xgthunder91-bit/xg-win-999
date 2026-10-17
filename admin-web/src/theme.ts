export interface Theme {
  id: string;
  name: string;
  c1: string;
  c2: string;
  c3: string;
}

export const DEFAULT_THEME: Theme = {
  id: 'cyber',
  name: 'Neon Cyber',
  c1: '#22f0ff',
  c2: '#8b5cff',
  c3: '#ff2bd6',
};

export const THEMES: Theme[] = [
  { id: 'cyber', name: 'Neon Cyber', c1: '#22f0ff', c2: '#8b5cff', c3: '#ff2bd6' },
  { id: 'gold', name: 'Gold VIP', c1: '#ffe08a', c2: '#f0a92e', c3: '#a9740f' },
  { id: 'royal', name: 'Royal Purple', c1: '#b388ff', c2: '#7c3aed', c3: '#e040fb' },
  { id: 'emerald', name: 'Emerald', c1: '#34d399', c2: '#10b981', c3: '#0ea5e9' },
  { id: 'sunset', name: 'Sunset Blaze', c1: '#ffb347', c2: '#ff7a18', c3: '#ff2d55' },
  { id: 'rosegold', name: 'Rose Gold', c1: '#ffc4d6', c2: '#ff8fab', c3: '#e11d48' },
  { id: 'ocean', name: 'Ocean', c1: '#67e8f9', c2: '#22d3ee', c3: '#2563eb' },
  { id: 'lime', name: 'Lime Volt', c1: '#d9f99d', c2: '#a3e635', c3: '#16a34a' },
  { id: 'crimson', name: 'Crimson', c1: '#ff8fa3', c2: '#ef4444', c3: '#b91c1c' },
  { id: 'ice', name: 'Ice Blue', c1: '#bfdbfe', c2: '#60a5fa', c3: '#818cf8' },
  { id: 'amber', name: 'Amber Heat', c1: '#ffe08a', c2: '#ffbe3d', c3: '#ff7a18' },
  { id: 'magenta', name: 'Magenta Pop', c1: '#ff7ae0', c2: '#d946ef', c3: '#8b5cf6' },
  { id: 'teal', name: 'Teal Mint', c1: '#5eead4', c2: '#2dd4bf', c3: '#0ea5e9' },
  { id: 'cosmic', name: 'Cosmic', c1: '#a78bfa', c2: '#6366f1', c3: '#ec4899' },
  { id: 'forest', name: 'Forest', c1: '#86efac', c2: '#22c55e', c3: '#15803d' },
  { id: 'candy', name: 'Candy', c1: '#fda4af', c2: '#f472b6', c3: '#a855f7' },
  { id: 'volcano', name: 'Volcano', c1: '#fca5a5', c2: '#f97316', c3: '#7c2d12' },
  { id: 'midnight', name: 'Midnight', c1: '#7dd3fc', c2: '#3b82f6', c3: '#1e1b4b' },
];

const KEY = 'xg-admin-theme';

export function applyTheme(t: Pick<Theme, 'c1' | 'c2' | 'c3'>) {
  const root = document.documentElement;
  root.style.setProperty('--b1', t.c1);
  root.style.setProperty('--b2', t.c2);
  root.style.setProperty('--b3', t.c3);
}

export function saveTheme(t: Theme) {
  try {
    localStorage.setItem(KEY, JSON.stringify(t));
  } catch {
    /* ignore */
  }
}

export function loadTheme(): Theme {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const t = JSON.parse(raw) as Theme;
      if (t && t.c1 && t.c2 && t.c3) return t;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function initTheme() {
  applyTheme(loadTheme());
}
