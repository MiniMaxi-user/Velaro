'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ZoekResultaat } from '@/app/api/zoek/route'

function PaardIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 20V14a8 8 0 1 1 16 0v6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="9" r="3" stroke="currentColor" strokeWidth="1.7"/>
    </svg>
  )
}

function StalIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
      <path d="M9 21V12h6v9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function EigenaarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
    </svg>
  )
}

const TYPE_LABEL: Record<ZoekResultaat['type'], string> = {
  paard: 'Paard',
  stal: 'Stal',
  eigenaar: 'Eigenaar',
}

export default function TopbarSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [resultaten, setResultaten] = useState<ZoekResultaat[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResultaten([])
      setIsOpen(false)
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/zoek?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResultaten(data.resultaten ?? [])
        setIsOpen(true)
        setActiveIndex(-1)
      }
    } catch {
      // silently ignore network errors
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.length < 2) {
      setResultaten([])
      setIsOpen(false)
      return
    }
    timerRef.current = setTimeout(() => search(val), 500)
  }

  const handleSelect = (item: ZoekResultaat) => {
    setQuery('')
    setResultaten([])
    setIsOpen(false)
    router.push(item.url)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || resultaten.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, resultaten.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIndex >= 0 && activeIndex < resultaten.length) {
        handleSelect(resultaten[activeIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
      inputRef.current?.blur()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div className="topbar-search-wrapper" ref={containerRef}>
      <div className="topbar-search">
        <span className="topbar-search-icon">
          {isLoading ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="topbar-search-spinner" aria-hidden="true">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14 10" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          )}
        </span>
        <input
          ref={inputRef}
          type="text"
          placeholder="Zoek paarden, stallen, eigenaren..."
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (resultaten.length > 0) setIsOpen(true) }}
          autoComplete="off"
          aria-label="Zoeken"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="topbar-zoek-dropdown"
        />
        {query.length > 0 && (
          <button
            className="topbar-search-clear"
            onClick={() => {
              setQuery('')
              setResultaten([])
              setIsOpen(false)
              inputRef.current?.focus()
            }}
            aria-label="Zoekopdracht wissen"
            type="button"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div
          id="topbar-zoek-dropdown"
          className="topbar-zoek-dropdown"
          role="listbox"
          aria-label="Zoekresultaten"
        >
          {resultaten.length === 0 ? (
            <div className="topbar-zoek-leeg">Geen resultaten gevonden</div>
          ) : (
            <ul className="topbar-zoek-lijst">
              {resultaten.map((item, idx) => (
                <li key={`${item.type}-${item.id}`}>
                  <button
                    className={`topbar-zoek-item${activeIndex === idx ? ' topbar-zoek-item--active' : ''}`}
                    onClick={() => handleSelect(item)}
                    role="option"
                    aria-selected={activeIndex === idx}
                    type="button"
                  >
                    <span className={`topbar-zoek-icon topbar-zoek-icon--${item.type}`}>
                      {item.type === 'paard' && <PaardIcon />}
                      {item.type === 'stal' && <StalIcon />}
                      {item.type === 'eigenaar' && <EigenaarIcon />}
                    </span>
                    <span className="topbar-zoek-tekst">
                      <span className="topbar-zoek-naam">{item.naam}</span>
                      {item.sub && <span className="topbar-zoek-sub">{item.sub}</span>}
                    </span>
                    <span className="topbar-zoek-type-label">{TYPE_LABEL[item.type]}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
