'use client'

import { useActionState } from 'react'
import { updateStableQuota } from './actions'

type State = { error?: string; success?: boolean }

export default function QuotumForm({ userId, currentMax }: { userId: string; currentMax: number }) {
  const boundAction = updateStableQuota.bind(null, userId)

  async function action(prev: State, formData: FormData): Promise<State> {
    try {
      await boundAction(formData)
      return { success: true }
    } catch (e) {
      return { error: (e as Error).message }
    }
  }

  const [state, formAction] = useActionState(action, {})

  return (
    <form action={formAction} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        name="maxStables"
        type="number"
        defaultValue={currentMax}
        min={0}
        max={100}
        className="input"
        style={{ width: 70 }}
      />
      <button type="submit" className="btn-ghost" style={{ padding: '6px 12px', fontSize: 13 }}>
        {state.success ? '✓' : 'Opslaan'}
      </button>
      {state.error && <span style={{ color: 'var(--velaro-color-amber)', fontSize: 13 }}>{state.error}</span>}
    </form>
  )
}
