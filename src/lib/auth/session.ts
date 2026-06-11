import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

/**
 * Gecachte helper voor de Supabase Auth-gebruiker.
 * Binnen één render-cyclus wordt het netwerk­verzoek naar Supabase
 * slechts één keer gedaan, ongeacht hoeveel componenten deze helper aanroepen.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})

/**
 * Gecachte helper voor de database-gebruikersrij.
 * Dedupliceert `prisma.user.findUnique` binnen één render-cyclus.
 */
export const getDbUser = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, isPlatformAdmin: true, maxStables: true },
  })
})
