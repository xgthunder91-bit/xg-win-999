import { apiGet, apiPost } from './api';

let currentUserId: string | null = null;

export function setTrackUser(id: string | null) {
  currentUserId = id;
}

export function getTrackUser(): string | null {
  return currentUserId;
}

export function reportTxn(type: string, amount: number, meta?: any) {
  if (!currentUserId) return;
  apiPost('/user/transaction', { userId: currentUserId, type, amount, meta }).catch(() => {});
}

export function reportBet(game: string, amount: number, details?: Record<string, any>) {
  if (!currentUserId) return;
  apiPost('/game/bet', { userId: currentUserId, game, amount, ...(details || {}) }).catch(() => {});
}

export function reportBalanceDelta(delta: number, screen: string) {
  if (!currentUserId) return;
  if (Math.abs(delta) < 0.01) return;
  if (delta < 0) {
    reportTxn('bet', Math.abs(delta), { game: screen });
  } else {
    reportTxn('win', delta, { game: screen });
  }
}

export async function sendHeartbeat(userId: string, screen: string, avatar?: string) {
  try {
    const res = await apiPost('/user/heartbeat', { userId, screen, avatar });
    return res;
  } catch {
    return null;
  }
}

export async function fetchUser(userId: string) {
  try {
    const res = await apiGet(`/user/${userId}`);
    return res;
  } catch {
    return null;
  }
}
