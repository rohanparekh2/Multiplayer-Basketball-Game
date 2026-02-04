import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Basketball Game - Multiplayer',
  description: 'Multiplayer basketball game with 3D graphics',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

