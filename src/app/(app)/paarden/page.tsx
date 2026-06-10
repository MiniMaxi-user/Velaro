import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserStable, getHorsesForStable } from '@/features/paarden/queries'
import PaardKaart from '@/features/paarden/PaardKaart'

export default async function PaardenPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stable = await getUserStable(user.id)

  if (!stable) {
    return (
      <main className="page-container">
        <div className="empty-state">
          <div className="empty-state__title">Geen stal gevonden</div>
          <p>Je bent nog niet aan een stal gekoppeld. Neem contact op met de beheerder.</p>
        </div>
      </main>
    )
  }

  const horses = await getHorsesForStable(stable.id)

  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <em>Paarden</em>
        </h1>
        <Link href="/paarden/nieuw" className="btn-primary">
          + Nieuw paard
        </Link>
      </div>

      {horses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">Nog geen paarden</div>
          <p>Voeg het eerste paard toe aan {stable.name}.</p>
        </div>
      ) : (
        <div className="paarden-grid">
          {horses.map((horse) => (
            <PaardKaart key={horse.id} horse={horse} />
          ))}
        </div>
      )}
    </main>
  )
}
