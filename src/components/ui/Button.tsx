import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: 'md' | 'sm' | 'icon'
  danger?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', danger, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'vg-btn',
        variant === 'primary' && 'vg-btn--primary',
        variant === 'secondary' && 'vg-btn--secondary',
        variant === 'accent' && 'vg-btn--accent',
        variant === 'ghost' && 'vg-btn--ghost',
        size === 'sm' && 'vg-btn--sm',
        size === 'icon' && 'vg-btn--icon',
        danger && 'vg-btn--danger',
        className,
      )}
      {...rest}
    />
  )
})
