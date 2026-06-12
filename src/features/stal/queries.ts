import { prisma } from '@/lib/prisma'

export async function getStableWithMembers(stableId: string) {
  return prisma.stable.findUnique({
    where: { id: stableId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

export interface Paardeigenaar {
  id: string
  name: string | null
  email: string
  horses: string[]
}

/**
 * Geeft de unieke paardeneigenaren van een stal terug, met de namen van de
 * paarden die zij in deze stal hebben. Gesorteerd op naam.
 */
export async function getHorseOwnersForStable(stableId: string): Promise<Paardeigenaar[]> {
  return getHorseOwnersForStables([stableId])
}

/**
 * Zelfde als getHorseOwnersForStable, maar voor meerdere stallen tegelijk
 * (modus 'Alle stallen'). Paardnamen van dezelfde eigenaar worden samengevoegd.
 */
export async function getHorseOwnersForStables(stableIds: string[]): Promise<Paardeigenaar[]> {
  if (stableIds.length === 0) return []
  const ownerships = await prisma.horseOwner.findMany({
    where: { horse: { stableId: { in: stableIds } } },
    include: {
      user: { select: { id: true, name: true, email: true } },
      horse: { select: { name: true } },
    },
  })

  const byUser = new Map<string, Paardeigenaar>()
  for (const o of ownerships) {
    const existing = byUser.get(o.user.id)
    if (existing) {
      existing.horses.push(o.horse.name)
    } else {
      byUser.set(o.user.id, {
        id: o.user.id,
        name: o.user.name,
        email: o.user.email,
        horses: [o.horse.name],
      })
    }
  }

  return Array.from(byUser.values()).sort((a, b) =>
    (a.name ?? a.email).localeCompare(b.name ?? b.email, 'nl'),
  )
}
