// Primitives only - no hardcoded derived values
export const COURT = {
  // ViewBox dimensions
  W: 1100,
  H: 850,
  MARGIN: 40,
  
  // Rim position (anchor point - only primitive position)
  RIM: {
    x: 550,  // W / 2
    y: 190,
  },
  
  // Backboard offset from rim
  BACKBOARD_OFFSET_Y: -55,
  
  // Lane/Paint primitives
  LANE: {
    width: 160,  // Reduced so rim/backboard visually sit inside the paint
    topOffsetFromBackboard: 15,  // Lane starts this many pixels below backboard
    bottomOffsetFromFt: 0,  // Lane ends at free throw line
  },
  
  // Free throw line
  FREE_THROW: {
    y: 600,  // Free throw line Y (tunable)
  },
  
  // Free throw circle
  FT_CIRCLE: {
    radius: 125,
  },
  
  // Restricted area (must fit inside lane)
  RESTRICTED: {
    radius: 35,  // Reduced to ensure it fits inside the narrower lane
    offsetFromRim: 55,  // Y offset from rim center
  },
  
  // 3pt geometry primitives (arc + corner segments)
  THREE_PT: {
    radius: 430,  // Arc radius, centered on rim
    cornerTopY: 320,  // Fixed Y where arc intersects corner segments (tunable; larger y = lower arc)
    cornerInset: 50,  // Horizontal inset from bounds for corner vertical segments
  },
}

// Compute all derived values from primitives
export function getCourtDerived() {
  const top = COURT.MARGIN
  const left = COURT.MARGIN
  const right = COURT.W - COURT.MARGIN
  const bottom = COURT.H - COURT.MARGIN
  
  const backboardY = COURT.RIM.y + COURT.BACKBOARD_OFFSET_Y
  const baselineY = bottom
  
  // Lane/paint: starts near backboard, extends to free throw line, rim centered horizontally
  const laneTopY = backboardY + COURT.LANE.topOffsetFromBackboard
  const laneBottomY = COURT.FREE_THROW.y
  const laneLeftX = COURT.RIM.x - COURT.LANE.width / 2  // Rim centered in lane
  const laneRightX = COURT.RIM.x + COURT.LANE.width / 2
  
  // 3pt line: arc centered on rim + two corner vertical segments
  // Corner X positions
  const cornerXLeft = left + COURT.THREE_PT.cornerInset
  const cornerXRight = right - COURT.THREE_PT.cornerInset
  
  // Compute arc intersection Y values: y = cy + sqrt(R^2 - (cornerX - cx)^2)
  // Note: In SVG, Y increases downward, so we add sqrt to get Y below rim
  const rimCx = COURT.RIM.x
  const rimCy = COURT.RIM.y
  const threeR = COURT.THREE_PT.radius
  
  const dxLeft = cornerXLeft - rimCx
  const dxRight = cornerXRight - rimCx
  const dyLeft = Math.sqrt(Math.max(0, threeR * threeR - dxLeft * dxLeft))
  const dyRight = Math.sqrt(Math.max(0, threeR * threeR - dxRight * dxRight))
  
  const arcLeftY = rimCy + dyLeft  // Y below rim where arc intersects left corner
  const arcRightY = rimCy + dyRight  // Y below rim where arc intersects right corner
  
  // Arc endpoints (where arc connects to corner segments)
  const arcLeftX = cornerXLeft
  const arcRightX = cornerXRight
  
  return {
    BOUNDS: { left, right, top, bottom },
    BASELINE_Y: baselineY,
    BACKBOARD_Y: backboardY,
    LANE_RECT: {
      x: laneLeftX,
      y: laneTopY,
      w: COURT.LANE.width,
      h: laneBottomY - laneTopY,
    },
    LANE: {
      leftX: laneLeftX,
      rightX: laneRightX,
      topY: laneTopY,
      bottomY: laneBottomY,
      width: COURT.LANE.width,
    },
    FREE_THROW: {
      y: COURT.FREE_THROW.y,
    },
    FT_CIRCLE: {
      radius: COURT.FT_CIRCLE.radius,
      centerY: COURT.FREE_THROW.y,
    },
    RESTRICTED: {
      radius: COURT.RESTRICTED.radius,
      centerY: COURT.RIM.y + COURT.RESTRICTED.offsetFromRim,
    },
    THREE_PT: {
      radius: threeR,
      cornerXLeft,
      cornerXRight,
      arcLeftX,
      arcLeftY,
      arcRightX,
      arcRightY,
    },
  }
}

