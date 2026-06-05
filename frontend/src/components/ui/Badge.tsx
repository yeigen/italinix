import type { ReactNode } from 'react'
import './Badge.css'

type BadgeTone = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger'

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
  /** Compact circular variant for counts. */
  count?: boolean
}

export function Badge({ children, tone = 'neutral', count = false }: BadgeProps) {
  return (
    <span className={`badge badge--${tone}${count ? ' badge--count' : ''}`}>{children}</span>
  )
}
