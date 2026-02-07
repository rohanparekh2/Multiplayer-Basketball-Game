'use client'

import { GameStateResponse, ShotRecord } from '@/types/game'
import { Flame, TrendingDown, Target } from 'lucide-react'
import { motion } from 'framer-motion'

interface PlayerStatsProps {
  gameState: GameStateResponse
  isPlayerOne: boolean
}

export function PlayerStats({ gameState, isPlayerOne }: PlayerStatsProps) {
  const player = isPlayerOne ? gameState.player_one : gameState.player_two
  const isActive = (isPlayerOne && gameState.current_offensive_player === player.name) ||
                   (!isPlayerOne && gameState.current_offensive_player === player.name)
  
  // Get player's shot history (from game history, filtered by player)
  const shotHistory = gameState.shot_history || []
  const playerShots = shotHistory.filter((shot, idx) => {
    // Alternate turns, so player_one shoots on even turns (0-indexed)
    const isPlayerOneTurn = idx % 2 === 0
    return isPlayerOne === isPlayerOneTurn
  })
  
  // Calculate stats
  const totalShots = playerShots.length
  const madeShots = playerShots.filter(s => s.made).length
  const makeRate = totalShots > 0 ? (madeShots / totalShots) : 0
  
  // Calculate fatigue (shots in last 5 turns)
  const recentShots = playerShots.slice(-5)
  const fatigue = Math.min(10, recentShots.length)
  
  // Calculate hot streak (made shots in a row, max 5)
  let hotStreak = 0
  for (let i = playerShots.length - 1; i >= 0; i--) {
    if (playerShots[i].made) {
      hotStreak++
      if (hotStreak >= 5) break
    } else {
      break
    }
  }
  
  // Shot chart by archetype
  const shotChart: Record<string, { attempts: number; makes: number }> = {}
  playerShots.forEach(shot => {
    if (!shotChart[shot.archetype]) {
      shotChart[shot.archetype] = { attempts: 0, makes: 0 }
    }
    shotChart[shot.archetype].attempts++
    if (shot.made) {
      shotChart[shot.archetype].makes++
    }
  })
  
  if (totalShots === 0) {
    return (
      <div className="bg-white/10 rounded-lg p-2 border border-white/20">
        <div className="text-[10px] font-semibold text-gray-800 mb-1">{player.name}</div>
        <div className="text-[10px] text-gray-600">No shots yet</div>
      </div>
    )
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/10 rounded-lg p-2 border ${
        isActive ? 'border-orange-400/50 ring-2 ring-orange-400/30' : 'border-white/20'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] font-semibold text-gray-800">{player.name}</div>
        <div className="flex items-center gap-1">
          {hotStreak > 0 && (
            <div className="flex items-center gap-0.5 text-orange-600">
              <Flame className="w-3 h-3" />
              <span className="text-[10px] font-bold">{hotStreak}</span>
            </div>
          )}
          {fatigue > 5 && (
            <div className="flex items-center gap-0.5 text-gray-600">
              <TrendingDown className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-600">FG%</span>
          <span className="font-semibold text-gray-800">
            {Math.round(makeRate * 100)}%
          </span>
        </div>
        
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-gray-600">Shots</span>
          <span className="font-semibold text-gray-800">
            {madeShots}/{totalShots}
          </span>
        </div>
        
        {Object.keys(shotChart).length > 0 && (
          <div className="pt-1 border-t border-white/10">
            <div className="text-[9px] text-gray-600 mb-0.5">Shot Chart</div>
            <div className="space-y-0.5">
              {Object.entries(shotChart).slice(0, 2).map(([archetype, stats]) => (
                <div key={archetype} className="flex items-center justify-between text-[9px]">
                  <span className="text-gray-600 capitalize">{archetype}</span>
                  <span className="font-semibold text-gray-800">
                    {stats.makes}/{stats.attempts}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

