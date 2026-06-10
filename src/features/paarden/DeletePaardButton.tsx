'use client'

import { useTransition } from 'react'
import { deleteHorse } from './actions'

export default function DeletePaardButton({ horseId }: { horseId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Weet je zeker dat je dit paard wilt verwijderen? Dit kan niet ongedaan worden gemaakt.')) return
    startTransition(async () => {
      await deleteHorse(horseId)
    })
  }

  return (
    <button onClick={handleDelete} disabled={isPending} className="btn-danger">
      {isPending ? 'Verwijderen...' : 'Verwijderen'}
    </button>
  )
}
