import { createClient } from '@/lib/supabase/server'
import { isAnyStableMember } from '@/lib/auth/authorization'
import { prisma } from '@/lib/prisma'
import SidebarClient from './SidebarClient'

const ROL_LABELS: Record<string, string> = {
  OWNER: 'Staleigenaar',
  STAFF: 'Stalmedewerker',
}

export default async function Sidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const stableMember = await isAnyStableMember(user.id)

  let rolLabel = 'Paardeneigenaar'
  if (stableMember) {
    const membership = await prisma.stableMember.findFirst({
      where: { userId: user.id },
      select: { role: true },
    })
    if (membership) {
      rolLabel = ROL_LABELS[membership.role] ?? membership.role
    }
  }

  return (
    <SidebarClient
      isStableMember={stableMember}
      userEmail={user.email}
      userRole={rolLabel}
    />
  )
}
