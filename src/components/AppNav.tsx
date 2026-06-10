import Image from 'next/image'
import Link from 'next/link'
import NavLinks from './NavLinks'
import SignOutButton from './SignOutButton'

export default function AppNav() {
  return (
    <nav className="app-nav">
      <div className="app-nav__inner">
        <Link href="/paarden" className="app-nav__logo">
          <Image src="/velaro_logo.png" alt="Velaro" height={28} width={90} priority />
        </Link>
        <NavLinks />
        <SignOutButton />
      </div>
    </nav>
  )
}
