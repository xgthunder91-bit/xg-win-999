/**
 * Which selections win a given round result.
 *
 * A round has a single result value (a number 0-9 for WinGo / Chicken Road,
 * or a crash multiplier for Aviator). Each bet carries a "selection" string
 * that the frontend always formats the same way, so matching stays simple.
 */

/** WinGo colour for a digit — matches the published payout table. */
export function colorForDigit(n: number): 'green' | 'red' | 'violet' {
  if (n === 0) return 'violet';
  if (n === 5) return 'green';
  return [1, 3, 7, 9].includes(n) ? 'green' : 'red';
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
    return colorForDigit(resultNumber) === sel;
  }
  if (sel === 'big' || sel === 'small') {
    return bigSmallForDigit(resultNumber) === sel;
  }
  return false;
}

/** Every distinct winning selection label for a result — used for the UI. */
export function winningLabels(resultNumber: number | null, resultMultiplier: number | null) {
  if (resultNumber == null) return [];
  return [
    String(resultNumber),
    colorForDigit(resultNumber),
    bigSmallForDigit(resultNumber),
  ];
}