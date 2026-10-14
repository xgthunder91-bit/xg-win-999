/**
 * End-to-end check of the pot-based settlement API.
 * Usage: node scripts/test-settlement.mjs
 * (expects a server on TEST_BASE, default http://localhost:8096/api)
 */
const BASE = process.env.TEST_BASE || 'http://localhost:8096/api';
const PERIOD = 'T' + Date.now();
const ADMIN_PW = process.env.ADMIN_PASSWORD || 'test1234';

let fails = 0;
const assert = (c, m) => {
  if (!c) {
    fails += 1;
    console.log('  FAIL:', m);
  }
};

async function call(path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'x-admin-key': token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const paisa = (r) => Math.round(Number(r) * 100);

async function main() {
  const login = await call('/admin/login', { username: 'admin', password: ADMIN_PW });
  if (!login.json.success) throw new Error('admin login failed: ' + JSON.stringify(login.json));
  const admin = login.json.data.token;
  console.log('admin logged in ✓');

  // 8 losers x Rs10, 2 winners (Rs30 + Rs20)
  const stakes = [10, 10, 10, 10, 10, 10, 10, 10, 30, 20];
  const users = [];
  for (let i = 0; i < stakes.length; i++) {
    const phone = String(8000000000 + i);
    await call('/user/register', { phone, password: 'pass1234' });
    const list = await call(`/admin/users?search=${phone}`, undefined, admin);
    const u = list.json.data.find((x) => x.phone === phone);
    if (!u) throw new Error('user not found: ' + phone);
    const top = await call(
      '/admin/user/balance',
      { userId: u.id, mode: 'set', amount: 1000, note: 'test' },
      admin
    );
    if (!top.json.success) throw new Error('topup failed: ' + JSON.stringify(top.json));
    users.push({ phone, userId: u.id, amount: stakes[i] });
  }
  console.log(`created ${users.length} users, stakes = ${stakes.join(', ')}`);

  // exactly the last two bet 'red'; everyone else bets a losing pick
  const selections = [];
  for (let i = 0; i < users.length; i++) {
    const sel = i === 8 || i === 9 ? 'red' : String(i === 7 ? 6 : i); // i=7 avoid '7'
    selections.push(sel);
    const r = await call('/game/bet', {
      userId: users[i].userId,
      game: 'wingo',
      mode: '30s',
      period: PERIOD,
      selection: sel,
      amount: users[i].amount,
    });
    if (!r.json.success) console.log(`  bet failed for ${users[i].phone}: ${r.json.message}`);
  }
  console.log('bets placed:', selections.map((s, i) => `${s}(${stakes[i]})`).join(' '));

  const totalPot = stakes.reduce((a, b) => a + b, 0);
  console.log(`total pot = ${totalPot} | winning stakes = ${stakes[8] + stakes[9]}`);

  console.log('');
  console.log('--- settle: digit 8 (red) ---');
  const settle = await call('/game/settle', { game: 'wingo', mode: '30s', period: PERIOD, number: 8 });
  const d = settle.json.data;
  console.log(`  totalPot  = ${d.totalPot}`);
  console.log(`  houseFee  = ${d.houseFee} (${d.houseFeePct}%)`);
  console.log(`  prizePool = ${d.prizePool}`);
  console.log(`  winners   = ${d.winners}`);
  d.payouts.forEach((p) => console.log(`     ${p.phone} -> ${p.amount}`));

  const paidPaisa = d.payouts.reduce((s, p) => s + paisa(p.amount), 0);
  const poolPaisa = paisa(d.prizePool);
  console.log('');
  console.log(`  paid ${paidPaisa} paisa  vs  pool ${poolPaisa} paisa`);
  assert(paidPaisa === poolPaisa, `payouts (${paidPaisa}) must equal prizePool (${poolPaisa}) exactly`);
  assert(paisa(d.totalPot) === paisa(d.houseFee) + paisa(d.prizePool), 'pot = fee + pool');
  console.log(`  EXACT ✓`);

  // proportional check: winner1 (stake 30) : winner2 (stake 20) = 3 : 2
  if (d.payouts.length === 2) {
    const ratio = paisa(d.payouts[0].amount) / paisa(d.payouts[1].amount);
    console.log(`  ratio = ${ratio.toFixed(4)} (expected ~1.5)`);
    assert(Math.abs(ratio - 1.5) < 0.01, 'winners split 3:2 by stake');
  }

  console.log('');
  console.log('--- idempotency ---');
  const again = await call('/game/settle', { game: 'wingo', mode: '30s', period: PERIOD, number: 8 });
  console.log(`  second settle winners = ${again.json.data.winners} (expect 0)`);
  assert(again.json.data.winners === 0, 're-settle must pay nobody');

  console.log('');
  console.log('--- balance check for winner ---');
  const wl = await call(`/admin/users?search=${users[8].phone}`, undefined, admin);
  const winner = wl.json.data.find((x) => x.phone === users[8].phone);
  console.log(`  winner balance = ${winner.balance} (staked 30 from 1000)`);
  assert(paisa(winner.balance) === paisa(970) + paisa(d.payouts[0].amount), 'winner balance = 970 + payout');

  console.log('');
  console.log(fails === 0 ? 'ALL ASSERTIONS PASSED ✅' : `${fails} FAILED ❌`);
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('error:', e);
  process.exit(1);
});