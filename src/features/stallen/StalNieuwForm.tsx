'use client'

import { useActionState } from 'react'
import { createStable } from './actions'
import SubmitButton from '@/components/SubmitButton'

type State = { error?: string }

async function action(prev: State, formData: FormData): Promise<State> {
  try {
    await createStable(formData)
    return {}
  } catch (e) {
    if ((e as { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw e
    return { error: (e as Error).message }
  }
}

export default function StalNieuwForm() {
  const [state, formAction] = useActionState(action, {})

  return (
    <form action={formAction}>
      {state.error && (
        <div className="form-feedback form-feedback--error">{state.error}</div>
      )}

      <div className="form-group">
        <label className="form-label">Stalnaam <span style={{ color: 'var(--velaro-color-amber)' }}>*</span></label>
        <input name="name" type="text" className="input" placeholder="De Groene Weide" required />
      </div>

      <div className="form-row">
        <div className="form-group" style={{ flex: 2 }}>
          <label className="form-label">Adres</label>
          <input name="address" type="text" className="input" placeholder="Stalweg 12" />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">Postcode</label>
          <input name="postalCode" type="text" className="input" placeholder="1234 AB" />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Stad / dorp</label>
        <input name="city" type="text" className="input" placeholder="Amsterdam" />
      </div>

      <div style={{ marginTop: 'var(--velaro-space-6)' }}>
        <SubmitButton label="Stal aanmaken" loadingLabel="Aanmaken…" />
      </div>
    </form>
  )
}
