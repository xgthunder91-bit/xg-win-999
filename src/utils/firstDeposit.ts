/**
 * Extra first-deposit bonus.
 *
 * The numbers here are the single source of truth for the game screen, the
 * deposit page and the server payout. They must never drift apart: the page
 * promises a bonus and the server must credit exactly that amount when the
 * player's very first deposit is approved.
 *
 * A tier applies to every amount at or above its `min`, so a ₹400 deposit gets
 * the ₹200 tier (+₹29) and a ₹20,000 deposit gets the ₹10,000 tier (+₹599).
 */
export interface FirstDepositTier {
  /** Smallest deposit that qualifies for this tier, in rupees. */
  min: number;
  /** Extra rupees credited on top of the deposit. */
  bonus: number;
}

/** Minimum first deposit that qualifies for any bonus at all. */
export const FIRST_DEPOSIT_MIN = 100;

/** Highest tier first so a simple `.find()` returns the best match. */
export const FIRST_DEPOSIT_TIERS: FirstDepositTier[] = [
  { min: 50000, bonus: 2999 },
  { min: 10000, bonus: 599 },
  { min: 3000, bonus: 229 },
  { min: 1000, bonus: 109 },
  { min: 500, bonus: 59 },
  { min: 200, bonus: 29 },
  { min: 100, bonus: 15 },
];

/** Biggest bonus on offer (shown in banners). */
export const FIRST_DEPOSIT_MAX_BONUS = Math.max(...FIRST_DEPOSIT_TIERS.map((t) => t.bonus));

/**
 * Bonus for a first deposit of `amount` rupees.
 * Returns 0 below the minimum so callers can treat it as "no bonus".
 */
export function firstDepositBonusFor(amount: number): number {
  const value = Number(amount);
  if (!Number.isFinite(value) || value < FIRST_DEPOSIT_MIN) return 0;
  const tier = FIRST_DEPOSIT_TIERS.find((t) => value >= t.min);
  return tier ? tier.bonus : 0;
}

/** Tiers from cheapest to biggest, for rendering a ladder in the UI. */
export function firstDepositLadder(): FirstDepositTier[] {
  return FIRST_DEPOSIT_TIERS.slice().sort((a, b) => a.min - b.min);
}
