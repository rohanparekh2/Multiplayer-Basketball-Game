'use client'

import { GameStateResponse, ShotRecord, ShotArchetype } from '@/types/game'

interface ShotChartProps {
  gameState: GameStateResponse
}

export function ShotChart({ gameState }: ShotChartProps) {
  // Only show for current offensive player
  const currentPlayerName = gameState.current_offensive_player
  if (!currentPlayerName) {
    return null
  }

  // Filter shot history by current player (same approximation as other components)
  const playerShots = (gameState.shot_history || []).filter((shot: ShotRecord) => {
    // Same heuristic - will be improved when backend adds player tracking
    return true
  })

  if (playerShots.length === 0) {
    return null
  }

  // Group by archetype
  const archetypeStats: Record<string, { attempts: number; makes: number }> = {}
  
  playerShots.forEach((shot: ShotRecord) => {
    const archetype = shot.archetype
    if (!archetypeStats[archetype]) {
      archetypeStats[archetype] = { attempts: 0, makes: 0 }
    }
    archetypeStats[archetype].attempts++
    if (shot.made) {
      archetypeStats[archetype].makes++
    }
  })

  // Display names for archetypes
  const archetypeNames: Record<string, string> = {
    [ShotArchetype.RIM]: 'Rim',
    [ShotArchetype.PAINT]: 'Paint',
    [ShotArchetype.MIDRANGE]: 'Mid',
    [ShotArchetype.THREE]: 'Three',
    [ShotArchetype.DEEP]: 'Deep',
  }

  const stats = Object.entries(archetypeStats)
    .map(([archetype, stats]) => ({
      name: archetypeNames[archetype] || archetype,
      attempts: stats.attempts,
      makes: stats.makes,
      percentage: stats.attempts > 0 ? (stats.makes / stats.attempts) * 100 : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts) // Sort by attempts

  if (stats.length === 0) {
    return null
  }

  return (
    <div className="space-y-1.5">
      <div className="text-xs font-semibold text-gray-700 mb-1">Shot Chart</div>
      <div className="space-y-1">
        {stats.map((stat) => (
          <div key={stat.name} className="flex items-center justify-between text-[10px]">
            <span className="text-gray-700 font-medium">{stat.name}:</span>
            <span className="text-gray-600">
              {stat.attempts} shots ({stat.percentage.toFixed(0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

