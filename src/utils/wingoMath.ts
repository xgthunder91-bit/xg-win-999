export type WinGoMode = '30s' | '1m' | '3m' | '5m';

export interface WinGoModeConfig {
  duration: number;
  prefix: string;
  baseCounter: number;
}

// Fixed anchor so the SAME period number is derived everywhere (game + backend).
export const WINGO_ANCHOR_MS = 1791849600000; // 2026-10-13T00:00:00.000Z

export const WINGO_MODES: Record<WinGoMode, WinGoModeConfig> = {
  '30s': { duration: 30, prefix: '2026101210005', baseCounter: 322 },
  '1m': { duration: 60, prefix: '2026101210001', baseCounter: 161 },
  '3m': { duration: 180, prefix: '2026101210002', baseCounter: 54 },
  '5m': { duration: 300, prefix: '2026101210003', baseCounter: 33 },
};

export const WINGO_MODE_KEYS: WinGoMode[] = ['30s', '1m', '3m', '5m'];

export function formatPeriodId(mode: WinGoMode, counter: number): string {
  return `${WINGO_MODES[mode].prefix}${String(counter).padStart(4, '0')}`;
}

export interface PeriodInfo {
  counter: number;
  timeLeft: number;
  duration: number;
  period: string;
}

export function periodInfo(mode: WinGoMode, nowMs: number): PeriodInfo {
  const cfg = WINGO_MODES[mode];
  const elapsed = Math.floor(nowMs / 1000) - Math.floor(WINGO_ANCHOR_MS / 1000);
  const idx = Math.floor(elapsed / cfg.duration);
  const counter = cfg.baseCounter + idx;
  const timeLeft = cfg.duration - (elapsed - idx * cfg.duration);
  return { counter, timeLeft, duration: cfg.duration, period: formatPeriodId(mode, counter) };
}

// cyrb53: a strong, well-distributed 53-bit string hash. Chosen over FNV-1a
// because FNV's low bits barely change for near-identical inputs, so
// sequential period ids produced visibly correlated digits. cyrb53 avalanches
// fully, so consecutive periods look completely unrelated.
function cyrb53(str: string, seed: number): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// Stable digit 0..9 for any period id. Same output on client & server.
// The seed is fixed, so the series is reproducible but pattern-free: each
// digit is effectively independent (uniform, ~10% each) and no run of
// history lets you predict the next one.
export function deterministicDigit(periodId: string): number {
  return cyrb53(periodId, 0x9e3779b1) % 10;
}

export type WinGoColor = 'green' | 'red' | 'violet';

export interface WinGoResult {
  period: string;
  number: number;
  bigSmall: 'Big' | 'Small';
  colors: WinGoColor[];
}

export function outcomeForNumber(period: string, num: number): WinGoResult {
  const bigSmall: 'Big' | 'Small' = num >= 5 ? 'Big' : 'Small';
  const colors: WinGoColor[] =
    num === 0
      ? ['red', 'violet']
      : num === 5
        ? ['green', 'violet']
        : [1, 3, 7, 9].includes(num)
          ? ['green']
          : ['red'];
  return { period, number: num, bigSmall, colors };
}
