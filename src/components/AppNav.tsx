import Image from 'next/image'
import Link from 'next/link'
import NavLinks from './NavLinks'
import SignOutButton from './SignOutButton'
import { getAuthUser } from '@/lib/auth/session'
import { isAnyStableMember } from '@/lib/auth/authorization'

export default async function AppNav() {
  const user = await getAuthUser()
  const stableMember = user ? await isAnyStableMember(user.id) : false

  return (
    <nav className="app-nav">
      <div className="app-nav__inner">
        <Link href={stableMember ? '/stal' : '/paarden'} className="app-nav__logo">
          <Image src="/velaro_logo.png" alt="Velaro" height={28} width={90} priority />
        </Link>
        <NavLinks isStableMember={stableMember} />
        <SignOutButton />
      </div>
    </nav>
  )
}
