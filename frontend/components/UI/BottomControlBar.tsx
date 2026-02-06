'use client'

import { ReactNode } from 'react'
import { colors, spacing, borderRadius } from '@/utils/designTokens'

interface BottomControlBarProps {
  children: ReactNode
  statusText?: string
  statusSubtext?: string
  leftSection?: ReactNode
  rightSection?: ReactNode
}

/**
 * Compact bottom control bar for game controls
 * Fixed at bottom of screen, uses design tokens
 * 3-column layout: left (320px) | center (flex) | right (320px)
 */
export function BottomControlBar({ 
  children, 
  statusText, 
  statusSubtext,
  leftSection,
  rightSection
}: BottomControlBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 pointer-events-auto"
      style={{
        height: '120px',
        background: 'rgba(255, 255, 255, 0.10)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.18)',
        boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.2)',
        padding: spacing.md,
        paddingLeft: spacing.lg,
        paddingRight: spacing.lg,
      }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          height: '120px',
          width: '100%',
        }}
      >
        {/* Left section - fixed width 320px */}
        <div style={{ width: '320px', flexShrink: 0 }}>
          {leftSection || (
            (statusText || statusSubtext) && (
              <div>
                {statusText && (
                  <p className="text-gray-900 text-sm font-medium mb-1">{statusText}</p>
                )}
                {statusSubtext && (
                  <p className="text-gray-700 text-xs">{statusSubtext}</p>
                )}
              </div>
            )
          )}
        </div>

        {/* Center section - flex:1, centers the shot buttons */}
        <div 
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>

        {/* Right section - fixed width 320px, right-aligned */}
        <div 
          style={{
            width: '320px',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
          }}
        >
          {rightSection}
        </div>
      </div>
    </div>
  )
}