// Export derived values
export const D = getCourtDerived()

// Runtime invariants (dev mode only)
if (process.env.NODE_ENV === 'development') {
  // 3pt corner segments must fit within bounds
  if (D.THREE_PT.cornerXLeft < D.BOUNDS.left || D.THREE_PT.cornerXRight > D.BOUNDS.right) {
    throw new Error(`3pt corners (${D.THREE_PT.cornerXLeft}-${D.THREE_PT.cornerXRight}) exceed bounds (${D.BOUNDS.left}-${D.BOUNDS.right})`)
  }
  if (D.THREE_PT.arcLeftY < D.BOUNDS.top || D.THREE_PT.arcLeftY > D.BOUNDS.bottom) {
    throw new Error(`3pt arc left Y (${D.THREE_PT.arcLeftY}) outside bounds (${D.BOUNDS.top}-${D.BOUNDS.bottom})`)
  }
  if (D.THREE_PT.arcRightY < D.BOUNDS.top || D.THREE_PT.arcRightY > D.BOUNDS.bottom) {
    throw new Error(`3pt arc right Y (${D.THREE_PT.arcRightY}) outside bounds (${D.BOUNDS.top}-${D.BOUNDS.bottom})`)
  }
  
  // Lane must fit within bounds
  if (D.LANE.leftX < D.BOUNDS.left || D.LANE.rightX > D.BOUNDS.right) {
    throw new Error(`Lane (${D.LANE.leftX}-${D.LANE.rightX}) exceeds bounds (${D.BOUNDS.left}-${D.BOUNDS.right})`)
  }
  if (D.LANE.topY < D.BOUNDS.top || D.LANE.bottomY > D.BOUNDS.bottom) {
    throw new Error(`Lane Y (${D.LANE.topY}-${D.LANE.bottomY}) exceeds bounds (${D.BOUNDS.top}-${D.BOUNDS.bottom})`)
  }
  
  // Rim must be horizontally centered in lane
  const rimCenterX = COURT.RIM.x
  const laneCenterX = (D.LANE.leftX + D.LANE.rightX) / 2
  if (Math.abs(rimCenterX - laneCenterX) > 1) {
    throw new Error(`Rim X (${rimCenterX}) not centered in lane (${laneCenterX})`)
  }
  
  // Restricted arc must fit inside lane
  const restrictedLeftX = COURT.RIM.x - D.RESTRICTED.radius
  const restrictedRightX = COURT.RIM.x + D.RESTRICTED.radius
  if (restrictedLeftX < D.LANE.leftX || restrictedRightX > D.LANE.rightX) {
    throw new Error(`Restricted arc (${restrictedLeftX}-${restrictedRightX}) exceeds lane (${D.LANE.leftX}-${D.LANE.rightX})`)
  }
  
  // Rim must be inside bounds
  if (COURT.RIM.x < D.BOUNDS.left || COURT.RIM.x > D.BOUNDS.right) {
    throw new Error(`Rim X (${COURT.RIM.x}) outside bounds (${D.BOUNDS.left}-${D.BOUNDS.right})`)
  }
  if (COURT.RIM.y < D.BOUNDS.top || COURT.RIM.y > D.BOUNDS.bottom) {
    throw new Error(`Rim Y (${COURT.RIM.y}) outside bounds (${D.BOUNDS.top}-${D.BOUNDS.bottom})`)
  }
}

// Game logic anchors (single export for consistency)
export const ANCHORS = {
  rim: COURT.RIM,
  startBall: {
    x: COURT.RIM.x,
    y: D.BASELINE_Y - 50,
  },
  ftLine: {
    y: D.FREE_THROW.y,
  },
}

// Convenience exports
export const HOOP_POSITION = COURT.RIM
export const BASELINE_Y = D.BASELINE_Y
export const COURT_BOUNDS = D.BOUNDS
