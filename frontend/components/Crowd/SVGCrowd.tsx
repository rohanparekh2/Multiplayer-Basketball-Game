'use client'

/**
 * Simple SVG crowd/fans in the background
 * Clean, minimalist design
 */

export function SVGCrowd() {
  // Generate simple fan silhouettes
  const generateFans = () => {
    const fans = []
    const rows = 3
    const fansPerRow = 15
    
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i < fansPerRow; i++) {
        const x = 50 + (i * 60) + (row * 20) // Offset each row slightly
        const y = 650 + (row * 40) // Below the court
        const hue = 200 + Math.random() * 60 // Blue to purple range
        
        fans.push(
          <g key={`fan-${row}-${i}`} transform={`translate(${x}, ${y})`}>
            {/* Head */}
            <circle
              cx="0"
              cy="-10"
              r="8"
              fill={`hsl(${hue}, 50%, 30%)`}
              opacity="0.7"
            />
            {/* Body */}
            <rect
              x="-6"
              y="0"
              width="12"
              height="20"
              rx="3"
              fill={`hsl(${hue}, 50%, 35%)`}
              opacity="0.7"
            />
            {/* Arms raised (cheering) */}
            <line
              x1="-6"
              y1="5"
              x2="-12"
              y2="-5"
              stroke={`hsl(${hue}, 50%, 30%)`}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.6"
            />
            <line
              x1="6"
              y1="5"
              x2="12"
              y2="-5"
              stroke={`hsl(${hue}, 50%, 30%)`}
              strokeWidth="3"
              strokeLinecap="round"
              opacity="0.6"
            />
          </g>
        )
      }
    }
    
    return fans
  }
  
  return (
    <g>
      {/* Background darkening for depth */}
      <rect
        x="0"
        y="600"
        width="1000"
        height="200"
        fill="url(#crowdGradient)"
      />
      
      <defs>
        <linearGradient id="crowdGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#020617" stopOpacity="1" />
        </linearGradient>
      </defs>
      
      {/* Fans */}
      {generateFans()}
    </g>
  )
}
