import { prisma } from '@/lib/prisma'
import { getActiveStable } from '@/lib/active-stable'

export async function getHorsesForOwner(userId: string) {
  // Paarden waaraan de gebruiker als eigenaar én/of bereider gekoppeld is.
  const links = await prisma.horsePerson.findMany({
    where: { userId },
    include: { horse: true },
    orderBy: { createdAt: 'asc' },
  })
  return links.map((l) => l.horse)
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

export async function getFeedingPlan(horseId: string) {
  return prisma.feedingPlan.findUnique({ where: { horseId } })
}

export async function getHorse(id: string) {
  return prisma.horse.findUnique({
    where: { id },
    include: {
      people: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
      stable: {
        select: {
          id: true,
          name: true,
          address: true,
          postalCode: true,
          city: true,
          phone: true,
          email: true,
          website: true,
          description: true,
          openingHours: true,
        },
      },
    },
  })
}
