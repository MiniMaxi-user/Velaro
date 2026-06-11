import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { getStableById } from '@/features/stallen/queries'
import { prisma } from '@/lib/prisma'
import StalBewerkenForm from '@/features/stallen/StalBewerkenForm'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StalBewerkenPage({ params }: Props) {
  const { id } = await params

  const user = await getAuthUser()
  if (!user) redirect('/login')

  // Alleen de OWNER van deze stal mag de pagina openen
  const member = await prisma.stableMember.findUnique({
    where: { stableId_userId: { stableId: id, userId: user.id } },
  })
  if (!member || member.role !== 'OWNER') redirect('/stallen')

  const stable = await getStableById(id)
  if (!stable) notFound()

  return (
    <main className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link href="/stallen">Mijn stallen</Link>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">{stable.name}</span>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Bewerken</span>
          </div>
          <h1 className="page-title"><em>{stable.name}</em> bewerken</h1>
        </div>
        <Link href="/stallen" className="btn-ghost">← Terug</Link>
      </div>

      <div className="form-card" style={{ maxWidth: 600 }}>
        <StalBewerkenForm stable={stable} />
      </div>
    </main>
  )
}
