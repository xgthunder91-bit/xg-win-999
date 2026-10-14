/**
 * Exhaustively verifies the payout engine:
 *  - payouts always sum to exactly the prize pool (no paisa created or lost)
 *  - pot always equals houseFee + prizePool
 *  - weights of zero get nothing
 */
import { settleRound, distributeExactly, toPaisa, verifySettlement } from '../src/utils/potMath.ts';

let failures = 0;
function check(cond: boolean, msg: string) {
  if (!cond) {
    failures += 1;
    console.log('  FAIL:', msg);
  }
}

console.log('--- distributeExactly basics ---');
{
  const parts = distributeExactly(100, [1, 1, 1]);
  const sum = parts.reduce((s, x) => s + x, 0);
  check(sum === 100, `3-way split of 100 should total 100, got ${sum}`);
  console.log('  split 100 into 3 equal parts ->', parts, 'sum =', sum);

  const uneven = distributeExactly(10000, [1, 1, 9998]);
  console.log('  split 10000 by [1,1,9998]      ->', uneven, 'sum =', uneven.reduce((s, x) => s + x, 0));
  check(uneven.reduce((s, x) => s + x, 0) === 10000, 'uneven split must total exactly');
}

console.log('');
console.log('--- user scenario: 10 people bet, 2 win ---');
{
  // 8 losers + 2 winners; winner stakes 3000 and 2000 paisa (Rs30 + Rs20)
  const losers = [1000, 1000, 1000, 1000, 1000, 1000, 1000, 1000]; // 8 x Rs10
  const winners = [3000, 2000]; // Rs30 and Rs20
  const pot = losers.concat(winners).reduce((s, x) => s + x, 0);
  const r = settleRound({
    potPaisa: pot,
    houseFeePct: 10,
    winners: winners.map((betPaisa, index) => ({ index, betPaisa })),
  });
  console.log(`  total pot      : Rs ${(pot / 100).toFixed(2)}`);
  console.log(`  house fee (10%): Rs ${(r.houseFee / 100).toFixed(2)}`);
  console.log(`  prize pool     : Rs ${(r.prizePool / 100).toFixed(2)}`);
  console.log(`  winner 1 (Rs30): Rs ${(r.payouts[0] / 100).toFixed(2)}`);
  console.log(`  winner 2 (Rs20): Rs ${(r.payouts[1] / 100).toFixed(2)}`);
  const paid = r.payouts.reduce((s, x) => s + x, 0);
  console.log(`  total paid     : Rs ${(paid / 100).toFixed(2)}`);
  check(paid === r.prizePool, 'winners must receive exactly the prize pool');
  check(verifySettlement(r), 'settlement identity must hold');
}

console.log('');
console.log('--- randomised fuzz: 5000 rounds ---');
{
  let bad = 0;
  for (let i = 0; i < 5000; i++) {
    const winnerCount = 1 + Math.floor(Math.random() * 12);
    const winners = Array.from({ length: winnerCount }, () => 100 + Math.floor(Math.random() * 9900));
    const losersCount = Math.floor(Math.random() * 25);
    const losers = Array.from({ length: losersCount }, () => 100 + Math.floor(Math.random() * 9900));
    const pot = winners.concat(losers).reduce((s, x) => s + x, 0);
    const pct = Math.floor(Math.random() * 31); // 0..30%
    const r = settleRound({
      potPaisa: pot,
      houseFeePct: pct,
      winners: winners.map((betPaisa, index) => ({ index, betPaisa })),
    });
    if (!verifySettlement(r)) bad += 1;
  }
  console.log(`  rounds checked : 5000`);
  console.log(`  mismatches     : ${bad}`);
  check(bad === 0, 'no round may break the payout identity');
}

console.log('');
console.log('--- edge cases ---');
{
  const noWinners = settleRound({ potPaisa: 50000, houseFeePct: 10, winners: [] });
  check(noWinners.prizePool === 45000, 'no winners -> full prize pool stays with house');
  console.log('  no winners  -> house keeps Rs', (noWinners.prizePool / 100).toFixed(2));

  const tiny = settleRound({
    potPaisa: 100,
    houseFeePct: 10,
    winners: [{ index: 0, betPaisa: 50 }],
  });
  check(tiny.payouts[0] === 90, 'tiny round must still pay out exactly');
  console.log('  tiny round   -> payout', tiny.payouts[0], 'paisa (expected 90)');

  const zeroWeight = settleRound({
    potPaisa: 10000,
    houseFeePct: 0,
    winners: [
      { index: 0, betPaisa: 1000 },
      { index: 1, betPaisa: 0 },
    ],
  });
  check(zeroWeight.payouts[1] === 0, 'zero-stake winner must receive nothing');
  console.log('  zero stake   -> payouts', zeroWeight.payouts);

  const round = toPaisa(29.99);
  check(round === 2999, 'rupee->paisa conversion');
  console.log('  toPaisa(29.99) =', round);
}

console.log('');
console.log(failures === 0 ? 'ALL TESTS PASSED ✅' : `${failures} TEST(S) FAILED ❌`);
if (failures > 0) process.exit(1);