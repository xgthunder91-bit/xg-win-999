import { apiGet, apiPost } from './api';

let currentUserId: string | null = null;

export function setTrackUser(id: string | null) {
  currentUserId = id;
}

export function getTrackUser(): string | null {
  return currentUserId;
}

/**
 * Posts a bet to the server (/api/game/bet debits the stake and stores the
 * bet so it can be settled when the round ends and shown in history).
 * Returns the server response, or null when the request could not be made.
 */
export async function reportBet(
  game: string,
  amount: number,
  details?: Record<string, any>
): Promise<{ success: boolean; message?: string; data?: any } | null> {
  if (!currentUserId) return null;
  try {
    return await apiPost('/game/bet', {
      userId: currentUserId,
      game,
      amount,
      ...(details || {}),
    });
  } catch {
    return null;
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
