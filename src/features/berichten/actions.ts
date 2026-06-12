'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getStableRole } from '@/lib/auth/authorization'

export interface MessageTarget {
  stableId?: string
  horseId?: string
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

/**
 * Bepaalt de stal van het doel (stal- of paardbericht) en controleert dat de
 * gebruiker OWNER van die stal is. Berichten beheren is voorbehouden aan de
 * staleigenaar.
 */
async function requireOwnerForTarget(userId: string, target: MessageTarget) {
  if (Boolean(target.stableId) === Boolean(target.horseId)) {
    throw new Error('Een bericht hoort bij precies één stal of paard')
  }

  let stableId = target.stableId
  if (!stableId && target.horseId) {
    const horse = await prisma.horse.findUnique({
      where: { id: target.horseId },
      select: { stableId: true },
    })
    if (!horse) throw new Error('Paard niet gevonden')
    stableId = horse.stableId
  }

  const role = await getStableRole(userId, stableId!)
  if (role !== 'OWNER') throw new Error('Alleen de staleigenaar kan berichten beheren')
}

function revalidateForTarget(target: MessageTarget) {
  if (target.horseId) revalidatePath(`/paarden/${target.horseId}`)
  if (target.stableId) revalidatePath('/stal')
  revalidatePath('/eigenaar')
}

export async function createMessage(target: MessageTarget, formData: FormData) {
  const user = await requireUser()
  await requireOwnerForTarget(user.id, target)

  const subject = (formData.get('subject') as string)?.trim()
  const body = (formData.get('body') as string)?.trim()
  if (!subject || !body) return { error: 'Onderwerp en bericht zijn verplicht' }

  await prisma.message.create({
    data: {
      stableId: target.stableId ?? null,
      horseId: target.horseId ?? null,
      authorId: user.id,
      subject,
      body,
    },
  })

  revalidateForTarget(target)
}

export async function updateMessage(id: string, formData: FormData) {
  const user = await requireUser()

  const message = await prisma.message.findUnique({ where: { id } })
  if (!message) throw new Error('Bericht niet gevonden')

  const target: MessageTarget = {
    stableId: message.stableId ?? undefined,
    horseId: message.horseId ?? undefined,
  }
  await requireOwnerForTarget(user.id, target)

  const subject = (formData.get('subject') as string)?.trim()
  const body = (formData.get('body') as string)?.trim()
  if (!subject || !body) return { error: 'Onderwerp en bericht zijn verplicht' }

  await prisma.message.update({ where: { id }, data: { subject, body } })
  revalidateForTarget(target)
}

export async function deleteMessage(id: string) {
  const user = await requireUser()

  const message = await prisma.message.findUnique({ where: { id } })
  if (!message) throw new Error('Bericht niet gevonden')

  const target: MessageTarget = {
    stableId: message.stableId ?? undefined,
    horseId: message.horseId ?? undefined,
  }
  await requireOwnerForTarget(user.id, target)

  await prisma.message.delete({ where: { id } })
  revalidateForTarget(target)
}

/** Markeert één bericht als gelezen voor de huidige gebruiker. */
export async function markMessageRead(id: string) {
  const user = await requireUser()
  await prisma.messageRead.upsert({
    where: { messageId_userId: { messageId: id, userId: user.id } },
    create: { messageId: id, userId: user.id },
    update: {},
  })
}

/** Markeert een set berichten als gelezen voor de huidige gebruiker. */
export async function markMessagesRead(ids: string[]) {
  if (ids.length === 0) return
  const user = await requireUser()
  await prisma.$transaction(
    ids.map((id) =>
      prisma.messageRead.upsert({
        where: { messageId_userId: { messageId: id, userId: user.id } },
        create: { messageId: id, userId: user.id },
        update: {},
      })
    )
  )
}
