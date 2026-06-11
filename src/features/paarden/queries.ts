import { prisma } from '@/lib/prisma'
import { getActiveStable } from '@/lib/active-stable'

export async function getHorsesForOwner(userId: string) {
  const ownerships = await prisma.horseOwner.findMany({
    where: { userId },
    include: { horse: true },
    orderBy: { createdAt: 'asc' },
  })
  return ownerships.map((o) => o.horse)
}

export async function getUserStable(userId: string) {
  return getActiveStable(userId)
}

export async function getHorsesForStable(stableId: string) {
  return prisma.horse.findMany({
    where: { stableId },
    orderBy: { name: 'asc' },
  })
}

export async function getHorse(id: string) {
  return prisma.horse.findUnique({
    where: { id },
    include: {
      owners: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })
}
