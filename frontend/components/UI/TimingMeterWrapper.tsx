'use client'

import { useState, useEffect } from 'react'
import { TimingMeter, TimingResult } from './TimingMeter'
import { useGameState } from '@/hooks/useGameState'
import { gameApi } from '@/services/api'
import { GameStateResponse, ShotType, ShotArchetype, ShotZone, ContestLevel } from '@/types/game'
import { calculateMakePct } from '@/utils/offense'
import { determineContestLevel } from './TimingMeterExample'

interface TimingMeterWrapperProps {
  gameState: GameStateResponse
}

// Map shot type to archetype
const SHOT_TO_ARCHETYPE: Record<ShotType, ShotArchetype> = {
  [ShotType.LAYUP]: ShotArchetype.RIM,
  [ShotType.MIDRANGE]: ShotArchetype.MIDRANGE,
  [ShotType.THREE_POINTER]: ShotArchetype.THREE,
  [ShotType.HALF_COURT]: ShotArchetype.DEEP,
  [ShotType.DEFAULT]: ShotArchetype.MIDRANGE,
}

// Map shot type to subtype
const SHOT_TO_SUBTYPE: Record<ShotType, string> = {
  [ShotType.LAYUP]: 'layup',
  [ShotType.MIDRANGE]: 'catch_shoot',
  [ShotType.THREE_POINTER]: 'wing_catch',
  [ShotType.HALF_COURT]: 'logo',
  [ShotType.DEFAULT]: 'catch_shoot',
}

export function TimingMeterWrapper({ gameState }: TimingMeterWrapperProps) {
  const { selectPower, actionLoading } = useGameState()
  const [timingResult, setTimingResult] = useState<TimingResult | null>(null)
  const [shotMade, setShotMade] = useState(false)
  const [finalProbability, setFinalProbability] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  if (!gameState.shot_type || !gameState.defense_state) {
    return <div className="text-center text-gray-500">Loading timing meter...</div>
  }

  // Map shot type to archetype/subtype
  const archetype = SHOT_TO_ARCHETYPE[gameState.shot_type]
  const subtype = SHOT_TO_SUBTYPE[gameState.shot_type]
  const zone = ShotZone.WING // Default zone - could be determined from shot selection
  const contestLevel = determineContestLevel(gameState.defense_state)
  const shotHistory = gameState.shot_history || []

  const handleTimingLockIn = async (result: TimingResult) => {
    if (isProcessing || !gameState.room_id) return

    console.log('🎯 Timing locked in:', result)
    setTimingResult(result)
    setIsProcessing(true)

    try {
      // Calculate final make probability
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
      console.log('📊 Frontend calculated probability:', finalPct)

      // Call selectPower with timing data so backend can use it in calculation
      // Backend will calculate its own probability WITH timing and determine result
      const powerValue = Math.round(finalPct * 100)
      
      // Ensure power value is in valid range (0-100)
      const clampedPower = Math.max(0, Math.min(100, powerValue))
      
      // Call API directly to get backend's calculated result (includes timing)
      // Only call once to avoid state conflicts
      const apiResponse = await gameApi.selectPower(
        gameState.room_id,
        clampedPower,
        result.grade,  // Send timing grade
        result.error   // Send timing error
      )

      // Use backend's calculated result (it now includes timing!)
      if (apiResponse?.game_state?.shot_result !== null && apiResponse?.game_state?.shot_result !== undefined) {
        const backendMade = apiResponse.game_state.shot_result
        setShotMade(backendMade)
        console.log('🏀 Backend shot result (with timing):', backendMade)
      } else {
        // Fallback: use frontend calculation if backend doesn't return result
        const random = Math.random()
        const made = random < finalPct
        setShotMade(made)
        console.log('🏀 Using frontend calculation (backend result not available):', made)
      }

      setIsProcessing(false)
    } catch (error: any) {
      console.error('❌ Error processing timing:', error)
      alert(`Error: ${error?.message || error}`)
      setIsProcessing(false)
      setTimingResult(null)
    }
  }


  // Call finishAnimation after court animation completes
  // This transitions backend from ANIMATING to SHOT_RESULT
  useEffect(() => {
    if (timingResult && gameState?.room_id && gameState?.state === 'animating') {
      const timeout = setTimeout(async () => {
        try {
          console.log('🎬 TimingMeterWrapper: Calling finishAnimation...')
          await gameApi.finishAnimation(gameState.room_id!)
          console.log('✅ TimingMeterWrapper: finishAnimation completed')
        } catch (error: any) {
          console.error('❌ Error calling finishAnimation:', error)
        }
      }, 1800) // Wait for court animation to complete
      return () => clearTimeout(timeout)
    }
  }, [timingResult, gameState?.room_id, gameState?.state])

  // Clear timing result and probability when game state changes to a new shot
  // Keep it visible through waiting_for_power, animating, and shot_result states
  // Only clear when a new turn starts (waiting_for_shot or waiting_for_defense)
  useEffect(() => {
    // Clear when we transition to a new shot (waiting_for_shot or waiting_for_defense)
    // This means the turn is over and a new shot has started
    if (gameState?.state === 'waiting_for_shot' || gameState?.state === 'waiting_for_defense') {
      // Only clear if we had a result (to avoid clearing on initial mount)
      if (timingResult !== null || finalProbability > 0) {
        setTimingResult(null)
        setFinalProbability(0)
        setShotMade(false)
        setIsProcessing(false)
      }
    }
  }, [gameState?.state, timingResult, finalProbability])

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Timing Meter */}
      <TimingMeter
        shotType={gameState.shot_type}
        contestLevel={contestLevel}
        onLockIn={handleTimingLockIn}
        disabled={isProcessing || actionLoading === 'power'}
      />

      {/* Result display - shown after timing is locked in, stays until turn is over */}
      {timingResult && (
        <div className="text-center space-y-2 p-4 bg-black/20 rounded-lg border border-white/10">
          <div className="text-lg font-semibold">
            Timing: <span className={
              timingResult.grade === 'PERFECT' ? 'text-green-500' :
              timingResult.grade === 'GOOD' ? 'text-yellow-500' :
              'text-red-500'
            }>{timingResult.grade}</span>
          </div>
          <div className="text-base text-white/80">
            Make %: <span className="font-bold text-white">{(finalProbability * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

