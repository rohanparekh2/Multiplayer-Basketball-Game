'use client'

import { GameStateResponse } from '@/types/game'
import { ContestLevel, ShotZone } from '@/types/game'

interface ZoneHeatOverlayProps {
  defenseState: GameStateResponse['defense_state'] | null | undefined
}

export function ZoneHeatOverlay({ defenseState }: ZoneHeatOverlayProps) {
  if (!defenseState?.contest_distribution) {
    return null
  }

  const contestDist = defenseState.contest_distribution

  const getColor = (level: string): string => {
    switch (level) {
      case ContestLevel.OPEN:
        return 'rgba(34, 197, 94, 0.3)' // Green
      case ContestLevel.LIGHT:
        return 'rgba(234, 179, 8, 0.3)' // Yellow
      case ContestLevel.HEAVY:
        return 'rgba(239, 68, 68, 0.3)' // Red
      default:
        return 'rgba(156, 163, 175, 0.2)' // Gray
    }
  }

  // Simple positioned rectangles/ellipses (eyeballed relative to court image)
  // Court image is 1100x850 viewBox, but displayed with object-contain
  // These positions are approximate and will scale with the image
  
  type ZonePosition = { x: number; y: number; width: number; height: number; type: 'rect' | 'ellipse' }
  
  const zonePositions: Record<ShotZone, ZonePosition | ZonePosition[]> = {
    [ShotZone.CORNER]: [
      { x: 80, y: 650, width: 120, height: 100, type: 'rect' as const }, // Left corner
      { x: 900, y: 650, width: 120, height: 100, type: 'rect' as const }, // Right corner
    ],
    [ShotZone.WING]: [
      { x: 200, y: 500, width: 150, height: 120, type: 'rect' as const }, // Left wing
      { x: 750, y: 500, width: 150, height: 120, type: 'rect' as const }, // Right wing
    ],
    [ShotZone.TOP]: { x: 400, y: 400, width: 300, height: 100, type: 'rect' as const }, // Top of arc
    [ShotZone.PAINT]: { x: 470, y: 200, width: 160, height: 350, type: 'rect' as const }, // Lane/paint
    [ShotZone.RESTRICTED]: { x: 550, y: 240, width: 70, height: 70, type: 'ellipse' as const }, // Restricted area circle
  }

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1100 850"
      preserveAspectRatio="xMidYMid meet"
    >
      {Object.entries(zonePositions).map(([zone, positions]) => {
        const contestLevel = contestDist[zone as ShotZone] || ContestLevel.OPEN
        const color = getColor(contestLevel)
        const positionsArray = Array.isArray(positions) ? positions : [positions]
        
        return positionsArray.map((pos, idx) => {
          if (pos.type === 'ellipse') {
            return (
              <ellipse
                key={`${zone}-${idx}`}
                cx={pos.x}
                cy={pos.y}
                rx={pos.width / 2}
                ry={pos.height / 2}
                fill={color}
                stroke="rgba(0, 0, 0, 0.2)"
                strokeWidth="2"
              />
            )
          } else {
            return (
              <rect
                key={`${zone}-${idx}`}
                x={pos.x - pos.width / 2}
                y={pos.y - pos.height / 2}
                width={pos.width}
                height={pos.height}
                fill={color}
                stroke="rgba(0, 0, 0, 0.2)"
                strokeWidth="2"
                rx="8"
              />
            )
          }
        })
      })}
    </svg>
  )
}

