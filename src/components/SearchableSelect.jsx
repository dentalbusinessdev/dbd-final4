import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { normalizeSearchValue } from '../lib/assessment'
import { Input } from './ui'

export default function SearchableSelect({
  value,
  onSelect,
  options,
  placeholder,
  disabled = false,
  emptyMessage = 'لا توجد نتائج مطابقة',
  allowCustom = false,
  customLabel = 'إضافة مدينة جديدة',
}) {
  const safeOptions = Array.isArray(options) ? options : []
  const containerRef = useRef(null)
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)

  const handleSelect = (nextValue) => {
    onSelect(nextValue)
    setQuery(nextValue)
    setOpen(false)
  }

  useEffect(() => {
    setQuery(value || '')
    if (value) setOpen(false)
  }, [value])

  useEffect(() => {
    if (!open) return undefined

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('touchstart', handlePointerDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('touchstart', handlePointerDown)
    }
  }, [open])

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearchValue(query)
    return safeOptions.filter((option) => normalizeSearchValue(option).includes(normalizedQuery)).slice(0, 8)
  }, [query, safeOptions])

  const showCustomAction = allowCustom
    && normalizeSearchValue(query)
    && !safeOptions.some((option) => normalizeSearchValue(option) === normalizeSearchValue(query))

  return (
    <div ref={containerRef} className={`search-select ${disabled ? 'disabled' : ''}`}>
      <div className="search-select-input-wrap">
        <Input
          value={query}
          onFocus={() => {
            if (!disabled) setOpen(true)
          }}
          onBlur={() => {
            window.setTimeout(() => setOpen(false), 120)
          }}
          onChange={(event) => {
            setQuery(event.target.value)
            if (!disabled) setOpen(true)
          }}
          placeholder={placeholder}
          disabled={disabled}
        />
        <ChevronDown size={18} className={`search-select-icon ${open ? 'open' : ''}`} />
      </div>

      {open && !disabled && (
        <div className="search-select-menu">
          {filteredOptions.length > 0 ? filteredOptions.map((option) => (
            <button
              key={option}
              type="button"
              className={`search-select-option ${value === option ? 'selected' : ''}`}
              onMouseDown={(event) => {
                event.preventDefault()
                handleSelect(option)
              }}
            >
              {option}
            </button>
          )) : <div className="search-select-empty">{emptyMessage}</div>}

          {showCustomAction && (
            <button
              type="button"
              className="search-select-option search-select-option-custom"
              onMouseDown={(event) => {
                const customValue = query.trim()
                event.preventDefault()
                handleSelect(customValue)
              }}
            >
              {customLabel}: <strong>{query.trim()}</strong>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
