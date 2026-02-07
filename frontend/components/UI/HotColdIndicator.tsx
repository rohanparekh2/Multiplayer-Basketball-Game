'use client'

import { GameStateResponse, ShotRecord } from '@/types/game'
import { Flame, Snowflake } from 'lucide-react'

interface HotColdIndicatorProps {
  gameState: GameStateResponse
}

export function HotColdIndicator({ gameState }: HotColdIndicatorProps) {
  // Only show for current offensive player
  const currentPlayerName = gameState.current_offensive_player
  if (!currentPlayerName) {
    return null
  }

  // Filter shot history by current player
  const playerShots = (gameState.shot_history || []).filter((shot: ShotRecord) => {
    // Determine which player took the shot based on turn number
    // Player 1 shoots on odd turns, Player 2 on even turns (assuming turn 1 is player 1)
    // This is a simplification - in a real game you'd track player per shot
    // For now, we'll use a heuristic: if we have player names, we can infer
    // Since we don't have player tracking per shot, we'll use all shots as approximation
    // TODO: Backend should include player_id in ShotRecord
    return true // Show for all shots for now - will be improved when backend adds player tracking
  })

  if (playerShots.length === 0) {
    return null
  }

  // Calculate hot/cold from last shots
  const last3Shots = playerShots.slice(-3)
  const last5Shots = playerShots.slice(-5)
  
  const madeLast3 = last3Shots.filter(shot => shot.made).length
  const madeLast5 = last5Shots.filter(shot => shot.made).length

  // Hot: Made 2+ of last 3 shots → +2 bonus
  const isHot = madeLast3 >= 2
  // Cold: Made 1 or fewer of last 5 shots → -1 penalty
  const isCold = madeLast5 <= 1 && last5Shots.length >= 3

  if (!isHot && !isCold) {
    return null
  }

  const bonus = isHot ? 2 : -1
  const streakText = isHot ? 'HOT' : 'COLD'
  const streakColor = isHot ? 'text-orange-500' : 'text-blue-400'

  return (
    <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg border border-white/20">
      {isHot ? (
        <Flame className="w-4 h-4 text-orange-500" />
      ) : (
        <Snowflake className="w-4 h-4 text-blue-400" />
      )}
      <div className="flex-1">
        <div className={`text-xs font-semibold ${streakColor}`}>
          {streakText} {bonus > 0 ? '+' : ''}{bonus}
        </div>
        <div className="text-[10px] text-gray-600">
          (last 5: {madeLast5}/{last5Shots.length})
        </div>
      </div>
    </div>
  )
}

