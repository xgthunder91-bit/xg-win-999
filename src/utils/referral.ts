/**
 * Invite & earn (referral) rules.
 *
 * One table drives the game screen, the invite poster and the server payout, so
 * the reward a player sees is exactly the reward that gets credited.
 *
 * Every account gets its own unique invite code. When a new player registers
 * with that code, the inviter's invite count grows and each treasure-chest
 * milestone that is crossed pays out once, automatically.
 */
export interface ReferralTier {
  /** Number of registered friends needed for this chest. */
  count: number;
  /** Rupees paid to the inviter when this chest unlocks. */
  reward: number;
}

/** Milestones taken from the "Referral Activity Treasure Chests" grid. */
export const REFERRAL_TIERS: ReferralTier[] = [
  { count: 1, reward: 55 },
  { count: 3, reward: 155 },
  { count: 10, reward: 555 },
  { count: 30, reward: 1777 },
  { count: 50, reward: 2777 },
  { count: 100, reward: 5777 },
];

/** Total rupees a player earns for `count` registered friends. */
export function referralEarnedAt(count: number): number {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  return REFERRAL_TIERS.reduce((sum, t) => (n >= t.count ? sum + t.reward : sum), 0);
}

/**
 * Reward unlocked when the invite count grows from `prevCount` to `nextCount`.
 * Returns 0 when no milestone is crossed, so the server only credits real money.
 */
export function referralRewardBetween(
  prevCount: number,
  nextCount: number
): { reward: number; tiers: number[] } {
  const prev = Math.max(0, Math.floor(Number(prevCount) || 0));
  const next = Math.max(0, Math.floor(Number(nextCount) || 0));
  let reward = 0;
  const tiers: number[] = [];
  for (const t of REFERRAL_TIERS) {
    if (t.count > prev && t.count <= next) {
      reward += t.reward;
      tiers.push(t.count);
    }
  }
  return { reward, tiers };
}

/** Highest possible referral payout, used in banners. */
export const REFERRAL_MAX_REWARD = REFERRAL_TIERS.reduce((s, t) => s + t.reward, 0);

/** A code the server may accept: 4-12 letters/digits, no confusing characters needed. */
export const REFERRAL_CODE_RE = /^[A-Z0-9]{4,12}$/;

/** Normalises whatever the player typed or the URL carried. */
export function normaliseReferralCode(raw: string | null | undefined): string {
  return String(raw || '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 12)
    .toUpperCase();
}

/**
 * The link a player shares. Opening it lands on the register screen with the
 * code already filled in (`AuthView` reads `?invite_code=`).
 */
export function buildInviteLink(code: string): string {
  const clean = normaliseReferralCode(code);
  const origin =
    typeof window !== 'undefined' && window.location && window.location.origin
      ? window.location.origin
      : 'https://xgwin99.vercel.app';
  return clean
    ? `${origin}/register?invite_code=${encodeURIComponent(clean)}`
    : `${origin}/register`;
}

/** Message that goes out with the link on WhatsApp / Telegram / SMS. */
export function buildInviteMessage(code: string): string {
  const clean = normaliseReferralCode(code);
  return `Join XG Win 99 and get ₹10 free on signup! Use my invite code ${clean} — tap the link to register directly: ${buildInviteLink(clean)}`;
}
