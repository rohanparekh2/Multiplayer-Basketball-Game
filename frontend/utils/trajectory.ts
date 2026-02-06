/**
 * Trajectory utility for calculating ball paths
 * Separates animation math from rendering for future-proofing
 * 
 * Supports:
 * - Replay mode
 * - AI shot previews
 * - Difficulty curves
 */

export interface Point {
  x: number
  y: number
}

export interface TrajectoryConfig {
  start: Point
  end: Point
  apex?: Point // Optional apex point for custom arcs
  duration: number // Animation duration in seconds
  easing?: (t: number) => number // Easing function (0-1 input, 0-1 output)
}

export interface TrajectoryResult {
  position: Point
  progress: number // 0-1
  time: number // Current time in seconds
}

/**
 * Default easing function: ease-in-out cubic
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Calculate parabolic trajectory point
 * Uses physics-based calculation: y = y0 + v0*t - 0.5*g*t^2
 */
export function calculateParabolicPoint(
  start: Point,
  end: Point,
  apex: Point,
  progress: number
): Point {
  // Quadratic Bezier curve: P(t) = (1-t)^2*P0 + 2*(1-t)*t*P1 + t^2*P2
  // Where P0 = start, P1 = apex, P2 = end
  const t = progress
  const oneMinusT = 1 - t
  
  return {
    x: oneMinusT * oneMinusT * start.x + 2 * oneMinusT * t * apex.x + t * t * end.x,
    y: oneMinusT * oneMinusT * start.y + 2 * oneMinusT * t * apex.y + t * t * end.y,
  }
}

/**
 * Calculate apex point for a parabolic trajectory
 * Apex is at the midpoint horizontally, but higher vertically
 * For basketball shots: apex should be ABOVE the highest point (start or end)
 * For 3D perspective: apex should be around y=250-300 (between basket y=120 and player y=550)
 */
export function calculateApex(start: Point, end: Point, height: number = 280): Point {
  const midX = (start.x + end.x) / 2
  // Basketball arc: apex is significantly higher, between start and end
  // The smaller y value is actually higher on screen (inverted y-axis)
  // For 3D perspective: apex should be around 250-300px from top
  const highestY = Math.min(start.y, end.y)
  return {
    x: midX,
    y: highestY - height // Subtract because y increases downward
  }
}

/**
 * Trajectory calculator class
 * Keeps animation math separate from rendering
 */
export class Trajectory {
  private config: TrajectoryConfig
  private apex: Point

  constructor(config: TrajectoryConfig) {
    this.config = {
      ...config,
      easing: config.easing || easeInOutCubic
    }
    this.apex = config.apex || calculateApex(config.start, config.end)
  }

  /**
   * Get position at a specific time
   */
  getPositionAtTime(time: number): TrajectoryResult {
    const progress = Math.min(Math.max(time / this.config.duration, 0), 1)
    const easedProgress = this.config.easing!(progress)
    
    const position = calculateParabolicPoint(
      this.config.start,
      this.config.end,
      this.apex,
      easedProgress
    )

    return {
      position,
      progress: easedProgress,
      time
    }
  }

  /**
   * Get position at a specific progress (0-1)
   */
  getPositionAtProgress(progress: number): TrajectoryResult {
    const clampedProgress = Math.min(Math.max(progress, 0), 1)
    const time = clampedProgress * this.config.duration
    return this.getPositionAtTime(time)
  }

  /**
   * Get all key points (start, apex, end)
   */
  getKeyPoints(): { start: Point; apex: Point; end: Point } {
    return {
      start: this.config.start,
      apex: this.apex,
      end: this.config.end
    }
  }

  /**
   * Get duration
   */
  getDuration(): number {
    return this.config.duration
  }

  /**
   * Create a trajectory with custom difficulty/curve
   * Useful for AI previews or difficulty adjustments
   */
  static createWithDifficulty(
    start: Point,
    end: Point,
    duration: number,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium'
  ): Trajectory {
    const heightMultipliers = {
      easy: 320,    // Higher arc, easier to make (for 3D perspective)
      medium: 280,   // Standard arc (for 3D perspective)
      hard: 240      // Lower arc, harder to make (for 3D perspective)
    }

    const apex = calculateApex(start, end, heightMultipliers[difficulty])
    
    return new Trajectory({
      start,
      end,
      apex,
      duration
    })
  }

  /**
   * Create a preview trajectory (for AI shot previews)
   * Uses a lighter, dashed style
   */
  static createPreview(
    start: Point,
    end: Point,
    duration: number = 2.0
  ): Trajectory {
    return new Trajectory({
      start,
      end,
      duration,
      easing: (t) => t // Linear for preview
    })
  }
}

