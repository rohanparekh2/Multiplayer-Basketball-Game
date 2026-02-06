'use client'

import { useGameState } from '@/hooks/useGameState'
import { ShotType, GameState } from '@/types/game'

interface ShotRegionsProps {
  debug?: boolean
}

export function ShotRegions({ debug = false }: ShotRegionsProps) {
  const { gameState, selectShot, actionLoading } = useGameState()
  
  // Only enable interaction during shot selection
  const isShotSelectionActive = gameState?.state === GameState.WAITING_FOR_SHOT
  const isLoading = actionLoading === 'shot'
  const isReady = !!gameState?.room_id
  
  const handleRegionClick = async (shotType: ShotType) => {
    if (!isReady || !isShotSelectionActive || isLoading) {
      return
    }
    
    try {
      await selectShot(shotType, gameState.room_id!)
    } catch (error: any) {
      console.error('❌ Error selecting shot from region:', error)
    }
  }
  
  // Don't render if not in shot selection state (unless debug mode)
  if (!debug && !isShotSelectionActive) {
    return null
  }
  
  // Debug styling
  const zoneStyle = debug
    ? 'bg-[rgba(255,0,0,0.15)] border-2 border-[rgba(255,0,0,0.4)]'
    : ''
  
  const pointerStyle = isShotSelectionActive && !isLoading
    ? 'cursor-pointer'
    : 'cursor-default pointer-events-none'
  
  return (
    <>
      {/* Paint/Key area - Layup */}
      <div
        className={`absolute left-[25%] right-[25%] top-[12%] bottom-[42%] ${zoneStyle} ${pointerStyle}`}
        onClick={() => handleRegionClick(ShotType.LAYUP)}
      />
      
      {/* Restricted area (semicircle under rim) - Layup */}
      <div
        className={`absolute left-[38%] right-[38%] bottom-[40%] h-[12%] rounded-full ${zoneStyle} ${pointerStyle}`}
        onClick={() => handleRegionClick(ShotType.LAYUP)}
      />
      
      {/* Midrange region (between paint and 3pt arc) */}
      <div
        className={`absolute left-[14%] right-[14%] top-[12%] bottom-[30%] ${zoneStyle} ${pointerStyle}`}
        onClick={() => handleRegionClick(ShotType.MIDRANGE)}
      />
      
      {/* 3pt arc region (outside paint, inside corner 3s) */}
      <div
        className={`absolute left-[14%] right-[14%] top-[30%] bottom-[0%] ${zoneStyle} ${pointerStyle}`}
        onClick={() => handleRegionClick(ShotType.THREE_POINTER)}
      />
      
      {/* Corner 3 left */}
      <div
        className={`absolute left-0 w-[14%] bottom-0 h-[70%] ${zoneStyle} ${pointerStyle}`}
        onClick={() => handleRegionClick(ShotType.THREE_POINTER)}
      />
      
      {/* Corner 3 right */}
      <div
        className={`absolute right-0 w-[14%] bottom-0 h-[70%] ${zoneStyle} ${pointerStyle}`}
        onClick={() => handleRegionClick(ShotType.THREE_POINTER)}
      />
      
      {/* Half-court region (top area beyond 3pt) */}
      <div
        className={`absolute left-[14%] right-[14%] top-0 bottom-[70%] ${zoneStyle} ${pointerStyle}`}
        onClick={() => handleRegionClick(ShotType.HALF_COURT)}
      />
    </>
  )
}

