'use client'

import { GameStateResponse } from '@/types/game'
import { Card } from './Card'
import { Trophy, User } from 'lucide-react'
import { motion } from 'framer-motion'

interface ScoreboardProps {
  gameState: GameStateResponse
}

export function Scoreboard({ gameState }: ScoreboardProps) {
  const isPlayerOneActive = gameState.current_offensive_player === gameState.player_one.name
  const isPlayerTwoActive = gameState.current_offensive_player === gameState.player_two.name

  return (
    <Card variant="strong" className="w-full max-w-xs sm:min-w-[300px]">
      <div className="space-y-5">
        <div className="flex items-center justify-center gap-2 pb-2 border-b border-white/10">
          <Trophy className="w-6 h-6 text-primary-400" />
          <h2 className="text-2xl font-display text-white text-shadow">Score</h2>
        </div>
        
        <div className="space-y-3">
          <motion.div
            className={`flex items-center justify-between p-4 rounded-xl transition-all ${
              isPlayerOneActive ? 'glass-strong bg-primary-500/25 glow-orange border border-primary-400/30' : 'bg-white/5 border border-white/10'
            }`}
            animate={isPlayerOneActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPlayerOneActive ? 'bg-primary-500/20' : 'bg-white/5'}`}>
                <User className={`w-5 h-5 ${isPlayerOneActive ? 'text-primary-300' : 'text-white/50'}`} />
              </div>
              <span className={`font-semibold text-base ${isPlayerOneActive ? 'text-primary-200' : 'text-white/90'}`}>
                {gameState.player_one.name}
              </span>
            </div>
            <motion.span
              key={gameState.player_one.score}
              initial={{ scale: 1.4, color: '#22c55e' }}
              animate={{ scale: 1, color: isPlayerOneActive ? '#ff6b35' : '#ffffff' }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-3xl font-bold tabular-nums"
            >
              {gameState.player_one.score}
            </motion.span>
          </motion.div>

          <motion.div
            className={`flex items-center justify-between p-4 rounded-xl transition-all ${
              isPlayerTwoActive ? 'glass-strong bg-primary-500/25 glow-orange border border-primary-400/30' : 'bg-white/5 border border-white/10'
            }`}
            animate={isPlayerTwoActive ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isPlayerTwoActive ? 'bg-primary-500/20' : 'bg-white/5'}`}>
                <User className={`w-5 h-5 ${isPlayerTwoActive ? 'text-primary-300' : 'text-white/50'}`} />
              </div>
              <span className={`font-semibold text-base ${isPlayerTwoActive ? 'text-primary-200' : 'text-white/90'}`}>
                {gameState.player_two.name}
              </span>
            </div>
            <motion.span
              key={gameState.player_two.score}
              initial={{ scale: 1.4, color: '#22c55e' }}
              animate={{ scale: 1, color: isPlayerTwoActive ? '#ff6b35' : '#ffffff' }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-3xl font-bold tabular-nums"
            >
              {gameState.player_two.score}
            </motion.span>
          </motion.div>
        </div>
      </div>
    </Card>
  )
}

