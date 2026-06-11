'use client'

import Link from 'next/link'
import SubmitButton from '@/components/SubmitButton'

interface DefaultValues {
  date?: string
  vet?: string
  reason?: string
  notes?: string
}

export default function DierenartsBezoekreForm({
  horseId,
  action,
  defaultValues,
}: {
  horseId: string
  action: (formData: FormData) => Promise<void>
  defaultValues?: DefaultValues
}) {
  return (
    <form action={action} className="form-card">
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="date" className="form-label">Datum *</label>
          <input id="date" name="date" type="date" className="input" required defaultValue={defaultValues?.date} />
        </div>

        <div className="form-group">
          <label htmlFor="vet" className="form-label">Dierenarts</label>
          <input
            id="vet"
            name="vet"
            type="text"
            className="input"
            placeholder="bv. Dr. Janssen"
            defaultValue={defaultValues?.vet}
          />
        </div>

        <div className="form-group form-grid--full">
          <label htmlFor="reason" className="form-label">Reden *</label>
          <input
            id="reason"
            name="reason"
            type="text"
            className="input"
            placeholder="bv. Kreupelheidsonderzoek"
            required
            defaultValue={defaultValues?.reason}
          />
        </div>

        <div className="form-group form-grid--full">
          <label htmlFor="notes" className="form-label">Behandeling / notities</label>
          <textarea id="notes" name="notes" className="input" rows={3} defaultValue={defaultValues?.notes} />
        </div>
      </div>

      <div className="action-buttons">
        <SubmitButton label="Opslaan" />
        <Link href={`/paarden/${horseId}`} className="btn-ghost">Annuleren</Link>
      </div>
    </form>
  )
}
