import { prisma } from '@/lib/prisma'

export async function getNotesForHorse(horseId: string) {
  return prisma.stableNote.findMany({
    where: { horseId },
    orderBy: { createdAt: 'desc' },
    include: {
      author: { select: { name: true, email: true } },
    },
  })
}
