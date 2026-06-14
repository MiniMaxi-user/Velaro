'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  acceptContract,
  getContractPdfUrlVoorEigenaar,
  rejectContract,
} from './actions'

// Besluitknoppen van de paardeigenaar voor een aangeboden stallingscontract
// (STAL-09, #82): "Accepteren" en "Afwijzen". Wordt alleen gerenderd wanneer er een
// contract met status AANGEBODEN voor de eigenaar is (de aanroeper bepaalt dat). De
// daadwerkelijke autorisatie en statusvalidatie gebeuren server-side in de acties;
// deze component verzorgt enkel de interactie en de bevestiging.
export default function EigenaarContractActies({
  contractId,
}: {
  contractId: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleAccept() {
    if (
      !confirm(
        'Het stallingscontract accepteren? Het contract wordt hiermee actief en de stal ontvangt een melding.',
      )
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await acceptContract(contractId)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Accepteren is mislukt.')
      }
    })
  }

  function handleViewPdf() {
    setError(null)
    startTransition(async () => {
      try {
        const url = await getContractPdfUrlVoorEigenaar(contractId)
        if (url) window.open(url, '_blank')
        else setError('Er is nog geen PDF beschikbaar voor dit contract.')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'PDF inzien is mislukt.')
      }
    })
  }

  function handleReject() {
    if (
      !confirm(
        'Het stallingscontract afwijzen? Het aanbod vervalt en de stal ontvangt een melding.',
      )
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await rejectContract(contractId)
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Afwijzen is mislukt.')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-primary btn-primary--sm"
          onClick={handleAccept}
          disabled={pending}
        >
          {pending ? 'Bezig…' : 'Accepteren'}
        </button>
        <button
          type="button"
          className="btn-ghost btn-ghost--sm"
          onClick={handleReject}
          disabled={pending}
        >
          {pending ? 'Bezig…' : 'Afwijzen'}
        </button>
        <button
          type="button"
          className="btn-ghost btn-ghost--sm"
          onClick={handleViewPdf}
          disabled={pending}
        >
          {pending ? 'Bezig…' : 'Contract-PDF inzien'}
        </button>
      </div>
      {error && <span className="form-error">{error}</span>}
    </div>
  )
}
