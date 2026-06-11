import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHorse } from '@/features/paarden/queries'
import { getStableRole } from '@/lib/auth/authorization'
import { getDierenartsBeezoek } from '@/features/gezondheid/queries'
import { updateDierenartsBeezoek } from '@/features/gezondheid/actions'
import DierenartsBezoekreForm from '@/features/gezondheid/DierenartsBezoekreForm'

interface Props {
  params: Promise<{ id: string; recordId: string }>
}

function toDateInput(d: Date | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : ''
}

export default async function DierenartsBeezoekBewerkenPage({ params }: Props) {
  const { id, recordId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [horse, record] = await Promise.all([getHorse(id), getDierenartsBeezoek(recordId)])
  if (!horse || !record || record.horseId !== id) notFound()

  const role = await getStableRole(user.id, horse.stableId)
  if (!role) notFound()

  const action = updateDierenartsBeezoek.bind(null, recordId, id)

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href={`/paarden/${id}`} className="btn-ghost">← {horse.name}</Link>
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
        <div className="label">Dierenartsbeezoek bewerken</div>
        <h1 className="page-title">{horse.name}</h1>
      </div>

      <DierenartsBezoekreForm
        horseId={id}
        action={action}
        defaultValues={{
          date: toDateInput(record.date),
          vet: record.vet ?? '',
          reason: record.reason,
          notes: record.notes ?? '',
        }}
      />
    </main>
  )
}
