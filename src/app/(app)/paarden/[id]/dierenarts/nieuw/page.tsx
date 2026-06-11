import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { getHorse } from '@/features/paarden/queries'
import { getStableRole } from '@/lib/auth/authorization'
import DierenartsBezoekreForm from '@/features/gezondheid/DierenartsBezoekreForm'
import { createDierenartsBeezoek } from '@/features/gezondheid/actions'

interface Props {
  params: Promise<{ id: string }>
}

export default async function NieuwDierenartsBezoekrePage({ params }: Props) {
  const { id } = await params

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const horse = await getHorse(id)
  if (!horse) notFound()

  const role = await getStableRole(user.id, horse.stableId)
  if (!role) notFound()

  const action = createDierenartsBeezoek.bind(null, id)

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href={`/paarden/${id}`} className="btn-ghost">← {horse.name}</Link>
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
        <div className="label">Dierenartsbeezoek toevoegen</div>
        <h1 className="page-title">{horse.name}</h1>
      </div>

      <DierenartsBezoekreForm horseId={id} action={action} />
    </main>
  )
}
