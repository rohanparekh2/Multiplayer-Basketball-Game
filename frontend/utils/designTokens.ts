/**
 * Design Tokens
 * Centralized design system tokens to prevent messy re-styling
 * All spacing, typography, colors, and border radius values should reference these tokens
 */

// Spacing Scale (8px base unit)
export const spacing = {
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
} as const

// Font Scale
export const fontSize = {
  xs: '0.75rem',     // 12px
  sm: '0.875rem',    // 14px
  base: '1rem',      // 16px
  lg: '1.125rem',   // 18px
  xl: '1.25rem',     // 20px
  '2xl': '1.5rem',   // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem',  // 36px
} as const

// Font Weights
export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const

// Color Tokens
export const colors = {
  primary: {
    50: '#fff4f0',
    100: '#ffe4d9',
    200: '#ffc9b3',
    300: '#ffa380',
    400: '#ff6b35',
    500: '#ff4500',
    600: '#e63900',
  },
  accent: {
    blue: '#3b82f6',
    mint: '#10b981',
    electric: '#06b6d4',
  },
  success: {
    500: '#22c55e',
  },
  error: {
    500: '#ef4444',
  },
  court: {
    orange: '#D2691E',
    orangeLight: '#E67E22',
    orangeDark: '#B85C1A',
  },
  background: {
    dark: '#0f0f1a',
    darker: '#1a1a2e',
  },
} as const

// Border Radius
export const borderRadius = {
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const

