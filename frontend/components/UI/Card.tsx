'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface CardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'strong'
  animate?: boolean
}

export function Card({ children, className = '', variant = 'default', animate = true }: CardProps) {
  const variantClasses = variant === 'strong' ? 'glass-strong border border-white/20' : 'glass border border-white/10'
  
  const content = (
    <div className={`${variantClasses} rounded-2xl p-6 sm:p-8 shadow-2xl ${className}`}>
      {children}
    </div>
  )

  if (!animate) return content

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  )
}

