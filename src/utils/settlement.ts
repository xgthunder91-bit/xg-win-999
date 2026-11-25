/**
 * Game result + payout rules.
 *
 * WinGo uses the published fixed-odds table (not a shared pot):
 *
 *   Stake ₹100 -> 2% service fee -> contract amount ₹98
 *   Number exact match ......... 98 x 9   = ₹882
 *   Big / Small ................ 98 x 2   = ₹196
 *   Green (1,3,7,9) ............ 98 x 2   = ₹196
 *   Green (5) .................. 98 x 1.5 = ₹147
 *   Red (2,4,6,8) .............. 98 x 2   = ₹196
 *   Red (0) .................... 98 x 1.5 = ₹147
 *   Violet (0 or 5) ............ 98 x 4.5 = ₹441
 *
 * The 2% fee is already included in the payout, so a player's balance is only
 * debited once when the bet is placed. The server is the only place that
 * settles a bet.
 */

import { toPaisa } from './potMath';

export const WINGO_SERVICE_FEE_PCT = 2;

/** Multipliers in basis points (10000 = 1x) so payouts stay integer-exact. */
const BPS = {
  number: 90000, // 9x
  bigSmall: 20000, // 2x
  normalColor: 20000, // 2x
  specialColor: 15000, // 1.5x on 0/5
  violet: 45000, // 4.5x
  any: 10000, // 1x (not offered in the UI, kept for old bets)
} as const;

/** Colours shown for a WinGo digit. 0 is red+violet, 5 is green+violet. */
export function colorsForDigit(n: number): ('green' | 'red' | 'violet')[] {
  if (n === 0) return ['red', 'violet'];
  if (n === 5) return ['green', 'violet'];
  return [1, 3, 7, 9].includes(n) ? ['green'] : ['red'];
}

/** First colour for a digit — kept for older callers. */
export function colorForDigit(n: number): 'green' | 'red' | 'violet' {
  return colorsForDigit(n)[0];
}

/** Big/small for a digit (0-4 small, 5-9 big). */
export function bigSmallForDigit(n: number): 'big' | 'small' {
  return n >= 5 ? 'big' : 'small';
}

function norm(s: string) {
  return String(s || '').trim().toLowerCase();
}

/**
 * Does a bet selection win?
 *
 * Recognised selections:
 *   number  : "0".."9"
 *   colour  : "green" | "red" | "violet"
 *   size    : "big" | "small"
 *   any     : "*" / "any"  (wins on every digit)
 *   aviator : "2.50x" / ">=2.50" (crash at or above the multiplier)
 */
export function selectionWins(
  selection: string,
  game: string,
  resultNumber: number | null,
  resultMultiplier: number | null
): boolean {
  const sel = norm(selection);
  if (!sel) return false;

  if (game === 'aviator') {
    if (resultMultiplier == null) return false;
    const m = sel.match(/(\d+(?:\.\d+)?)/);
    if (!m) return false;
    const target = Number(m[1]);
    if (sel.includes('>=') || sel.includes('over')) return resultMultiplier >= target;
    // exact crash point (e.g. "2.50x")
    return Math.abs(resultMultiplier - target) < 0.0001;
  }

  if (resultNumber == null) return false;
  if (sel === '*' || sel === 'any') return true;
  if (/^\d$/.test(sel)) return Number(sel) === resultNumber;
  if (sel === 'green' || sel === 'red' || sel === 'violet') {
    return colorsForDigit(resultNumber).includes(sel);
  }
  if (sel === 'big' || sel === 'small') {
    return bigSmallForDigit(resultNumber) === sel;
  }
  return false;
}

/**
 * Fixed payout multiplier (in basis points) for a WinGo selection.
 * Returns 0 when the selection loses.
 */
export function wingoMultiplierBps(selection: string, resultNumber: number): number {
  const sel = norm(selection);
  if (!Number.isInteger(resultNumber) || resultNumber < 0 || resultNumber > 9) return 0;

  if (/^\d$/.test(sel)) return Number(sel) === resultNumber ? BPS.number : 0;
  if (sel === 'big' || sel === 'small') {
    return bigSmallForDigit(resultNumber) === sel ? BPS.bigSmall : 0;
  }
  if (sel === 'violet') {
    return resultNumber === 0 || resultNumber === 5 ? BPS.violet : 0;
  }
  if (sel === 'green') {
    if (resultNumber === 5) return BPS.specialColor;
    return [1, 3, 7, 9].includes(resultNumber) ? BPS.normalColor : 0;
  }
  if (sel === 'red') {
    if (resultNumber === 0) return BPS.specialColor;
    return [2, 4, 6, 8].includes(resultNumber) ? BPS.normalColor : 0;
  }
  if (sel === '*' || sel === 'any') return BPS.any;
  return 0;
}

/** Payout in paisa for one WinGo bet, after the 2% service fee. */
export function wingoPayoutPaisa(
  amountPaisa: number,
  selection: string,
  resultNumber: number,
  serviceFeePct: number = WINGO_SERVICE_FEE_PCT
): number {
  const bps = wingoMultiplierBps(selection, resultNumber);
  if (bps <= 0) return 0;
  const fee = Math.min(100, Math.max(0, Number(serviceFeePct) || 0));
  const contractPaisa = Math.round((Math.max(0, amountPaisa) * (100 - fee)) / 100);
  return Math.round((contractPaisa * bps) / 10000);
}

/**
 * Possible payout multipliers (on the 98% contract amount) for the bet sheet.
 * Green/red can pay 1.5x or 2x depending on whether the result is 0/5.
 */
export function wingoPayoutMultiplierRange(selection: string): [number, number] {
  const sel = norm(selection);
  if (/^\d$/.test(sel)) return [9, 9];
  if (sel === 'big' || sel === 'small') return [2, 2];
  if (sel === 'violet') return [4.5, 4.5];
  if (sel === 'green' || sel === 'red') return [1.5, 2];
  return [1, 1];
}

/** Rupee payout range shown before a WinGo bet is placed. */
export function wingoPayoutRange(
  amountRupees: number,
  selection: string,
  serviceFeePct: number = WINGO_SERVICE_FEE_PCT
): { min: number; max: number } {
  const fee = Math.min(100, Math.max(0, Number(serviceFeePct) || 0));
  const contract = (Math.max(0, Number(amountRupees) || 0) * (100 - fee)) / 100;
  const [minMult, maxMult] = wingoPayoutMultiplierRange(selection);
  return {
    min: +Math.round(contract * minMult * 100) / 100,
    max: +Math.round(contract * maxMult * 100) / 100,
  };
}

/** Every distinct winning selection label for a result — used for the UI. */
export function winningLabels(resultNumber: number | null, resultMultiplier: number | null) {
  if (resultNumber == null) return [];
  return [String(resultNumber), ...colorsForDigit(resultNumber), bigSmallForDigit(resultNumber)];
}

/** Convert a rupee amount to the integer paisa used by the payout engine. */
export function payoutPaisaForRupees(amountRupees: number): number {
  return toPaisa(amountRupees);
}
