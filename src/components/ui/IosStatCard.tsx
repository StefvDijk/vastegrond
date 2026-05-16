import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'positive' | 'negative' | 'warning' | 'accent'

type Props = {
  label: ReactNode
  value: ReactNode
  sub?: ReactNode
  tone?: Tone
  className?: string
}

/** Equal-height iPhone stat card — used in grids. Values are SF Pro tabular. */
export function IosStatCard({ label, value, sub, tone = 'neutral', className }: Props) {
  return (
    <div className={cn('ios-stat', className)}>
      <span className="ios-stat__label">{label}</span>
      <span
        className={cn(
          'ios-stat__value',
          tone === 'positive' && 'ios-stat__value--positive',
          tone === 'negative' && 'ios-stat__value--negative',
          tone === 'accent' && 'ios-stat__value--accent',
          tone === 'warning' && 'ios-stat__value--warning',
        )}
      >
        {value}
      </span>
      {sub ? <span className="ios-stat__sub">{sub}</span> : null}
    </div>
  )
}

/** Wrapper that gives a 2-col mobile / 4-col desktop grid with consistent gaps. */
export function IosStatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('ios-stat-grid', className)}>{children}</div>
}
