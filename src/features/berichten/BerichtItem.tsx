'use client'

import { useState, useTransition } from 'react'
import { deleteMessage, updateMessage } from './actions'

export interface BerichtData {
  id: string
  subject: string
  body: string
  createdAt: Date | string
  author: { name: string | null; email: string }
}

function formatDateTime(d: Date | string) {
  return new Date(d).toLocaleString('nl-NL', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function BerichtItem({ message, canManage }: { message: BerichtData; canManage: boolean }) {
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const authorLabel = message.author.name ?? message.author.email

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateMessage(message.id, fd)
      if (result?.error) setError(result.error)
      else setEditing(false)
    })
  }

  function handleDelete() {
    if (!confirm('Bericht verwijderen?')) return
    startTransition(async () => {
      await deleteMessage(message.id)
    })
  }

  if (editing) {
    return (
      <form className="bericht-item bericht-item--editing" onSubmit={handleUpdate}>
        <input
          name="subject"
          className="input"
          defaultValue={message.subject}
          placeholder="Onderwerp"
          required
          autoFocus
        />
        <textarea
          name="body"
          className="input"
          rows={3}
          defaultValue={message.body}
          placeholder="Bericht"
          required
        />
        {error && (
          <div className="form-feedback form-feedback--error">{error}</div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="btn-primary btn-primary--sm" disabled={pending}>
            {pending ? '…' : 'Opslaan'}
          </button>
          <button
            type="button"
            className="btn-ghost btn-ghost--sm"
            onClick={() => { setEditing(false); setError(null) }}
          >
            Annuleren
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="bericht-item">
      <div className="bericht-item__top">
        <span className="bericht-item__subject">{message.subject}</span>
        {canManage && (
          <div className="bericht-item__acties">
            <button
              type="button"
              className="bericht-icon-btn"
              title="Bewerken"
              aria-label="Bewerken"
              onClick={() => { setEditing(true); setError(null) }}
              disabled={pending}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              className="bericht-icon-btn bericht-icon-btn--danger"
              title="Verwijderen"
              aria-label="Verwijderen"
              onClick={handleDelete}
              disabled={pending}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 4h9M5.5 4V2.5h3V4M3.5 4l.5 7.5h6l.5-7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>
      <div className="bericht-item__meta">
        <span className="bericht-item__author">{authorLabel}</span>
        <span className="bericht-item__date">{formatDateTime(message.createdAt)}</span>
      </div>
      <div className="bericht-item__body">{message.body}</div>
    </div>
  )
}
