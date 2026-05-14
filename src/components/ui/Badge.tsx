import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'neutral' | 'positive' | 'negative' | 'warning' | 'accent' | 'outline'

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: Variant
  children: ReactNode
}

export function Badge({ variant = 'neutral', className, children, ...rest }: BadgeProps) {
  return (
    <span className={cn('vg-badge', `vg-badge--${variant}`, className)} {...rest}>
      {children}
    </span>
  )
}

export function Counter({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('vg-counter', className)}>{children}</span>
}
