import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

const authorSelect = { select: { name: true, email: true } }

/** Berichten van één stal (stalberichten), nieuwste eerst. */
export async function getMessagesForStable(stableId: string, limit = 20) {
  return prisma.message.findMany({
    where: { stableId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { author: authorSelect },
  })
}

/** Berichten van één paard (paardberichten), nieuwste eerst. */
export async function getMessagesForHorse(horseId: string, limit = 20) {
  return prisma.message.findMany({
    where: { horseId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { author: authorSelect },
  })
}

/**
 * Alle berichten die relevant zijn voor de profielpagina van één paard:
 * de paardberichten plus de stalberichten van de stal waar het paard staat.
 * Gebruikt op de eigenaar-startpagina (alleen-lezen).
 */
export async function getMessagesForHorseView(horseId: string, limit = 10) {
  const horse = await prisma.horse.findUnique({
    where: { id: horseId },
    select: { stableId: true },
  })
  if (!horse) return []
  return prisma.message.findMany({
    where: { OR: [{ horseId }, { stableId: horse.stableId }] },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { author: authorSelect },
  })
}

/** Ongelezen berichten (paard- én stalberichten) voor één paard, voor deze gebruiker. */
export async function getUnreadCountForHorseView(userId: string, horseId: string) {
  const horse = await prisma.horse.findUnique({
    where: { id: horseId },
    select: { stableId: true },
  })
  if (!horse) return 0
  return prisma.message.count({
    where: {
      OR: [{ horseId }, { stableId: horse.stableId }],
      authorId: { not: userId },
      reads: { none: { userId } },
    },
  })
}

/**
 * Bouwt het zichtbaarheidsfilter voor één gebruiker:
 *  - stalberichten van stallen waar hij lid van is, of waar hij een paard bezit
 *  - paardberichten van paarden die hij bezit, of die in zijn stal(len) staan
 */
async function visibleMessagesWhere(userId: string): Promise<Prisma.MessageWhereInput> {
  const [memberships, ownerships] = await Promise.all([
    prisma.stableMember.findMany({ where: { userId }, select: { stableId: true } }),
    prisma.horseOwner.findMany({
      where: { userId },
      select: { horseId: true, horse: { select: { stableId: true } } },
    }),
  ])

  const memberStableIds = memberships.map((m) => m.stableId)
  const ownedHorseIds = ownerships.map((o) => o.horseId)
  const ownedHorseStableIds = ownerships.map((o) => o.horse.stableId)
  const stableIds = [...new Set([...memberStableIds, ...ownedHorseStableIds])]

  const conditions: Prisma.MessageWhereInput[] = []
  if (stableIds.length) conditions.push({ stableId: { in: stableIds } })
  if (ownedHorseIds.length) conditions.push({ horseId: { in: ownedHorseIds } })
  if (memberStableIds.length) conditions.push({ horse: { stableId: { in: memberStableIds } } })

  // Geen toegang tot iets → match niets.
  if (conditions.length === 0) return { id: { in: [] } }
  return { OR: conditions }
}

/**
 * Meldingen voor de topbar-bel: de ongelezen, zichtbare berichten van anderen,
 * met het type-doel (stal/paard) en het onderwerp. Plus de totale teller.
 */
export async function getNotificationsForUser(userId: string, limit = 15) {
  const visible = await visibleMessagesWhere(userId)
  const where: Prisma.MessageWhereInput = {
    AND: [visible, { authorId: { not: userId } }, { reads: { none: { userId } } }],
  }

  const [items, count] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        author: authorSelect,
        stable: { select: { name: true } },
        horse: { select: { name: true } },
      },
    }),
    prisma.message.count({ where }),
  ])

  return { items, count }
}
