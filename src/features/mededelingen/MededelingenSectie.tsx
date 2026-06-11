'use client'

import { useRef, useState, useTransition } from 'react'
import { createNote, deleteNote, updateNote } from './actions'
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

  const [editId, setEditId] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const [saving, startSave] = useTransition()

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
            const canEdit = n.authorId === userId
            const authorLabel = n.author.name ?? n.author.email
            return (
              <div key={n.id} className="note-item">
                <div className="note-item__header">
                  <span className="note-item__author">{authorLabel}</span>
                  <span className="note-item__date">{formatDateTime(n.createdAt)}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {canEdit && editId !== n.id && (
                      <button
                        type="button"
                        className="btn-ghost btn-ghost--sm"
                        onClick={() => { setEditId(n.id); setEditError(null) }}
                      >
                        Bewerken
                      </button>
                    )}
                    {canDelete && <DeleteNoteButton id={n.id} horseId={horseId} />}
                  </div>
                </div>

                {editId === n.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      setEditError(null)
                      const fd = new FormData(e.currentTarget)
                      startSave(async () => {
                        const result = await updateNote(n.id, horseId, fd)
                        if (result?.error) {
                          setEditError(result.error)
                        } else {
                          setEditId(null)
                        }
                      })
                    }}
                  >
                    <textarea
                      name="message"
                      className="input"
                      rows={2}
                      defaultValue={n.message}
                      required
                      autoFocus
                    />
                    {editError && (
                      <div className="form-feedback form-feedback--error" style={{ marginTop: 6 }}>
                        {editError}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                      <button type="submit" className="btn-primary btn-primary--sm" disabled={saving}>
                        {saving ? '…' : 'Opslaan'}
                      </button>
                      <button
                        type="button"
                        className="btn-ghost btn-ghost--sm"
                        onClick={() => { setEditId(null); setEditError(null) }}
                      >
                        Annuleren
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="note-item__message">{n.message}</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
