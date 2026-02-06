'use client'

import { GameStateResponse } from '@/types/game'
import { Trophy, User } from 'lucide-react'
import { motion } from 'framer-motion'

interface ScoreboardProps {
  gameState: GameStateResponse
}

export function Scoreboard({ gameState }: ScoreboardProps) {
  const isPlayerOneActive = gameState.current_offensive_player === gameState.player_one.name
  const isPlayerTwoActive = gameState.current_offensive_player === gameState.player_two.name

  return (
    <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-2xl p-6 w-full max-w-[220px] max-h-[85vh] overflow-y-auto">
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-1.5 pb-2 border-b border-white/20">
          <Trophy className="w-4 h-4 text-orange-600" />
          <h2 className="text-base font-display text-gray-900 letter-spacing-wide font-extrabold">
            SCORE
          </h2>
        </div>
        
        <div className="space-y-2">
          <motion.div
            className={`rounded-lg transition-all ${
              isPlayerOneActive 
                ? 'bg-orange-500/30 glow-orange border border-orange-400/50 shadow-lg shadow-orange-500/20 ring-2 ring-orange-400/50' 
                : 'bg-white/10 border border-white/20'
            }`}
            style={{
              height: '56px',
              padding: '0 14px',
            }}
            animate={isPlayerOneActive ? { scale: [1, 1.01, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center justify-between gap-4 h-full">
              {/* Left side: icon + name */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1 rounded ${isPlayerOneActive ? 'bg-orange-500/30' : 'bg-white/15'}`}>
                  <User className={`w-3.5 h-3.5 ${isPlayerOneActive ? 'text-orange-700' : 'text-gray-700'}`} strokeWidth={2.5} />
                </div>
                <span className={`truncate font-semibold text-xs ${isPlayerOneActive ? 'text-orange-800' : 'text-gray-800'}`}>
                  {gameState.player_one.name}
                </span>
              </div>
              {/* Right side: score */}
              <motion.span
                key={gameState.player_one.score}
                initial={{ scale: 1.4, color: '#22c55e' }}
                animate={{ scale: 1, color: isPlayerOneActive ? '#ff6b35' : '#1f2937' }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="min-w-[28px] text-right tabular-nums font-semibold text-xl"
              >
                {gameState.player_one.score}
              </motion.span>
            </div>
          </motion.div>

          <motion.div
            className={`rounded-lg transition-all ${
              isPlayerTwoActive 
                ? 'bg-orange-500/30 glow-orange border border-orange-400/50 shadow-lg shadow-orange-500/20 ring-2 ring-orange-400/50' 
                : 'bg-white/10 border border-white/20'
            }`}
            style={{
              height: '56px',
              padding: '0 14px',
            }}
            animate={isPlayerTwoActive ? { scale: [1, 1.01, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center justify-between gap-4 h-full">
              {/* Left side: icon + name */}
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1 rounded ${isPlayerTwoActive ? 'bg-orange-500/30' : 'bg-white/15'}`}>
                  <User className={`w-3.5 h-3.5 ${isPlayerTwoActive ? 'text-orange-700' : 'text-gray-700'}`} strokeWidth={2.5} />
                </div>
                <span className={`truncate font-semibold text-xs ${isPlayerTwoActive ? 'text-orange-800' : 'text-gray-800'}`}>
                  {gameState.player_two.name}
                </span>
              </div>
              {/* Right side: score */}
              <motion.span
                key={gameState.player_two.score}
                initial={{ scale: 1.4, color: '#22c55e' }}
                animate={{ scale: 1, color: isPlayerTwoActive ? '#ff6b35' : '#1f2937' }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="min-w-[28px] text-right tabular-nums font-semibold text-xl"
              >
                {gameState.player_two.score}
              </motion.span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
