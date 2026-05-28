import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface Option {
  value: string
  label: string
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: Option[]
  placeholder?: string
  className?: string
  variant?: 'light' | 'dark'
}

export default function Select({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  variant = 'light',
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const displayLabel = selected?.label ?? placeholder ?? options[0]?.label

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isLight = variant === 'light'

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`
          w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-sans
          border transition-colors duration-200 focus:outline-none
          ${isLight
            ? 'bg-white border-soft-gray text-dark-text hover:border-gold focus:border-gold'
            : 'bg-[#0f172a] border-[#334155] text-white hover:border-[#C9A96E] focus:border-[#C9A96E]'
          }
        `}
      >
        <span className={!selected && placeholder ? (isLight ? 'text-muted-gray' : 'text-[#475569]') : ''}>
          {displayLabel}
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''} ${
            isLight ? 'text-muted-gray' : 'text-[#475569]'
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <ul
          className={`
            absolute z-50 w-full mt-1 py-1 border shadow-lg overflow-auto max-h-60
            ${isLight
              ? 'bg-white border-soft-gray'
              : 'bg-[#1e293b] border-[#334155]'
            }
          `}
        >
          {placeholder && (
            <li
              onClick={() => { onChange(''); setOpen(false) }}
              className={`
                px-4 py-2.5 text-sm font-sans cursor-pointer flex items-center justify-between
                ${isLight ? 'text-muted-gray hover:bg-beige' : 'text-[#475569] hover:bg-[#0f172a]'}
              `}
            >
              {placeholder}
            </li>
          )}
          {options.map((o) => (
            <li
              key={o.value}
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`
                px-4 py-2.5 text-sm font-sans cursor-pointer flex items-center justify-between
                transition-colors duration-150
                ${isLight
                  ? `hover:bg-beige ${o.value === value ? 'text-gold font-medium bg-beige/50' : 'text-dark-text'}`
                  : `hover:bg-[#0f172a] ${o.value === value ? 'text-[#C9A96E] font-medium' : 'text-white'}`
                }
              `}
            >
              <span>{o.label}</span>
              {o.value === value && <Check size={13} className={isLight ? 'text-gold' : 'text-[#C9A96E]'} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
