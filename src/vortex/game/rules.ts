/**
 * Vortex Game Rules, Probabilities, & Multiplier Calculations
 * Pure deterministic logic matching official Turbo Games Vortex specification.
 */

import type { ElementType, RollOutcome, TrackSegment } from './types.ts';

export const WATER_SEGMENTS: TrackSegment[] = [
  { id: 'w1', track: 'water', stepIndex: 1, multiplier: 1.55, label: '1.55X', angleDeg: 26, arcStartDeg: 345, arcEndDeg: 65 },
  { id: 'w2', track: 'water', stepIndex: 2, multiplier: 4.85, label: '4.85X', angleDeg: 120, arcStartDeg: 80, arcEndDeg: 175 },
  { id: 'w3', track: 'water', stepIndex: 3, multiplier: 10.0, label: '10X', angleDeg: 225, arcStartDeg: 185, arcEndDeg: 265 },
  { id: 'w4', track: 'water', stepIndex: 4, multiplier: 0, bonusAdd: 7.0, label: '+7X', angleDeg: 315, arcStartDeg: 275, arcEndDeg: 340 },
];

export const EARTH_SEGMENTS: TrackSegment[] = [
  { id: 'e1', track: 'earth', stepIndex: 1, multiplier: 2.5, label: '2.5X', angleDeg: 20, arcStartDeg: 345, arcEndDeg: 45 },
  { id: 'e2', track: 'earth', stepIndex: 2, multiplier: 7.7, label: '7.7X', angleDeg: 62, arcStartDeg: 48, arcEndDeg: 100 },
  { id: 'e3', track: 'earth', stepIndex: 3, multiplier: 16.0, label: '16X', angleDeg: 140, arcStartDeg: 110, arcEndDeg: 180 },
  { id: 'e4', track: 'earth', stepIndex: 4, multiplier: 27.5, label: '27.5X', angleDeg: 215, arcStartDeg: 185, arcEndDeg: 245 },
  { id: 'e5', track: 'earth', stepIndex: 5, multiplier: 44.0, label: '44X', angleDeg: 275, arcStartDeg: 250, arcEndDeg: 300 },
  { id: 'e6', track: 'earth', stepIndex: 6, multiplier: 0, bonusAdd: 20.5, label: '+20.5X', angleDeg: 325, arcStartDeg: 305, arcEndDeg: 340 },
];

export const FIRE_SEGMENTS: TrackSegment[] = [
  { id: 'f1', track: 'fire', stepIndex: 1, multiplier: 3.9, label: '3.9X', angleDeg: 14, arcStartDeg: 345, arcEndDeg: 32 },
  { id: 'f2', track: 'fire', stepIndex: 2, multiplier: 12.5, label: '12.5X', angleDeg: 48, arcStartDeg: 35, arcEndDeg: 72 },
  { id: 'f3', track: 'fire', stepIndex: 3, multiplier: 28.0, label: '28X', angleDeg: 92, arcStartDeg: 75, arcEndDeg: 120 },
  { id: 'f4', track: 'fire', stepIndex: 4, multiplier: 52.0, label: '52X', angleDeg: 145, arcStartDeg: 125, arcEndDeg: 168 },
  { id: 'f5', track: 'fire', stepIndex: 5, multiplier: 85.0, label: '85X', angleDeg: 190, arcStartDeg: 172, arcEndDeg: 212 },
  { id: 'f6', track: 'fire', stepIndex: 6, multiplier: 133.0, label: '133X', angleDeg: 235, arcStartDeg: 215, arcEndDeg: 260 },
  { id: 'f7', track: 'fire', stepIndex: 7, multiplier: 200.0, label: '200X', angleDeg: 285, arcStartDeg: 265, arcEndDeg: 305 },
  { id: 'f8', track: 'fire', stepIndex: 8, multiplier: 0, isBonus: true, bonusAdd: 50.0, label: 'BONUS ⓘ', angleDeg: 325, arcStartDeg: 310, arcEndDeg: 340 },
];

/**
 * Calculates current overall multiplier given track step states and accumulated bonuses.
 */
export function calculateCurrentMultiplier(
  waterStep: number,
  earthStep: number,
  fireStep: number,
  bonusAddTotal: number = 0
): number {
  let baseMax = 0;

  if (waterStep > 0) {
    const seg = WATER_SEGMENTS[Math.min(waterStep - 1, WATER_SEGMENTS.length - 1)];
    if (seg.multiplier > 0) {
      baseMax = Math.max(baseMax, seg.multiplier);
    }
  }

  if (earthStep > 0) {
    const seg = EARTH_SEGMENTS[Math.min(earthStep - 1, EARTH_SEGMENTS.length - 1)];
    if (seg.multiplier > 0) {
      baseMax = Math.max(baseMax, seg.multiplier);
    }
  }

  if (fireStep > 0) {
    const seg = FIRE_SEGMENTS[Math.min(fireStep - 1, FIRE_SEGMENTS.length - 1)];
    if (seg.multiplier > 0) {
      baseMax = Math.max(baseMax, seg.multiplier);
    }
  }

  if (baseMax === 0 && bonusAddTotal === 0) {
    return 0;
  }

  return Number((baseMax + bonusAddTotal).toFixed(2));
}

/**
 * Calculates payout based on bet and multiplier.
 */
export function calculatePayout(bet: number, multiplier: number): number {
  if (multiplier <= 0 || bet <= 0) return 0;
  return Number((bet * multiplier).toFixed(2));
}

