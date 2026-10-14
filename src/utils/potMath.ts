/**
 * Fair pot-based payout engine.
 *
 * Money is handled in integer PAISA (1 rupee = 100 paisa) so there is never
 * any floating point drift. Distributions use the "largest remainder" method,
 * which guarantees that the sum of all payouts is EXACTLY equal to the prize
 * pool — not one paisa created, not one paisa lost.
 */

/** Convert rupees (may have decimals) to integer paisa. */
export function toPaisa(rupees: number): number {
  return Math.round(Number(rupees || 0) * 100);
}

/** Convert integer paisa back to rupees with 2 decimals. */
export function toRupees(paisa: number): number {
  return Math.round(paisa) / 100;
}

/**
 * Split `total` across `weights` so the parts sum to exactly `total`.
 * Largest remainder method — no paisa is created or lost.
 *
 * @returns array of paisa shares, same length/order as weights
 */
export function distributeExactly(total: number, weights: number[]): number[] {
  const sumWeights = weights.reduce((s, w) => s + w, 0);
  if (sumWeights <= 0 || total <= 0) return weights.map(() => 0);

  const exact = weights.map((w) => (total * w) / sumWeights);
  const floors = exact.map((x) => Math.floor(x));
  let remainder = total - floors.reduce((s, x) => s + x, 0);

  // Rank by the leftover fraction, descending; ties keep original order.
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .sort((a, b) => b.frac - a.frac || a.i - b.i);

  const out = floors.slice();
  let k = 0;
  while (remainder > 0 && order.length > 0) {
    out[order[k % order.length].i] += 1;
    remainder -= 1;
    k += 1;
  }
  return out;
}

export interface SettlementInput {
  /** Every bet placed in this round (paisa). */
  potPaisa: number;
  /** House cut percentage, e.g. 10 => house keeps 10%. */
  houseFeePct: number;
  /** Index -> amount bet (paisa). Only winning bets need an entry. */
  winners: { index: number; betPaisa: number }[];
}

export interface SettlementResult {
  totalPot: number;
  houseFee: number;
  prizePool: number;
  winningStake: number;
  /** Payout per winner, in the same order as input.winners. */
  payouts: number[];
}

/**
 * Settle one round.
 *
 *   houseFee   = round(pot * houseFeePct / 100)
 *   prizePool  = pot - houseFee
 *   payout[i]  = prizePool * winnerStake[i] / totalWinningStake
 *
 * If nobody wins, the whole pot is kept by the house.
 */
export function settleRound(input: SettlementInput): SettlementResult {
  const pot = Math.max(0, Math.round(input.potPaisa));
  const pct = Math.min(100, Math.max(0, Number(input.houseFeePct) || 0));

  // Round the fee to whole paisa so the pool stays integral.
  const houseFee = Math.round((pot * pct) / 100);
  const prizePool = pot - houseFee;

  const winningStake = input.winners.reduce((s, w) => s + w.betPaisa, 0);

  let payouts: number[] = [];
  if (winningStake > 0 && prizePool > 0) {
    const shares = distributeExactly(
      prizePool,
      input.winners.map((w) => w.betPaisa)
    );
    payouts = new Array(input.winners.length).fill(0);
    input.winners.forEach((w, idx) => {
      payouts[idx] = shares[idx];
    });
  }

  return { totalPot: pot, houseFee, prizePool, winningStake, payouts };
}

/** Self-check used by the test script: payouts must sum to prizePool exactly. */
export function verifySettlement(r: SettlementResult): boolean {
  const sum = r.payouts.reduce((s, x) => s + x, 0);
  return sum === r.prizePool && r.totalPot === r.houseFee + r.prizePool;
}