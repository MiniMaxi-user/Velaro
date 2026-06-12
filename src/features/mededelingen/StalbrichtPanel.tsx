'use client'

import { useRef, useTransition } from 'react'
import { createAnnouncement, deleteAnnouncement } from './actions'
import SubmitButton from '@/components/SubmitButton'

interface Announcement {
  id: string
  message: string
  createdAt: Date
  author: { name: string | null; email: string }
}

interface Props {
  stableId: string
  announcements: Announcement[]
  isOwner: boolean
}

function formatDateTime(d: Date) {
  return new Date(d).toLocaleString('nl-NL', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function DeleteAnnouncementButton({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Stalbericht verwijderen?')) return
    startTransition(async () => {
      await deleteAnnouncement(id)
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="btn-danger btn-danger--sm">
      {isPending ? '...' : 'Verwijder'}
    </button>
  )
}

export default function StalbrichtPanel({ stableId, announcements, isOwner }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const action = createAnnouncement.bind(null, stableId)

  async function handleAction(formData: FormData) {
    await action(formData)
    formRef.current?.reset()
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <span className="panel-title">Stalberichten</span>
      </div>
      <div className="panel-body">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {isOwner && (
            <form ref={formRef} action={handleAction}>
              <div className="form-group" style={{ marginBottom: 8 }}>
                <textarea
                  name="message"
                  className="input"
                  rows={2}
                  placeholder="Stuur een bericht aan alle paardeneigenaren…"
                  required
                />
              </div>
              <SubmitButton label="Plaatsen" />
            </form>
          )}

          {announcements.length === 0 ? (
            <div className="gezondheid-leeg">Nog geen stalberichten.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {announcements.map((a) => (
                <div key={a.id} className="note-item">
                  <div className="note-item__header">
                    <span className="note-item__author">{a.author.name ?? a.author.email}</span>
                    <span className="note-item__date">{formatDateTime(a.createdAt)}</span>
                    {isOwner && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <DeleteAnnouncementButton id={a.id} />
                      </div>
                    )}
                  </div>
                  <div className="note-item__message">{a.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
