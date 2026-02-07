/**
 * Offense probability calculation system
 * 
 * Combines multiple factors to calculate final make percentage:
 * - Base percentage by archetype/subtype
 * - Timing modifier (from TimingMeter)
 * - Hot/cold streak bonus
 * - Fatigue penalty
 * - Contest penalty
 * - Zone bonus
 * 
 * Final result is clamped to [0.02, 0.95]
 */

import { ShotArchetype, ShotZone, ContestLevel } from '@/types/game'
import { TimingGrade } from '@/components/UI/TimingMeter'
import { ShotRecord } from '@/types/game'

// Base make percentages by archetype
const BASE_PERCENTAGES: Record<ShotArchetype, number> = {
  [ShotArchetype.RIM]: 0.62,
  [ShotArchetype.PAINT]: 0.48,
  [ShotArchetype.MIDRANGE]: 0.42,
  [ShotArchetype.THREE]: 0.36,
  [ShotArchetype.DEEP]: 0.18,
}

// Subtype modifiers (subtle adjustments to base)
const SUBTYPE_MODIFIERS: Record<string, number> = {
  dunk: 0.05,        // Slightly higher than layup
  layup: 0.0,        // Base for rim
  floater: -0.03,    // Slightly lower than layup
  hook: 0.02,        // Slightly higher
  short_jumper: 0.0, // Base for paint
  pullup: -0.04,     // Harder than catch and shoot
  catch_shoot: 0.0,  // Base for midrange
  fade: -0.04,       // Harder
  corner_catch: 0.02, // Corner 3s are easier
  wing_catch: 0.0,   // Base for three
  top_catch: -0.02,  // Top 3s are harder
  corner_off_dribble: -0.03,
  wing_off_dribble: -0.05,
  top_off_dribble: -0.07,
  logo: -0.10,       // Deep shots are harder
  heave: -0.13,      // Much harder
}

// Zone bonuses (some zones are easier to shoot from)
const ZONE_BONUSES: Record<ShotZone, number> = {
  [ShotZone.CORNER]: 0.02,      // Corner shots are slightly easier
  [ShotZone.WING]: 0.0,         // Base
  [ShotZone.TOP]: -0.02,        // Top shots are slightly harder
  [ShotZone.PAINT]: 0.0,        // Base
  [ShotZone.RESTRICTED]: 0.0,   // Base
}

// Contest penalties
const CONTEST_PENALTIES: Record<ContestLevel, number> = {
  [ContestLevel.OPEN]: 0.0,     // No penalty
  [ContestLevel.LIGHT]: -0.15,  // 15% reduction
  [ContestLevel.HEAVY]: -0.30,  // 30% reduction
}

// Timing modifiers based on grade
const TIMING_MODIFIERS: Record<TimingGrade, number> = {
  PERFECT: +0.10,  // +10% for perfect timing
  GOOD: +0.03,     // +3% for good timing
  MISS: -0.08,     // -8% for missed timing
}

// Timing error scaling (how much error affects the modifier)
const TIMING_ERROR_SCALE = 0.3 // Error can reduce modifier by up to 30%

export interface CalculateMakePctParams {
  archetype: ShotArchetype
  subtype: string
  zone: ShotZone
  contestLevel: ContestLevel
  timingGrade: TimingGrade
  timingError: number  // 0..1
  shotHistory: ShotRecord[]  // For calculating hot streak and fatigue
}

/**
 * Calculate hot streak bonus/penalty from shot history
 * Hot streak: +3% if made 2+ of last 3 shots
 * Cold streak: -3% if made 1 or fewer of last 5 shots
 */
function getHotColdBonus(shotHistory: ShotRecord[]): number {
  if (shotHistory.length < 3) {
    return 0.0
  }

  // Check last 3 shots
  const last3 = shotHistory.slice(-3)
  const madeLast3 = last3.filter(s => s.made).length

  if (madeLast3 >= 2) {
    return 0.03  // Hot streak bonus
  }

  // Check last 5 shots for cold streak
  if (shotHistory.length >= 5) {
    const last5 = shotHistory.slice(-5)
    const madeLast5 = last5.filter(s => s.made).length

    if (madeLast5 <= 1) {
      return -0.03  // Cold streak penalty
    }
  }

  return 0.0
}

/**
 * Calculate fatigue penalty from shot history
 * Fatigue increases with number of recent shots
 */
function getFatiguePenalty(shotHistory: ShotRecord[]): number {
  // Count shots in last 5 turns
  const recentShots = shotHistory.slice(-5)
  const fatigue = Math.min(10, recentShots.length * 0.5)
  
  // Penalty: -0.01 per fatigue point, max -0.10
  return Math.max(-0.10, -fatigue * 0.01)
}

/**
 * Calculate timing modifier based on grade and error
 * Perfect timing with no error = full modifier
 * Error reduces the modifier effectiveness
 */
function getTimingModifier(grade: TimingGrade, error: number): number {
  const baseModifier = TIMING_MODIFIERS[grade]
  
  // Error reduces modifier effectiveness
  // error = 0 → full modifier
  // error = 1 → modifier reduced by TIMING_ERROR_SCALE
  const errorPenalty = baseModifier * TIMING_ERROR_SCALE * error
  
  // For PERFECT/GOOD, error reduces bonus
  // For MISS, error increases penalty
  if (grade === 'MISS') {
    return baseModifier - errorPenalty  // More error = more penalty
  } else {
    return baseModifier - errorPenalty  // More error = less bonus
  }
}

/**
 * Calculate final make percentage combining all factors
 * 
 * Formula:
 * basePct(archetype/subtype) 
 * + timingModifier(grade, error)
 * + hotColdBonus(player.hotStreak)
 * - fatiguePenalty(player.fatigue)
 * - contestPenalty(contestLevel)
 * + zoneBonus(zone)
 * 
 * Clamped to [0.02, 0.95]
 */
export function calculateMakePct(params: CalculateMakePctParams): number {
  const {
    archetype,
    subtype,
    zone,
    contestLevel,
    timingGrade,
    timingError,
    shotHistory,
  } = params

  // 1. Base percentage by archetype
  const basePct = BASE_PERCENTAGES[archetype] || 0.35

  // 2. Subtype modifier
  const subtypeModifier = SUBTYPE_MODIFIERS[subtype] || 0.0

  // 3. Timing modifier (scaled by error)
  const timingModifier = getTimingModifier(timingGrade, timingError)

  // 4. Hot/cold streak bonus
  const hotColdBonus = getHotColdBonus(shotHistory)

  // 5. Fatigue penalty
  const fatiguePenalty = getFatiguePenalty(shotHistory)

  // 6. Contest penalty
  const contestPenalty = CONTEST_PENALTIES[contestLevel] || 0.0

  // 7. Zone bonus
  const zoneBonus = ZONE_BONUSES[zone] || 0.0

  // Combine all factors
  let finalPct = basePct
    + subtypeModifier
    + timingModifier
    + hotColdBonus
    + fatiguePenalty
    + contestPenalty
    + zoneBonus

  // Clamp to [0.02, 0.95]
  finalPct = Math.max(0.02, Math.min(0.95, finalPct))

  return finalPct
}

/**
 * Helper function to get base percentage for an archetype/subtype
 * (useful for display purposes)
 */
export function getBasePercentage(archetype: ShotArchetype, subtype: string): number {
  const base = BASE_PERCENTAGES[archetype] || 0.35
  const modifier = SUBTYPE_MODIFIERS[subtype] || 0.0
  return Math.max(0.01, Math.min(0.99, base + modifier))
}

