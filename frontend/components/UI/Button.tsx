'use client'

import { ButtonHTMLAttributes, ReactNode, useRef, useEffect } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'error' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  icon?: ReactNode
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  onClick,
  ...props
}: ButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const baseClasses = 'relative inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'glass-strong bg-primary-500/25 text-white hover:bg-primary-500/35 focus:ring-primary-400 glow-orange hover:scale-105 active:scale-95 border border-primary-400/30',
    secondary: 'glass bg-white/10 text-white hover:bg-white/20 focus:ring-white/50 hover:scale-105 active:scale-95 border border-white/20',
    success: 'glass-strong bg-success-500/25 text-success-200 hover:bg-success-500/35 focus:ring-success-400 glow-green hover:scale-105 active:scale-95 border border-success-400/30',
    error: 'glass-strong bg-error-500/25 text-error-200 hover:bg-error-500/35 focus:ring-error-400 glow-red hover:scale-105 active:scale-95 border border-error-400/30',
    ghost: 'text-white/80 hover:text-white hover:bg-white/10 focus:ring-white/50',
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
  }

  // Add direct click handler to ensure it works
  useEffect(() => {
    const button = buttonRef.current
    if (!button || !onClick) return

    const handleClick = (e: MouseEvent) => {
      if (disabled || isLoading) {
        e.preventDefault()
        e.stopPropagation()
        return
      }
      console.log('🔘 Direct button click detected')
      onClick(e as any)
    }

    button.addEventListener('click', handleClick, true)
    return () => {
      button.removeEventListener('click', handleClick, true)
    }
  }, [onClick, disabled, isLoading])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('🔘 React onClick handler fired', { disabled, isLoading, hasOnClick: !!onClick })
    if (disabled || isLoading) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      onClick={handleClick}
      style={{ pointerEvents: disabled || isLoading ? 'none' : 'auto' }}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={size === 'lg' ? 'md' : 'sm'} />
          <span className="ml-2">Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
}
