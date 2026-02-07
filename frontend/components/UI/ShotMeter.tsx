'use client'

interface ShotMeterProps {
  probability: number  // 0-1
  points: number  // 2 or 3
  showLabel?: boolean
}

export function ShotMeter({ probability, points, showLabel = true }: ShotMeterProps) {
  const expectedPoints = probability * points
  const percentage = Math.round(probability * 100)

  return (
    <div className="flex flex-col items-center gap-1">
      {showLabel && (
        <div className="text-[10px] text-gray-600 leading-none">
          {percentage}% make
        </div>
      )}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs font-semibold text-gray-900 leading-none">
        {expectedPoints.toFixed(2)} exp. pts
      </div>
    </div>
  )
}

