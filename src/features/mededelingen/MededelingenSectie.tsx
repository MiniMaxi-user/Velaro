'use client'

import { useRef } from 'react'
import { createNote } from './actions'
import DeleteNoteButton from './DeleteNoteButton'
import SubmitButton from '@/components/SubmitButton'

interface Note {
  id: string
  message: string
  createdAt: Date
  authorId: string
  author: { name: string | null; email: string }
}

interface Props {
  horseId: string
  notes: Note[]
  canCreate: boolean
  userId: string
  isOwner: boolean
}

function formatDateTime(d: Date) {
  return new Date(d).toLocaleString('nl-NL', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MededelingenSectie({ horseId, notes, canCreate, userId, isOwner }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const action = createNote.bind(null, horseId)

  async function handleAction(formData: FormData) {
    await action(formData)
    formRef.current?.reset()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {canCreate && (
        <form ref={formRef} action={handleAction}>
          <div className="form-group" style={{ marginBottom: 8 }}>
            <textarea
              name="message"
              className="input"
              rows={2}
              placeholder="Voeg een mededeling toe…"
              required
            />
          </div>
          <SubmitButton label="Plaatsen" />
        </form>
      )}

      {notes.length === 0 ? (
        <div className="gezondheid-leeg">Nog geen mededelingen.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notes.map((n) => {
            const canDelete = isOwner || n.authorId === userId
            const authorLabel = n.author.name ?? n.author.email
            return (
              <div key={n.id} className="note-item">
                <div className="note-item__header">
                  <span className="note-item__author">{authorLabel}</span>
                  <span className="note-item__date">{formatDateTime(n.createdAt)}</span>
                  {canDelete && <DeleteNoteButton id={n.id} horseId={horseId} />}
                </div>
                <div className="note-item__message">{n.message}</div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
