'use client'

import { useRouter } from 'next/navigation'

export default function TaakDatumKiezer({ value }: { value: string }) {
  const router = useRouter()
  return (
    <input
      type="date"
      className="input taken-datumkiezer"
      value={value}
      onChange={(e) => {
        if (e.target.value) router.push(`/stal/taken?datum=${e.target.value}`)
      }}
    />
  )
}
