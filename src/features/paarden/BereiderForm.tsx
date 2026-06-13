'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface DefaultValues {
  name?: string
  dateOfBirth?: string
  phone?: string
  email?: string
  notes?: string
}

export default function BereiderForm({
  horseId,
  action,
  defaultValues,
}: {
  horseId: string
  action: (formData: FormData) => Promise<{ error: string } | undefined>
  defaultValues?: DefaultValues
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await action(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        router.push(`/paarden/${horseId}?tab=eigenaren`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      {error && <div className="form-feedback form-feedback--error" style={{ marginBottom: 'var(--velaro-space-4)' }}>{error}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Naam *</label>
          <input id="name" name="name" type="text" className="input" required defaultValue={defaultValues?.name} />
        </div>

        <div className="form-group">
          <label htmlFor="dateOfBirth" className="form-label">Geboortedatum</label>
          <input id="dateOfBirth" name="dateOfBirth" type="date" className="input" defaultValue={defaultValues?.dateOfBirth} />
        </div>

        <div className="form-group">
          <label htmlFor="phone" className="form-label">Telefoonnummer</label>
          <input id="phone" name="phone" type="tel" className="input" defaultValue={defaultValues?.phone} />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">E-mailadres</label>
          <input id="email" name="email" type="email" className="input" defaultValue={defaultValues?.email} />
        </div>

        <div className="form-group form-grid--full">
          <label htmlFor="notes" className="form-label">Notities</label>
          <textarea id="notes" name="notes" className="input" rows={3} defaultValue={defaultValues?.notes} />
        </div>
      </div>

      <div className="action-buttons">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? 'Opslaan...' : 'Opslaan'}
        </button>
        <Link href={`/paarden/${horseId}?tab=eigenaren`} className="btn-ghost">Annuleren</Link>
      </div>
    </form>
  )
}
