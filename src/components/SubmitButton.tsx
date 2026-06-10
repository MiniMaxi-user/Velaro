'use client'

import { useFormStatus } from 'react-dom'

interface Props {
  label: string
  loadingLabel?: string
}

export default function SubmitButton({ label, loadingLabel = 'Bezig...' }: Props) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? loadingLabel : label}
    </button>
  )
}
