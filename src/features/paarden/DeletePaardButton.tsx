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
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="btn-danger"
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: isPending ? 0.5 : 1 }}>
        <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.7 7h6.6L11 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {isPending ? 'Verwijderen…' : 'Verwijderen'}
    </button>
  )
}
