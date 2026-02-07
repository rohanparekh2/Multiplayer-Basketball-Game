'use client'

import { DefenseState } from '@/types/game'
import { Shield } from 'lucide-react'
import { motion } from 'framer-motion'

interface DefenseStateDisplayProps {
  defenseState: DefenseState | null | undefined
}

export function DefenseStateDisplay({ defenseState }: DefenseStateDisplayProps) {
  if (!defenseState) {
    return null
  }
  
  const contestDistribution = defenseState.contest_distribution || {}
  
  // Map contest levels to colors and labels
  const contestLabels: Record<string, { label: string; color: string }> = {
    open: { label: 'Open', color: 'text-green-600' },
    light: { label: 'Light', color: 'text-yellow-600' },
    heavy: { label: 'Heavy', color: 'text-red-600' },
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/10 rounded-lg p-2 border border-white/20"
    >
      <div className="flex items-center gap-1 mb-1.5">
        <Shield className="w-3 h-3 text-gray-700" />
        <div className="text-[10px] font-semibold text-gray-800">Defense</div>
      </div>
      
      <div className="space-y-1">
        {Object.entries(contestDistribution).length > 0 ? (
          Object.entries(contestDistribution).slice(0, 4).map(([zone, contest]) => {
            const contestInfo = contestLabels[contest] || { label: contest, color: 'text-gray-600' }
            return (
              <div key={zone} className="flex items-center justify-between text-[10px]">
                <span className="text-gray-600 capitalize">{zone}</span>
                <span className={`font-semibold capitalize ${contestInfo.color}`}>
                  {contestInfo.label}
                </span>
              </div>
            )
          })
        ) : (
          <div className="text-[10px] text-gray-600">Balanced defense</div>
        )}
      </div>
    </motion.div>
  )
}

