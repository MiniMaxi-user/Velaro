'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'
import { markMessageRead, markMessagesRead } from '@/features/berichten/actions'

export interface NotifItem {
  id: string
  subject: string
  createdAt: Date | string
  type: 'stable' | 'horse'
  bron: string
}

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString('nl-NL', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  })
}

function TypeIcon({ type }: { type: 'stable' | 'horse' }) {
  if (type === 'horse') {
    return (
      <span className="notif-type notif-type--horse" title="Paardbericht">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <ellipse cx="10" cy="12" rx="7" ry="4" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M7 12c0-3 1-6 3-6s3 3 3 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
      </span>
    )
  }
  return (
    <span className="notif-type notif-type--stable" title="Stalbericht">
      <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
        <path d="M3 8l6-5 6 5v7H3V8Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        <path d="M7 15v-4h4v4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

export default function NotificationBell({ items, count }: { items: NotifItem[]; count: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  function toggle() {
    setOpen((v) => {
      if (!v) router.refresh()
      return !v
    })
  }

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markMessageRead(id)
      router.refresh()
    })
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markMessagesRead(items.map((i) => i.id))
      router.refresh()
    })
  }

  return (
    <div className={`notif-menu${open ? ' notif-menu--open' : ''}`} ref={menuRef}>
      <button
        type="button"
        className="topbar-icon-btn"
        title="Meldingen"
        aria-label="Meldingen"
        aria-expanded={open}
        onClick={toggle}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 1a5 5 0 0 1 5 5v2.5l1 1.5H2l1-1.5V6a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M6.5 13a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        {count > 0 && <span className="notif-badge">{count > 9 ? '9+' : count}</span>}
      </button>

      <div className="notif-dropdown">
        <div className="notif-dropdown-header">
          <span className="notif-dropdown-title">Meldingen</span>
          {items.length > 0 && (
            <button type="button" className="notif-markall" onClick={handleMarkAll} disabled={pending}>
              Alles gelezen
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <div className="notif-empty">Geen nieuwe berichten.</div>
        ) : (
          <div className="notif-list">
            {items.map((item) => (
              <div key={item.id} className="notif-item">
                <TypeIcon type={item.type} />
                <div className="notif-item__text">
                  <div className="notif-item__subject">{item.subject}</div>
                  <div className="notif-item__meta">{item.bron} · {formatDateTime(item.createdAt)}</div>
                </div>
                <button
                  type="button"
                  className="notif-read-btn"
                  title="Als gelezen markeren"
                  aria-label="Als gelezen markeren"
                  onClick={() => handleMarkRead(item.id)}
                  disabled={pending}
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7.5l3 3 6-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
