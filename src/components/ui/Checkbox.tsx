import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label?: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...rest },
  ref,
) {
  return (
    <label className={cn('vg-check', className)}>
      <input ref={ref} type="checkbox" {...rest} />
      <span className="vg-check__box" aria-hidden />
      {label ? <span>{label}</span> : null}
    </label>
  )
})
