'use client'

import { GameStateResponse } from '@/types/game'

interface ScoutingReportProps {
  gameState: GameStateResponse
}

export function ScoutingReport({ gameState }: ScoutingReportProps) {
  if (!gameState.defense_state?.summary) {
    return null
  }

  const summary = gameState.defense_state.summary
  const perimeterPressure = summary.perimeter_pressure ?? 0
  const rimProtection = summary.rim_protection ?? 0
  const scheme = summary.scheme ?? 'BALANCED'

  const getLevel = (value: number): 'High' | 'Medium' | 'Low' => {
    if (value >= 0.67) return 'High'
    if (value >= 0.33) return 'Medium'
    return 'Low'
  }

  const getColor = (level: 'High' | 'Medium' | 'Low'): string => {
    switch (level) {
      case 'High':
        return 'bg-red-500/20 border-red-500/50 text-red-700'
      case 'Medium':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700'
      case 'Low':
        return 'bg-green-500/20 border-green-500/50 text-green-700'
      default:
        return 'bg-gray-500/20 border-gray-500/50 text-gray-700'
    }
  }

  const perimeterLevel = getLevel(perimeterPressure)
  const rimLevel = getLevel(rimProtection)

  const schemeDisplay = scheme === 'SWITCH' ? 'Switch' : 
                        scheme === 'DROP' ? 'Drop' :
                        scheme === 'NO_MIDDLE' ? 'No Middle' :
                        scheme === 'DARE' ? 'Dare' : 'Balanced'

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-700 mb-1.5">Scouting Report</div>
      <div className="flex flex-wrap gap-1.5">
        <div className={`px-2 py-1 rounded-md text-[10px] font-medium border ${getColor(perimeterLevel)}`}>
          Perimeter: {perimeterLevel}
        </div>
        <div className={`px-2 py-1 rounded-md text-[10px] font-medium border ${getColor(rimLevel)}`}>
          Rim: {rimLevel}
        </div>
        <div className="px-2 py-1 rounded-md text-[10px] font-medium border bg-blue-500/20 border-blue-500/50 text-blue-700">
          Scheme: {schemeDisplay}
        </div>
      </div>
    </div>
  )
}

