export function money(n: number | undefined | null): string {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function num(n: number | undefined | null): string {
  return (Number(n) || 0).toLocaleString('en-IN');
}

export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (!then) return '-';
  const secs = Math.floor((Date.now() - then) / 1000);
  if (secs < 5) return 'just now';
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function dateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const SCREEN_LABEL: Record<string, string> = {
  home: 'Home',
  wingo: 'WinGo',
  aviator: 'Aviator',
  chicken: 'Chicken Road',
  deposit: 'Deposit',
  withdraw: 'Withdraw',
  depositWheel: 'Lucky Wheel',
  profile: 'Profile',
  promo: 'Promotions',
  earn: 'Earn',
  shareTab: 'Share',
  coupons: 'Coupons',
  notifications: 'Notifications',
};

export function screenLabel(s?: string): string {
  if (!s) return 'Unknown';
  return SCREEN_LABEL[s] || s;
}

export function gameLabel(game?: string | null, mode?: string | null): string {
  const g = (game || '').toLowerCase();
  if (g === 'wingo') return `WinGo ${mode || ''}`.trim();
  if (g === 'aviator') return 'Aviator';
  if (g === 'chicken') return 'Chicken Road';
  return game || 'Unknown';
}

export const WINGO_MODE_OPTIONS = ['30s', '1m', '3m', '5m'] as const;

export const GAME_OPTIONS: { key: string; label: string }[] = [
  { key: 'wingo:30s', label: 'WinGo 30s' },
  { key: 'wingo:1m', label: 'WinGo 1m' },
  { key: 'wingo:3m', label: 'WinGo 3m' },
  { key: 'wingo:5m', label: 'WinGo 5m' },
  { key: 'aviator', label: 'Aviator' },
];

// Colour of a number 0-9 for WinGo (green/red/violet)
export function digitClass(n: number): string {
  if (n === 0) return 'from-[#fb5b5b] to-[#b858ff]';
  if (n === 5) return 'from-[#18b660] to-[#b858ff]';
  if ([1, 3, 7, 9].includes(n)) return 'from-[#18b660] to-[#0f8f49]';
  return 'from-[#fb5b5b] to-[#d63a3a]';
}
