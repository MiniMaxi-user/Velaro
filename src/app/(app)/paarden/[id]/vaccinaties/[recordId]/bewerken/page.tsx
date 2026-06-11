import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHorse } from '@/features/paarden/queries'
import { getStableRole } from '@/lib/auth/authorization'
import { getVaccinatie } from '@/features/gezondheid/queries'
import { updateVaccinatie } from '@/features/gezondheid/actions'
import VaccinatieForm from '@/features/gezondheid/VaccinatieForm'

interface Props {
  params: Promise<{ id: string; recordId: string }>
}

function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : ''
}

export default async function VaccinatieBewerkenPage({ params }: Props) {
  const { id, recordId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [horse, record] = await Promise.all([getHorse(id), getVaccinatie(recordId)])
  if (!horse || !record || record.horseId !== id) notFound()

  const role = await getStableRole(user.id, horse.stableId)
  if (!role) notFound()

  const action = updateVaccinatie.bind(null, recordId, id)

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href={`/paarden/${id}`} className="btn-ghost">← {horse.name}</Link>
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
        <div className="label">Vaccinatie bewerken</div>
        <h1 className="page-title">{horse.name}</h1>
      </div>

      <VaccinatieForm
        horseId={id}
        action={action}
        defaultValues={{
          date: toDateInput(record.date),
          type: record.type,
          nextDate: toDateInput(record.nextDate),
          notes: record.notes ?? '',
        }}
      />
    </main>
  )
}
