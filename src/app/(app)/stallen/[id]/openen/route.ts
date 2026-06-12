import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAuthUser } from '@/lib/auth/session'
import { prisma } from '@/lib/prisma'
import { ACTIVE_STABLE_COOKIE } from '@/lib/stable-constants'

/**
 * Opent een stal vanuit de zoekbalk: zet de gekozen stal als actieve stal
 * en stuurt door naar het stal-dashboard (view), niet naar het bewerken-scherm.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', _req.url))
  }

  const { id } = await params

  // Alleen leden van de stal mogen deze openen
  const member = await prisma.stableMember.findUnique({
    where: { stableId_userId: { stableId: id, userId: user.id } },
  })
  if (!member) {
    return NextResponse.redirect(new URL('/stallen', _req.url))
  }

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_STABLE_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })

  return NextResponse.redirect(new URL('/stal', _req.url))
}
