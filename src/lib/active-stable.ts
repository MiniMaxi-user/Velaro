import { cache } from 'react'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { ALLE_STALLEN, ACTIVE_STABLE_COOKIE } from '@/lib/stable-constants'

export { ALLE_STALLEN }

const COOKIE_NAME = ACTIVE_STABLE_COOKIE

export const getActiveStableId = cache(async (userId: string): Promise<string | null> => {
  const cookieStore = await cookies()
  const cookieStableId = cookieStore.get(COOKIE_NAME)?.value

  // Schildwacht-waarde: de gebruiker wil data van alle stallen zien
  if (cookieStableId === ALLE_STALLEN) return ALLE_STALLEN

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
})

export async function getActiveStable(userId: string) {
  const stableId = await getActiveStableId(userId)
  // Schildwacht-waarde geeft geen specifieke stal terug
  if (!stableId || stableId === ALLE_STALLEN) return null
  return prisma.stable.findUnique({ where: { id: stableId } })
}

export function activeStableCookieName() {
  return COOKIE_NAME
}
