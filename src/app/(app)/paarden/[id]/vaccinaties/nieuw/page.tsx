import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHorse } from '@/features/paarden/queries'
import { getStableRole } from '@/lib/auth/authorization'
import VaccinatieForm from '@/features/gezondheid/VaccinatieForm'
import { createVaccinatie } from '@/features/gezondheid/actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NieuweVaccinatiePage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const horse = await getHorse(id)
  if (!horse) notFound()

  const role = await getStableRole(user.id, horse.stableId)
  if (!role) notFound()

  const action = createVaccinatie.bind(null, id)

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href={`/paarden/${id}`} className="btn-ghost">← {horse.name}</Link>
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
        <div className="label">Vaccinatie toevoegen</div>
        <h1 className="page-title">{horse.name}</h1>
      </div>

      <VaccinatieForm horseId={id} action={action} />
    </main>
  )
}
