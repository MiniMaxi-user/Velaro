import Image from 'next/image'
import Link from 'next/link'
import NavLinks from './NavLinks'
import SignOutButton from './SignOutButton'
import { createClient } from '@/lib/supabase/server'
import { isAnyStableMember } from '@/lib/auth/authorization'

export default async function AppNav() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
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
