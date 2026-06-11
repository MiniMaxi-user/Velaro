import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'

const COOKIE_NAME = 'velaro-active-stable'

export async function getActiveStableId(userId: string): Promise<string | null> {
  const cookieStore = await cookies()
  const cookieStableId = cookieStore.get(COOKIE_NAME)?.value

  if (cookieStableId) {
    const member = await prisma.stableMember.findUnique({
      where: { stableId_userId: { stableId: cookieStableId, userId } },
    })
    if (member) return cookieStableId
  }

  const member = await prisma.stableMember.findFirst({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })
  return member?.stableId ?? null
}

export async function getActiveStable(userId: string) {
  const stableId = await getActiveStableId(userId)
  if (!stableId) return null
  return prisma.stable.findUnique({ where: { id: stableId } })
}

export function activeStableCookieName() {
  return COOKIE_NAME
}
