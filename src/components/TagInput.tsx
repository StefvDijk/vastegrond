import { useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Badge } from './ui'

type TagInputProps = {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}

// Eenvoudige tag-input: typ + enter/komma toevoegt een tag. Backspace op leeg
// veld verwijdert de laatste. Duplicaten worden stilletjes genegeerd.
export function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('')

  function commit(raw: string) {
    const tag = raw.trim().toLowerCase()
    if (!tag) return
    if (value.includes(tag)) {
      setDraft('')
      return
    }
    onChange([...value, tag])
    setDraft('')
  }

  function remove(tag: string) {
    onChange(value.filter((t) => t !== tag))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit(draft)
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      remove(value[value.length - 1])
    }
  }

  return (
    <div className="vg-input flex flex-wrap items-center gap-s-2" style={{ minHeight: 44 }}>
      {value.map((tag) => (
        <Badge key={tag} variant="outline" className="flex items-center gap-s-1">
          {tag}
          <button
            type="button"
            onClick={() => remove(tag)}
            aria-label={`Verwijder tag ${tag}`}
            className="hover:opacity-70"
          >
            <X size={12} aria-hidden />
          </button>
        </Badge>
      ))}
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => commit(draft)}
        placeholder={value.length === 0 ? (placeholder ?? 'Voeg tag toe…') : ''}
        className="flex-1 bg-transparent outline-none border-none p-0 text-body-m"
        style={{ minWidth: 120 }}
      />
    </div>
  )
}
