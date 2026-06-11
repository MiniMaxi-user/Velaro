import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Gebruik: npx tsx prisma/seed-admin.ts <email>')
    process.exit(1)
  }

  const user = await prisma.user.update({
    where: { email },
    data: { isPlatformAdmin: true },
  })

  console.log(`✓ ${user.email} is nu platform-admin (isPlatformAdmin = true)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