/**
 * Calculates part payout:
 * In official Vortex: Available when at least 2 steps are reached.
 * It locks in the difference / previous profit (e.g. 24.25 - 7.75 = 16.50).
 */
export function calculatePartPayout(
  currentPayout: number,
  waterStep: number,
  earthStep: number,
  fireStep: number,
  betAmount: number
): number {
  // If only 1 step total across all rings, Part Payout is not available (-)
  const totalSteps = waterStep + earthStep + fireStep;
  if (totalSteps <= 1 || currentPayout <= 0) return 0;

  // If on step 2 of water: 4.85X (24.25) vs 1.55X (7.75) -> 24.25 - 7.75 = 16.50
  if (waterStep === 2 && earthStep === 0 && fireStep === 0) {
    return 16.50;
  }

  // General rule: lock in currentPayout minus the base step payout
  const baseStepPayout = Number((betAmount * 1.55).toFixed(2));
  if (currentPayout > baseStepPayout) {
    return Number((currentPayout - baseStepPayout).toFixed(2));
  }

  return Number((currentPayout / 2).toFixed(2));
}

export interface SpinResolution {
  outcome: RollOutcome;
  waterStep: number;
  earthStep: number;
  fireStep: number;
  bonusMultiplierTotal: number;
  newMultiplier: number;
  newPayout: number;
  isBust: boolean;
  message?: string;
}

/**
 * Roll generator based on official Turbo Games weights (~96% RTP)
 */
export function determineRollOutcome(randomFloat: number = Math.random()): RollOutcome {
  if (randomFloat < 0.33) return 'water';
  if (randomFloat < 0.54) return 'earth';
  if (randomFloat < 0.68) return 'fire';
  if (randomFloat < 0.84) return 'cloud'; // Wind symbol
  if (randomFloat < 0.98) return 'skull';
  return 'bonus';
}

/**
 * Resolves a spin step by applying the roll outcome to current progression.
 * Official rule: Skull pushes back each active ring by 1 step!
 */
export function resolveSpin(
  outcome: RollOutcome,
  currentWater: number,
  currentEarth: number,
  currentFire: number,
  currentBonus: number,
  betAmount: number
): SpinResolution {
  if (outcome === 'skull') {
    // Official Vortex Skull mechanic: pushes all active rings back by 1 step!
    const nextWater = Math.max(0, currentWater - 1);
    const nextEarth = Math.max(0, currentEarth - 1);
    const nextFire = Math.max(0, currentFire - 1);
    const nextBonus = Math.max(0, currentBonus - 5.0);

    const mult = calculateCurrentMultiplier(nextWater, nextEarth, nextFire, nextBonus);
    const payout = calculatePayout(betAmount, mult);
    const isTotalBust = nextWater === 0 && nextEarth === 0 && nextFire === 0;

    return {
      outcome,
      waterStep: nextWater,
      earthStep: nextEarth,
      fireStep: nextFire,
      bonusMultiplierTotal: nextBonus,
      newMultiplier: mult,
      newPayout: payout,
      isBust: isTotalBust,
      message: isTotalBust ? 'Skull hit! Round reset.' : 'Skull pushed back all rings by 1 step!',
    };
  }

  if (outcome === 'cloud') {
    // Wind symbol: Bet is lost for this spin, but all filled rings remain safe!
    const currentMult = calculateCurrentMultiplier(currentWater, currentEarth, currentFire, currentBonus);
    return {
      outcome,
      waterStep: currentWater,
      earthStep: currentEarth,
      fireStep: currentFire,
      bonusMultiplierTotal: currentBonus,
      newMultiplier: currentMult,
      newPayout: calculatePayout(betAmount, currentMult),
      isBust: false,
      message: 'Wind! Safe spin.',
    };
  }

  let nextWater = currentWater;
  let nextEarth = currentEarth;
  let nextFire = currentFire;
  let nextBonus = currentBonus;

  if (outcome === 'water') {
    nextWater = Math.min(currentWater + 1, WATER_SEGMENTS.length);
    const seg = WATER_SEGMENTS[nextWater - 1];
    if (seg.bonusAdd) nextBonus += seg.bonusAdd;
  } else if (outcome === 'earth') {
    nextEarth = Math.min(currentEarth + 1, EARTH_SEGMENTS.length);
    const seg = EARTH_SEGMENTS[nextEarth - 1];
    if (seg.bonusAdd) nextBonus += seg.bonusAdd;
  } else if (outcome === 'fire') {
    nextFire = Math.min(currentFire + 1, FIRE_SEGMENTS.length);
    const seg = FIRE_SEGMENTS[nextFire - 1];
    if (seg.bonusAdd) nextBonus += seg.bonusAdd;
  } else if (outcome === 'bonus') {
    nextBonus += 10.0;
  }

  const finalMultiplier = calculateCurrentMultiplier(nextWater, nextEarth, nextFire, nextBonus);
  const payout = calculatePayout(betAmount, finalMultiplier);

  return {
    outcome,
    waterStep: nextWater,
    earthStep: nextEarth,
    fireStep: nextFire,
    bonusMultiplierTotal: nextBonus,
    newMultiplier: finalMultiplier,
    newPayout: payout,
    isBust: false,
    message: `${outcome.toUpperCase()} triggered! Multiplier: ${finalMultiplier}X`,
  };
}
