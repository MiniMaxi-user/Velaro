'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { createAndLinkPerson } from './actions'
import SubmitButton from '@/components/SubmitButton'

type State = { error?: string }

export default function PersoonAanmakenForm({ horseId }: { horseId: string }) {
  const action = createAndLinkPerson.bind(null, horseId)

  async function formAction(prev: State, formData: FormData): Promise<State> {
    const result = await action(formData)
    return result ? { error: result.error } : {}
  }

  const [state, dispatch] = useActionState(formAction, {})

  return (
    <form action={dispatch} className="form-card">
      {state.error && (
        <div className="form-feedback form-feedback--error">{state.error}</div>
      )}

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="name" className="form-label">Naam</label>
          <input id="name" name="name" type="text" className="input" placeholder="Jan de Vries" />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">E-mailadres *</label>
          <input id="email" name="email" type="email" className="input" placeholder="jan@voorbeeld.nl" required />
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">Tijdelijk wachtwoord *</label>
          <input id="password" name="password" type="password" className="input" placeholder="Minimaal 8 tekens" required minLength={8} />
          <div className="form-hint">De persoon kan dit later zelf wijzigen.</div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Rollen *</label>
        <div style={{ display: 'flex', gap: 20, marginTop: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input name="isOwner" type="checkbox" value="true" defaultChecked />
            Eigenaar
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input name="isRider" type="checkbox" value="true" />
            Bereider
          </label>
        </div>
        <div className="form-hint">Kies minstens één rol. Een persoon kan beide rollen tegelijk vervullen.</div>
      </div>

      <div className="action-buttons">
        <SubmitButton label="Account aanmaken en koppelen" loadingLabel="Bezig..." />
        <Link href={`/paarden/${horseId}`} className="btn-ghost">Annuleren</Link>
      </div>
    </form>
  )
}
