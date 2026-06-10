import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserStable, getHorsesForStable, getHorsesForOwner } from '@/features/paarden/queries'
import PaardKaart from '@/features/paarden/PaardKaart'

export default async function PaardenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stable = await getUserStable(user.id)

  if (stable) {
    const horses = await getHorsesForStable(stable.id)
    return (
      <main className="page-container">
        <div className="page-header">
          <h1 className="page-title"><em>Paarden</em></h1>
          <Link href="/paarden/nieuw" className="btn-primary">+ Nieuw paard</Link>
        </div>
        {horses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__title">Nog geen paarden</div>
            <p>Voeg het eerste paard toe aan {stable.name}.</p>
          </div>
        ) : (
          <div className="paarden-grid">
            {horses.map((horse) => <PaardKaart key={horse.id} horse={horse} />)}
          </div>
        )}
      </main>
    )
  }

  // Paardeneigenaar zonder stalkoppeling
  const ownedHorses = await getHorsesForOwner(user.id)

  return (
    <main className="page-container">
      <div className="page-header">
        <div>
          <div className="label">Paardeneigenaar</div>
          <h1 className="page-title">Mijn <em>paarden</em></h1>
        </div>
      </div>
      {ownedHorses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state__title">Nog geen paarden gekoppeld</div>
          <p>De beheerder van uw stal koppelt uw paard aan uw account.</p>
        </div>
      ) : (
        <div className="paarden-grid">
          {ownedHorses.map((horse) => <PaardKaart key={horse.id} horse={horse} />)}
        </div>
      )}
    </main>
  )
}
