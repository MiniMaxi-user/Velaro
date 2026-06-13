import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { getHorse } from '@/features/paarden/queries'
import { getStableRole } from '@/lib/auth/authorization'
import PersoonAanmakenForm from '@/features/paarden/PersoonAanmakenForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PersoonNieuwPage({ params }: Props) {
  const { id } = await params

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const horse = await getHorse(id)
  if (!horse) notFound()

  const role = await getStableRole(user.id, horse.stableId)
  if (!role) notFound()

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href={`/paarden/${id}?tab=eigenaren`} className="btn-ghost">← {horse.name}</Link>
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
        <div className="label">Persoon toevoegen</div>
        <h1 className="page-title">{horse.name}</h1>
        <p style={{ color: 'var(--velaro-color-muted)', fontSize: 'var(--velaro-text-sm)', marginTop: 4 }}>
          Maak een account aan voor een eigenaar en/of bereider. Ze kunnen daarna inloggen met dit
          e-mailadres en wachtwoord, en krijgen leestoegang tot dit paardprofiel.
        </p>
      </div>

      <PersoonAanmakenForm horseId={id} />
    </main>
  )
}
