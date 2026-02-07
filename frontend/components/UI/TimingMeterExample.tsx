'use client'

/**
 * Example integration of TimingMeter with existing shot probability system
 * 
 * This shows how to:
 * 1. Wire TimingMeter into the shot selection flow
 * 2. Use timing result to modify base make probability
 * 3. Integrate with ShotResolutionAnimation for visual feedback
 */

import { useState } from 'react'
import { TimingMeter, TimingResult } from './TimingMeter'
import { ShotResolutionAnimation } from '../Basketball/ShotResolutionAnimation'
import { ShotType, ContestLevel, DefenseState, ShotArchetype, ShotZone, ShotRecord } from '@/types/game'
import { calculateMakePct } from '@/utils/offense'

interface TimingMeterExampleProps {
  shotType: ShotType
  contestLevel: ContestLevel
  archetype: ShotArchetype
  subtype: string
  zone: ShotZone
  shotHistory: ShotRecord[]  // For hot streak and fatigue calculation
  onShotComplete: (made: boolean, finalProbability: number) => void
}

export function TimingMeterExample({
  shotType,
  contestLevel,
  archetype,
  subtype,
  zone,
  shotHistory,
  onShotComplete,
}: TimingMeterExampleProps) {
  const [timingResult, setTimingResult] = useState<TimingResult | null>(null)
  const [showAnimation, setShowAnimation] = useState(false)
  const [shotMade, setShotMade] = useState(false)
  const [finalProbability, setFinalProbability] = useState(0)

  const handleTimingLockIn = (result: TimingResult) => {
    console.log('🎯 Timing locked in:', result)
    
    setTimingResult(result)

    // Calculate final make probability using calculateMakePct()
    const finalPct = calculateMakePct({
      archetype,
      subtype,
      zone,
      contestLevel,
      timingGrade: result.grade,
      timingError: result.error,
      shotHistory,
    })
    
    setFinalProbability(finalPct)
    console.log('📊 Probability calculation:', {
      archetype,
      subtype,
      zone,
      contestLevel,
      timingGrade: result.grade,
      timingError: result.error,
      final: finalPct,
    })

    // Determine if shot is made based on final probability
    const random = Math.random()
    const made = random < finalPct
    
    setShotMade(made)
    setShowAnimation(true)
    
    console.log('🏀 Shot result:', { made, random, threshold: finalPct })
  }

  const handleAnimationComplete = () => {
    setShowAnimation(false)
    onShotComplete(shotMade, finalProbability)
    
    // Reset for next shot
    setTimingResult(null)
    setShotMade(false)
    setFinalProbability(0)
  }

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Timing Meter */}
      <div className="w-full">
        <TimingMeter
          shotType={shotType}
          contestLevel={contestLevel}
          onLockIn={handleTimingLockIn}
          disabled={showAnimation}
        />
      </div>

      {/* Result display */}
      {timingResult && (
        <div className="text-center space-y-1">
          <div className="text-sm font-semibold">
            Timing: <span className={
              timingResult.grade === 'PERFECT' ? 'text-green-500' :
              timingResult.grade === 'GOOD' ? 'text-yellow-500' :
              'text-red-500'
            }>{timingResult.grade}</span>
            {timingResult.error > 0 && (
              <span className="text-xs text-gray-500 ml-1">
                (error: {(timingResult.error * 100).toFixed(0)}%)
              </span>
            )}
          </div>
          <div className="text-xs text-gray-600">
            Final Make %: {(finalProbability * 100).toFixed(1)}%
          </div>
        </div>
      )}

      {/* Shot Resolution Animation */}
      {showAnimation && (
        <ShotResolutionAnimation
          made={shotMade}
          onComplete={handleAnimationComplete}
        />
      )}
    </div>
  )
}

/**
 * Helper function to determine contest level from defense state
 * This can be used to extract contest level from your game's defense_state
 */
export function determineContestLevel(defenseState: DefenseState | null | undefined): ContestLevel {
  if (!defenseState?.contest_distribution) {
    return ContestLevel.LIGHT // Default
  }

  // Get the most common contest level from distribution
  const distribution = defenseState.contest_distribution
  const counts: Record<string, number> = {}
  
  Object.values(distribution).forEach((level) => {
    counts[level] = (counts[level] || 0) + 1
  })

  // Find the most common contest level
  let maxCount = 0
  let mostCommon: string = ContestLevel.LIGHT
  
  Object.entries(counts).forEach(([level, count]) => {
    if (count > maxCount) {
      maxCount = count
      mostCommon = level
    }
  })

  // Map to ContestLevel enum
  if (mostCommon === ContestLevel.HEAVY) return ContestLevel.HEAVY
  if (mostCommon === ContestLevel.OPEN) return ContestLevel.OPEN
  return ContestLevel.LIGHT
}

/**
 * Usage in your game flow:
 * 
 * ```tsx
 * import { determineContestLevel } from './TimingMeterExample'
 * import { ShotArchetype, ShotZone } from '@/types/game'
 * 
 * function PowerMeterReplacement({ gameState }: { gameState: GameStateResponse }) {
 *   const { selectPower } = useGameState()
 * 
 *   const handleShotComplete = async (made: boolean, finalProbability: number) => {
 *     // Update game state with result
 *     // You can use finalProbability for logging/analytics
 *     await selectPower(finalProbability * 100) // Convert to 0-100 scale if needed
 *   }
 * 
 *   if (!gameState.shot_type || !gameState.defense_state) {
 *     return <div>Loading...</div>
 *   }
 * 
 *   // Map shot type to archetype/subtype
 *   const archetypeMap: Record<ShotType, ShotArchetype> = {
 *     [ShotType.LAYUP]: ShotArchetype.RIM,
 *     [ShotType.MIDRANGE]: ShotArchetype.MIDRANGE,
 *     [ShotType.THREE_POINTER]: ShotArchetype.THREE,
 *     [ShotType.HALF_COURT]: ShotArchetype.DEEP,
 *     [ShotType.DEFAULT]: ShotArchetype.MIDRANGE,
 *   }
 * 
 *   const subtypeMap: Record<ShotType, string> = {
 *     [ShotType.LAYUP]: 'layup',
 *     [ShotType.MIDRANGE]: 'catch_shoot',
 *     [ShotType.THREE_POINTER]: 'wing_catch',
 *     [ShotType.HALF_COURT]: 'logo',
 *     [ShotType.DEFAULT]: 'catch_shoot',
 *   }
 * 
 *   // Determine contest level and zone from defense state
 *   const contestLevel = determineContestLevel(gameState.defense_state)
 *   const zone = ShotZone.WING // Or determine from shot selection
 * 
 *   // Get shot history for current player
 *   const shotHistory = gameState.shot_history || []
 * 
 *   return (
 *     <TimingMeterExample
 *       shotType={gameState.shot_type}
 *       contestLevel={contestLevel}
 *       archetype={archetypeMap[gameState.shot_type]}
 *       subtype={subtypeMap[gameState.shot_type]}
 *       zone={zone}
 *       shotHistory={shotHistory}
 *       onShotComplete={handleShotComplete}
 *     />
 *   )
 * }
 * ```
 */

