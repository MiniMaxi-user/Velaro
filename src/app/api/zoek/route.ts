import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'

export interface ZoekResultaat {
  id: string
  type: 'paard' | 'stal' | 'eigenaar'
  naam: string
  sub?: string
  url: string
}

export async function GET(req: NextRequest) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const q = (searchParams.get('q') ?? '').trim()

  if (q.length < 2) {
    return NextResponse.json({ resultaten: [] })
  }

  // Determine which stables this user can see
  const memberships = await prisma.stableMember.findMany({
    where: { userId: user.id },
    select: { stableId: true, role: true },
  })
  const stableIds = memberships.map((m) => m.stableId)

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isPlatformAdmin: true },
  })
  const isAdmin = dbUser?.isPlatformAdmin ?? false

  const resultaten: ZoekResultaat[] = []

  // ── Paarden ──────────────────────────────────────────────────────────────
  // User sees horses they own, OR horses in their stables, OR all if platform admin
  const horseWhere = isAdmin
    ? { name: { contains: q, mode: 'insensitive' as const } }
    : {
        name: { contains: q, mode: 'insensitive' as const },
        OR: [
          { stableId: { in: stableIds } },
          { owners: { some: { userId: user.id } } },
        ],
      }

  const paarden = await prisma.horse.findMany({
    where: horseWhere,
    select: { id: true, name: true, breed: true, stable: { select: { name: true } } },
    take: 5,
  })

  for (const p of paarden) {
    resultaten.push({
      id: p.id,
      type: 'paard',
      naam: p.name,
      sub: [p.breed, p.stable.name].filter(Boolean).join(' · '),
      url: `/paarden/${p.id}`,
    })
  }

  // ── Stallen ───────────────────────────────────────────────────────────────
  const stalWhere = isAdmin
    ? { name: { contains: q, mode: 'insensitive' as const } }
    : {
        name: { contains: q, mode: 'insensitive' as const },
        id: { in: stableIds },
      }

  const stallen = await prisma.stable.findMany({
    where: stalWhere,
    select: { id: true, name: true, city: true },
    take: 3,
  })

  for (const s of stallen) {
    resultaten.push({
      id: s.id,
      type: 'stal',
      naam: s.name,
      sub: s.city ?? undefined,
      // Open de stal in de view (dashboard), niet in het bewerken-scherm
      url: `/stallen/${s.id}/openen`,
    })
  }

  // ── Eigenaren (users) ─────────────────────────────────────────────────────
  // Only show horse owners that have a horse in one of this user's stables, or all if admin
  const eigenaarWhere = isAdmin
    ? {
        name: { contains: q, mode: 'insensitive' as const },
        horsePeople: { some: { isOwner: true } },
      }
    : {
        name: { contains: q, mode: 'insensitive' as const },
        horsePeople: {
          some: {
            isOwner: true,
            horse: { stableId: { in: stableIds } },
          },
        },
      }

  const eigenaren = await prisma.user.findMany({
    where: eigenaarWhere,
    select: {
      id: true,
      name: true,
      email: true,
      horsePeople: {
        where: { isOwner: true },
        select: { horse: { select: { name: true } } },
        take: 2,
      },
    },
    take: 3,
  })

  for (const e of eigenaren) {
    const horseNames = e.horsePeople.map((o) => o.horse.name).join(', ')
    resultaten.push({
      id: e.id,
      type: 'eigenaar',
      naam: e.name ?? e.email,
      sub: horseNames || e.email,
      // No individual eigenaar detail page yet; link to the overview
      url: isAdmin ? `/admin/eigenaren` : `/stal/leden`,
    })
  }

  return NextResponse.json({ resultaten })
}
