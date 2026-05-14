import { Search as SearchIcon } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type SearchProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  containerClassName?: string
}

export function Search({ containerClassName, className, ...rest }: SearchProps) {
  return (
    <div className={cn('vg-search', containerClassName)}>
      <SearchIcon size={16} aria-hidden />
      <input type="search" className={className} {...rest} />
    </div>
  )
}
