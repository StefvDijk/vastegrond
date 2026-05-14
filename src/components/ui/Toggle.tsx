import { Check, Minus } from 'lucide-react'
import { cn } from '../../lib/cn'

type ToggleProps = {
  on: boolean
  onClick: () => void
  ariaLabel: string
  className?: string
}

export function DayToggle({ on, onClick, ariaLabel, className }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      aria-label={ariaLabel}
      className={cn('vg-toggle', on && 'vg-toggle--on', className)}
    >
      {on ? <Check size={14} strokeWidth={2.5} aria-hidden /> : <Minus size={14} aria-hidden />}
    </button>
  )
}
