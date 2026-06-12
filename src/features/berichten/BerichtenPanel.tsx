'use client'

import { useRef, useState, useTransition } from 'react'
import { createMessage, type MessageTarget } from './actions'
import BerichtItem, { type BerichtData } from './BerichtItem'

interface Props {
  target: MessageTarget
  title: string
  messages: BerichtData[]
  canManage: boolean
  emptyLabel?: string
}

export default function BerichtenPanel({ target, title, messages, canManage, emptyLabel }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createMessage(target, fd)
      if (result?.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        setOpen(false)
      }
    })
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">{title}</span>
        {canManage && (
          <button
            type="button"
            className="bericht-add-btn"
            onClick={() => { setOpen((v) => !v); setError(null) }}
            aria-expanded={open}
            title={open ? 'Annuleren' : 'Nieuw bericht'}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ transform: open ? 'rotate(45deg)' : 'none', transition: 'transform 0.15s ease' }}>
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            {open ? 'Annuleren' : 'Nieuw bericht'}
          </button>
        )}
      </div>
      <div className="panel-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {canManage && open && (
            <form ref={formRef} className="bericht-form" onSubmit={handleCreate}>
              <input
                name="subject"
                className="input"
                placeholder="Onderwerp"
                required
                autoFocus
              />
              <textarea
                name="body"
                className="input"
                rows={3}
                placeholder="Schrijf een bericht…"
                required
              />
              {error && (
                <div className="form-feedback form-feedback--error">{error}</div>
              )}
              <div>
                <button type="submit" className="btn-primary btn-primary--sm" disabled={pending}>
                  {pending ? 'Bezig…' : 'Plaatsen'}
                </button>
              </div>
            </form>
          )}

          {messages.length === 0 ? (
            <div className="gezondheid-leeg">{emptyLabel ?? 'Nog geen berichten.'}</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map((m) => (
                <BerichtItem key={m.id} message={m} canManage={canManage} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
