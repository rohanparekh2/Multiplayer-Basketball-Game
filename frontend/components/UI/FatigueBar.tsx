'use client'

import { GameStateResponse, ShotRecord } from '@/types/game'

interface FatigueBarProps {
  gameState: GameStateResponse
}

export function FatigueBar({ gameState }: FatigueBarProps) {
  // Only show for current offensive player
  const currentPlayerName = gameState.current_offensive_player
  if (!currentPlayerName) {
    return null
  }

  // Filter shot history by current player (same approximation as HotColdIndicator)
  const playerShots = (gameState.shot_history || []).filter((shot: ShotRecord) => {
    // Same heuristic as HotColdIndicator - will be improved when backend adds player tracking
    return true
  })

  // Calculate fatigue from shot count (capped at 10)
  const fatigue = Math.min(playerShots.length, 10)
  const fatiguePercent = (fatigue / 10) * 100
  const fatiguePenalty = Math.floor(fatigue * 0.6) // ~6% per shot, capped at 6%

  if (fatigue === 0) {
    return null
  }

  // Color gradient: green -> yellow -> orange -> red
  const getColor = (percent: number): string => {
    if (percent < 30) return 'bg-green-500'
    if (percent < 60) return 'bg-yellow-500'
    if (percent < 80) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-700 font-medium">Fatigue</span>
        <span className="text-gray-600">{fatigue}/10</span>
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor(fatiguePercent)} transition-all duration-300`}
          style={{ width: `${fatiguePercent}%` }}
        />
      </div>
      {fatiguePenalty > 0 && (
        <div className="text-[10px] text-gray-600" title={`Fatigue reduces make% by ${fatiguePenalty}%`}>
          -{fatiguePenalty}% make%
        </div>
      )}
    </div>
  )
}

