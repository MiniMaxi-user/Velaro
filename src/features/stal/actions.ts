'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getStableRole } from '@/lib/auth/authorization'
import { getUserStable } from '@/features/paarden/queries'
import type { StableRole } from '@prisma/client'

async function getOwnerContext(): Promise<
  | { ok: true; currentUserId: string; stable: NonNullable<Awaited<ReturnType<typeof getUserStable>>> }
  | { ok: false; error: string }
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const stable = await getUserStable(user.id)
  if (!stable) return { ok: false, error: 'Geen stal gevonden' }

  const role = await getStableRole(user.id, stable.id)
  if (role !== 'OWNER') return { ok: false, error: 'Alleen staleigenaren kunnen leden beheren' }

  return { ok: true, currentUserId: user.id, stable }
}

export async function addMember(
  formData: FormData
): Promise<{ error: string } | undefined> {
  const ctx = await getOwnerContext()
  if (!ctx.ok) return { error: ctx.error }

  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role = formData.get('role') as StableRole

  if (!email) return { error: 'E-mailadres is verplicht' }
  if (!['OWNER', 'STAFF'].includes(role)) return { error: 'Ongeldige rol' }

  const targetUser = await prisma.user.findUnique({ where: { email } })
  if (!targetUser)
    return {
      error: `Geen account gevonden voor ${email}. Vraag deze persoon eerst in te loggen op Velaro.`,
    }

  const existing = await prisma.stableMember.findUnique({
    where: { stableId_userId: { stableId: ctx.stable.id, userId: targetUser.id } },
  })
  if (existing) return { error: 'Deze gebruiker is al lid van de stal' }

  await prisma.stableMember.create({
    data: { stableId: ctx.stable.id, userId: targetUser.id, role },
  })

  revalidatePath('/stal/leden')
}

export async function updateMemberRole(
  memberId: string,
  formData: FormData
): Promise<{ error: string } | undefined> {
  const ctx = await getOwnerContext()
  if (!ctx.ok) return { error: ctx.error }

  const member = await prisma.stableMember.findUnique({ where: { id: memberId } })
  if (!member || member.stableId !== ctx.stable.id) return { error: 'Lid niet gevonden' }
  if (member.userId === ctx.currentUserId) return { error: 'Je kunt je eigen rol niet wijzigen' }

  const role = formData.get('role') as StableRole
  if (!['OWNER', 'STAFF'].includes(role)) return { error: 'Ongeldige rol' }

  await prisma.stableMember.update({ where: { id: memberId }, data: { role } })

  revalidatePath('/stal/leden')
}

export async function removeMember(
  memberId: string
): Promise<{ error: string } | undefined> {
  const ctx = await getOwnerContext()
  if (!ctx.ok) return { error: ctx.error }

  const member = await prisma.stableMember.findUnique({ where: { id: memberId } })
  if (!member || member.stableId !== ctx.stable.id) return { error: 'Lid niet gevonden' }
  if (member.userId === ctx.currentUserId) return { error: 'Je kunt jezelf niet verwijderen' }

  if (member.role === 'OWNER') {
    const ownerCount = await prisma.stableMember.count({
      where: { stableId: ctx.stable.id, role: 'OWNER' },
    })
    if (ownerCount <= 1) return { error: 'Er moet minimaal één eigenaar overblijven' }
  }

  await prisma.stableMember.delete({ where: { id: memberId } })

  revalidatePath('/stal/leden')
}
