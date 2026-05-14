import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  hero?: boolean
}

export function Card({ children, hero, className, ...rest }: CardProps) {
  return (
    <div className={cn('vg-card', hero && 'vg-card--hero', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardSeparator({ className }: { className?: string }) {
  return <div className={cn('vg-card__sep', className)} aria-hidden />
}

export function CardRow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('vg-card__row', className)}>{children}</div>
}
