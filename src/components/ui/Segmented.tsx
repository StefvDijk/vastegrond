import { cn } from '../../lib/cn'

type Option<T extends string> = {
  value: T
  label: string
}

type SegmentedProps<T extends string> = {
  options: ReadonlyArray<Option<T>>
  value: T
  onChange: (value: T) => void
  className?: string
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedProps<T>) {
  return (
    <div className={cn('vg-seg', className)} role="tablist">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn('vg-seg__item', active && 'vg-seg__item--on')}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
