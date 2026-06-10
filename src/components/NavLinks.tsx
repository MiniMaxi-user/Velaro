'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const STAL_LINKS = [
  { href: '/stal', label: 'Stal', exact: true },
  { href: '/paarden', label: 'Paarden', exact: false },
  { href: '/stal/taken', label: 'Taken', exact: false },
]

const EIGENAAR_LINKS = [
  { href: '/paarden', label: 'Mijn paarden', exact: false },
]

export default function NavLinks({ isStableMember }: { isStableMember: boolean }) {
  const pathname = usePathname()
  const links = isStableMember ? STAL_LINKS : EIGENAAR_LINKS

  return (
    <div className="app-nav__links">
      {links.map(({ href, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`app-nav__link${isActive ? ' app-nav__link--active' : ''}`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
