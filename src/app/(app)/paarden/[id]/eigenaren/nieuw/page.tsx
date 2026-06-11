import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getHorse } from '@/features/paarden/queries'
import { getStableRole } from '@/lib/auth/authorization'
import EigenaarAanmakenForm from '@/features/paarden/EigenaarAanmakenForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EigenaarNieuwPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const horse = await getHorse(id)
  if (!horse) notFound()

  const role = await getStableRole(user.id, horse.stableId)
  if (!role) notFound()

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href={`/paarden/${id}`} className="btn-ghost">← {horse.name}</Link>
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
        <div className="label">Eigenaar toevoegen</div>
        <h1 className="page-title">{horse.name}</h1>
        <p style={{ color: 'var(--velaro-color-muted)', fontSize: 'var(--velaro-text-sm)', marginTop: 4 }}>
          Maak een account aan voor de eigenaar. Ze kunnen daarna inloggen met dit e-mailadres en wachtwoord.
        </p>
      </div>

      <EigenaarAanmakenForm horseId={id} />
    </main>
  )
}
