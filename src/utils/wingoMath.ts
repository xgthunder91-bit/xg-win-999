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

// FNV-1a hash -> stable digit 0..9 for any period id. Same output on client & server.
export function deterministicDigit(periodId: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < periodId.length; i++) {
    h ^= periodId.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h % 10;
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
