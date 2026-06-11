import { prisma } from '@/lib/prisma'

export async function getNotesForHorse(horseId: string, limit = 20) {
  return prisma.stableNote.findMany({
    where: { horseId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      author: { select: { name: true, email: true } },
    },
  })
}
