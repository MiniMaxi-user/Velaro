import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getAuthUser } from '@/lib/auth/session'
import { getHorse } from '@/features/paarden/queries'
import { getStableRole } from '@/lib/auth/authorization'
import { prisma } from '@/lib/prisma'
import { updateHorseRider } from '@/features/paarden/actions'
import { formatDateForInput } from '@/features/paarden/paardHelpers'
import BereiderForm from '@/features/paarden/BereiderForm'

interface Props {
  params: Promise<{ id: string; riderId: string }>
}

export default async function BereiderBewerkenPage({ params }: Props) {
  const { id, riderId } = await params

  const user = await getAuthUser()
  if (!user) redirect('/login')

  const [horse, rider] = await Promise.all([
    getHorse(id),
    prisma.horseRider.findUnique({ where: { id: riderId } }),
  ])
  if (!horse || !rider || rider.horseId !== id) notFound()

  const role = await getStableRole(user.id, horse.stableId)
  if (!role) notFound()

  const action = updateHorseRider.bind(null, id, riderId)

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href={`/paarden/${id}?tab=eigenaren`} className="btn-ghost">← {horse.name}</Link>
      </div>

      <div style={{ marginBottom: 'var(--velaro-space-8)' }}>
        <div className="label">Bereider bewerken</div>
        <h1 className="page-title">{horse.name}</h1>
      </div>

      <BereiderForm
        horseId={id}
        action={action}
        defaultValues={{
          name: rider.name,
          dateOfBirth: formatDateForInput(rider.dateOfBirth),
          phone: rider.phone ?? '',
          email: rider.email ?? '',
          notes: rider.notes ?? '',
        }}
      />
    </main>
  )
}
