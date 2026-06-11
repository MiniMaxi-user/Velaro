import { prisma } from '@/lib/prisma'
import type { StableRole } from '@prisma/client'

export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPlatformAdmin: true },
  })
  return user?.isPlatformAdmin ?? false
}

export async function canCreateStable(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPlatformAdmin: true, maxStables: true },
  })
  if (!user) return false
  if (user.isPlatformAdmin) return true

  const currentCount = await prisma.stableMember.count({
    where: { userId, role: 'OWNER' },
  })
  return currentCount < user.maxStables
}

export async function getStableRole(
  userId: string,
  stableId: string
): Promise<StableRole | null> {
  const member = await prisma.stableMember.findUnique({
    where: { stableId_userId: { stableId, userId } },
    select: { role: true },
  })
  return member?.role ?? null
}

export async function isStableMember(
  userId: string,
  stableId: string
): Promise<boolean> {
  const role = await getStableRole(userId, stableId)
  return role !== null
}

export async function isAnyStableMember(userId: string): Promise<boolean> {
  const count = await prisma.stableMember.count({ where: { userId } })
  return count > 0
}

export async function canViewHorse(
  userId: string,
  horseId: string
): Promise<boolean> {
  const horse = await prisma.horse.findUnique({
    where: { id: horseId },
    select: { stableId: true },
  })
  if (!horse) return false

  const [member, owner] = await Promise.all([
    isStableMember(userId, horse.stableId),
    prisma.horseOwner.findUnique({
      where: { horseId_userId: { horseId, userId } },
    }),
  ])

  return member || owner !== null
}
