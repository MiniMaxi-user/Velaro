'use client'

import { useState, useTransition } from 'react'
import { removeMember } from './actions'

interface Props {
  memberId: string
  naam: string
}

export default function LidVerwijderenButton({ memberId, naam }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRemove() {
    if (!confirm(`Weet je zeker dat je ${naam} wilt verwijderen uit de stal?`)) return
    setError(null)
    startTransition(async () => {
      const result = await removeMember(memberId)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <>
      {error && <span className="rol-error">{error}</span>}
      <button onClick={handleRemove} disabled={isPending} className="btn-danger btn-danger--sm">
        {isPending ? '...' : 'Verwijderen'}
      </button>
    </>
  )
}
