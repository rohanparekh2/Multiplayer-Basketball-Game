import { DefenseState, ContestLevel } from '@/types/game'

/**
 * Determine the contest level from defense state.
 * Returns the most common contest level across all zones, or LIGHT as default.
 */
export function determineContestLevel(defenseState: DefenseState | null | undefined): ContestLevel {
  if (!defenseState?.contest_distribution) {
    return ContestLevel.LIGHT
  }

  const contestDist = defenseState.contest_distribution
  const levels = Object.values(contestDist)
  
  // Count occurrences
  const counts: Record<ContestLevel, number> = {
    [ContestLevel.OPEN]: 0,
    [ContestLevel.LIGHT]: 0,
    [ContestLevel.HEAVY]: 0,
  }
  
  levels.forEach(level => {
    if (level in counts) {
      counts[level as ContestLevel]++
    }
  })
  
  // Return the most common level, defaulting to LIGHT
  if (counts[ContestLevel.HEAVY] > counts[ContestLevel.LIGHT] && counts[ContestLevel.HEAVY] > counts[ContestLevel.OPEN]) {
    return ContestLevel.HEAVY
  }
  if (counts[ContestLevel.OPEN] > counts[ContestLevel.LIGHT]) {
    return ContestLevel.OPEN
  }
  return ContestLevel.LIGHT
}

