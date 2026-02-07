'use client'

import { ReactNode } from 'react'

export function LeftControlPanel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <div className="bg-white/15 backdrop-blur-md border border-white/25 rounded-2xl shadow-2xl p-4 w-full max-w-[320px]">
      <div className="mb-2">
        <div className="text-sm font-semibold text-gray-900">{title}</div>
        {subtitle && <div className="text-xs text-gray-700">{subtitle}</div>}
      </div>
      {children}
    </div>
  )
}
