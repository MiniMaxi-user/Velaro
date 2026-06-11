'use client'

import { useActionState } from 'react'
import { createOwnerAccount } from './actions'
import SubmitButton from '@/components/SubmitButton'

type State = { error?: string }

async function action(prev: State, formData: FormData): Promise<State> {
  try {
    await createOwnerAccount(formData)
    return {}
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw e
    return { error: (e as Error).message }
  }
}

export default function EigenaarNieuwForm() {
  const [state, formAction] = useActionState(action, {})

  return (
    <form action={formAction}>
      {state.error && (
        <div className="form-feedback form-feedback--error">{state.error}</div>
      )}

      <div className="form-group">
        <label className="form-label">Naam</label>
        <input name="name" type="text" className="input" placeholder="Jan de Vries" />
      </div>

      <div className="form-group">
        <label className="form-label">E-mailadres <span style={{ color: 'var(--velaro-color-amber)' }}>*</span></label>
        <input name="email" type="email" className="input" placeholder="jan@voorbeeld.nl" required />
      </div>

      <div className="form-group">
        <label className="form-label">Initieel wachtwoord <span style={{ color: 'var(--velaro-color-amber)' }}>*</span></label>
        <input name="password" type="password" className="input" placeholder="Minimaal 8 tekens" required minLength={8} />
      </div>

      <div className="form-group">
        <label className="form-label">Maximaal aantal stallen</label>
        <input name="maxStables" type="number" className="input" defaultValue={1} min={0} max={100} />
        <div className="form-hint">Hoeveel stallen deze eigenaar zelf mag aanmaken</div>
      </div>

      <div style={{ marginTop: 'var(--velaro-space-6)' }}>
        <SubmitButton label="Account aanmaken" loadingLabel="Bezig..." />
      </div>
    </form>
  )
}
