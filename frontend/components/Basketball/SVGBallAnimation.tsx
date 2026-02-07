'use client'

import { motion } from 'framer-motion'
import { ANCHORS, D } from '../Court/courtConstants'

interface SVGBallAnimationProps {
  made: boolean
  onComplete: () => void
  debug?: boolean
}

/**
 * SVG ball animation using Framer Motion keyframes
 * Simple and reliable - uses different paths for made vs missed shots
 */
export function SVGBallAnimation({
  made,
  onComplete,
  debug = false
}: SVGBallAnimationProps) {
  const start = ANCHORS.startBall          // {x,y}
  const rim = ANCHORS.rim                  // {x,y}
  const baselineY = D.BOUNDS.bottom

  // MADE: Higher, smoother arc with perfect trajectory
  const madeApex = {
    x: (start.x + rim.x) / 2,
    y: Math.min(start.y, rim.y) - 280 // Higher arc for made shots
  }

  // MISSED: Lower, flatter arc that hits rim at an angle
  const missDir = Math.random() < 0.5 ? -1 : 1
  const missApex = {
    x: (start.x + rim.x) / 2 + missDir * 30, // Offset apex for angled approach
    y: Math.min(start.y, rim.y) - 160 // Lower arc for missed shots
  }

  // MADE: Smooth arc to rim center, then clean drop straight down
  const madePath = {
    cx: [start.x, madeApex.x, rim.x, rim.x, rim.x],
    cy: [start.y, madeApex.y, rim.y, rim.y + 50, rim.y + 120],
    scale: [1, 1, 1, 1, 1],
    rotate: [0, 45, 90, 135, 180],
  }

  // MISSED: Angled arc to rim edge, then dramatic bounce away
  const rimHitX = rim.x + missDir * 20 // Hit rim on the side
  const bounceX = rim.x + missDir * 150
  const bounceY = rim.y + 120
  const missPath = {
    cx: [start.x, missApex.x, rimHitX, bounceX, bounceX + missDir * 60],
    cy: [start.y, missApex.y, rim.y, bounceY, bounceY + 100],
    scale: [1, 1, 1, 1, 1],
    rotate: [0, 90, 270, 450, 630], // More dramatic spin
  }

  const anim = made ? madePath : missPath

  return (
    <svg
      viewBox="0 0 1100 850"
      className="absolute inset-0 w-full h-full pointer-events-none"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Animated basketball */}
      <motion.circle
        r="28"
        fill="#ff6b00"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="3"
        initial={{ cx: start.x, cy: start.y, scale: 1, rotate: 0 }}
        animate={anim}
        transition={{
          duration: made ? 1.4 : 1.8, // Made is faster, miss is slower
          times: made ? [0, 0.4, 0.65, 0.85, 1] : [0, 0.45, 0.6, 0.8, 1],
          ease: made ? [0.4, 0, 0.2, 1] : [0.5, 0, 0.3, 1], // Smoother for made, more abrupt for miss
        }}
        onAnimationComplete={onComplete}
      />

      {/* Make effect - subtle rim flash when ball goes through */}
      {made && (
        <motion.circle
          cx={rim.x}
          cy={rim.y}
          r={35}
          fill="rgba(34, 197, 94, 0.2)"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: [0.8, 1.2, 1.4], opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.4, delay: 0.65 }}
        />
      )}

      {/* Miss effect - rim shake and red flash */}
      {!made && (
        <>
          <motion.g
            animate={{
              x: [0, -4, 4, -3, 3, -2, 2, 0],
              y: [0, -2, 2, -1, 1, 0],
            }}
            transition={{
              delay: 0.6,
              duration: 0.5,
              ease: 'easeInOut',
            }}
          >
            <circle
              cx={rim.x}
              cy={rim.y}
              r="30"
              fill="none"
              stroke="rgba(239, 68, 68, 0.5)"
              strokeWidth="3"
            />
          </motion.g>
          <motion.circle
            cx={rim.x}
            cy={rim.y}
            r={40}
            fill="rgba(239, 68, 68, 0.25)"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.3, 1.5], opacity: [0, 0.5, 0] }}
            transition={{ delay: 0.6, duration: 0.5 }}
          />
        </>
      )}

      {/* Debug overlay */}
      {debug && (
        <g>
          {/* Start position (green circle) */}
          <circle
            cx={start.x}
            cy={start.y}
            r="8"
            fill="green"
            opacity="0.7"
          />
          <text
            x={start.x}
            y={start.y - 15}
            fill="green"
            fontSize="12"
            textAnchor="middle"
            fontWeight="bold"
          >
            START
          </text>

          {/* Rim position (red circle) */}
          <circle
            cx={rim.x}
            cy={rim.y}
            r="8"
            fill="red"
            opacity="0.7"
          />
          <text
            x={rim.x}
            y={rim.y - 15}
            fill="red"
            fontSize="12"
            textAnchor="middle"
            fontWeight="bold"
          >
            RIM
          </text>

          {/* Apex (blue circle) */}
          <circle
            cx={apex.x}
            cy={apex.y}
            r="6"
            fill="blue"
            opacity="0.7"
          />
          <text
            x={apex.x}
            y={apex.y - 15}
            fill="blue"
            fontSize="10"
            textAnchor="middle"
          >
            APEX
          </text>

          {/* End position (yellow circle) */}
          <circle
            cx={anim.cx[anim.cx.length - 1]}
            cy={anim.cy[anim.cy.length - 1]}
            r="6"
            fill="yellow"
            opacity="0.7"
          />
          <text
            x={anim.cx[anim.cx.length - 1]}
            y={anim.cy[anim.cy.length - 1] - 15}
            fill="yellow"
            fontSize="10"
            textAnchor="middle"
          >
            END ({made ? 'MADE' : 'MISS'})
          </text>
        </g>
      )}
    </svg>
  )
}
