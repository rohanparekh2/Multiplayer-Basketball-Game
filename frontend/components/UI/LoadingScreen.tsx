'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export function LoadingScreen() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-50 flex items-center justify-center">
      {/* Animated background court lines */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 w-64 h-64 border-2 border-white/20 rounded-full" />
      </div>

      <div className="relative z-10 text-center space-y-8">
        {/* Bouncing basketball animation */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ y: -50 }}
          animate={{ y: [0, -30, 0] }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <div className="relative">
            <motion.div
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 shadow-2xl relative overflow-hidden"
            >
              {/* Basketball lines */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-black" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center rotate-90">
                <div className="w-full h-0.5 bg-black" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center rotate-45">
                <div className="w-full h-0.5 bg-black/50" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center -rotate-45">
                <div className="w-full h-0.5 bg-black/50" />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Game title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-6xl sm:text-7xl font-display text-white mb-4 text-shadow-lg">
            COURT KINGS
          </h1>
          <h2 className="text-3xl sm:text-4xl font-display text-primary-400 text-shadow">
            SHOWDOWN
          </h2>
        </motion.div>

        {/* Loading text with animation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-center gap-2">
            <motion.div
              className="w-2 h-2 bg-primary-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-primary-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0.2,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-primary-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0.4,
              }}
            />
          </div>
          <motion.p
            className="text-xl text-white/80 font-medium"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            Loading game...
          </motion.p>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="max-w-md mx-auto"
        >
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Floating particles - only render on client */}
      {isClient && Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary-400/30 rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: (typeof window !== 'undefined' ? window.innerHeight : 1080) + 20,
            opacity: 0,
          }}
          animate={{
            y: -20,
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: Math.random() * 3 + 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  )
}

