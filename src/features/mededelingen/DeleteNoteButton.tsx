'use client'

import { useTransition } from 'react'
import { deleteNote } from './actions'

export default function DeleteNoteButton({ id, horseId }: { id: string; horseId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Mededeling verwijderen?')) return
    startTransition(async () => {
      await deleteNote(id, horseId)
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="btn-danger btn-danger--sm">
      {isPending ? '...' : 'Verwijder'}
    </button>
  )
}
