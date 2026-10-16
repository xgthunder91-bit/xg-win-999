/**
 * Vortex Game Types & State Definitions
 */

export type ElementType = 'water' | 'earth' | 'fire';
export type RollOutcome = 'water' | 'earth' | 'fire' | 'cloud' | 'skull' | 'bonus';

export interface TrackSegment {
  id: string;
  track: ElementType;
  stepIndex: number;
  multiplier: number;
  isBonus?: boolean;
  bonusAdd?: number;
  label: string;
  angleDeg: number; // visual angular position in degrees
  arcStartDeg: number;
  arcEndDeg: number;
}

export interface GameState {
  balance: number;
  betAmount: number;
  isSpinning: boolean;
  turbo: boolean;
  soundEnabled: boolean;
  
  // Active progression state
  waterStep: number; // 0 = unlit, 1..6 = step reached
  earthStep: number;
  fireStep: number;
  bonusMultiplierTotal: number;
  
  // Current outcome
  lastRoll: RollOutcome | null;
  currentMultiplier: number;
  payout: number;
  partPayout: number;
  
  // UI states
  hasActiveWin: boolean;
  showCashoutPopup: boolean;
  showBetModal: boolean;
  showHelpModal: boolean;
  isBust: boolean;
  spinCount: number;
}

export const BET_PRESETS = [5, 8, 10, 20, 50, 100, 200, 500, 1000, 5000, 10000, 25000] as const;

export interface WheelConfig {
  waterTrack: TrackSegment[];
  earthTrack: TrackSegment[];
  fireTrack: TrackSegment[];
}
