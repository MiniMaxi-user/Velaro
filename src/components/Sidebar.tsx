import { getAuthUser, getDbUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { getActiveStableId } from '@/lib/active-stable'
import SidebarClient from './SidebarClient'

const ROL_LABELS: Record<string, string> = {
  OWNER: 'Staleigenaar',
  STAFF: 'Stalmedewerker',
}

export default async function Sidebar() {
  const user = await getAuthUser()

  if (!user) return null

  const [dbUser, memberships, activeStableId] = await Promise.all([
    getDbUser(user.id),
    prisma.stableMember.findMany({
      where: { userId: user.id },
      include: { stable: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    getActiveStableId(user.id),
  ])

  const isStableMember = memberships.length > 0
  const isPlatformAdmin = dbUser?.isPlatformAdmin ?? false
  const canManageStables = isPlatformAdmin || (dbUser?.maxStables ?? 0) > 0

  const activeMembership = memberships.find((m) => m.stableId === activeStableId)
  let rolLabel = isPlatformAdmin
    ? 'Platform Admin'
    : activeMembership
    ? (ROL_LABELS[activeMembership.role] ?? activeMembership.role)
    : 'Paardeneigenaar'

  const stables = memberships.map((m) => m.stable)

  return (
    <SidebarClient
      isStableMember={isStableMember}
      isPlatformAdmin={isPlatformAdmin}
      canManageStables={canManageStables}
      userEmail={user.email}
      userRole={rolLabel}
      stables={stables}
      activeStableId={activeStableId}
    />
  )
}
