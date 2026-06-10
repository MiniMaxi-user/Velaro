'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/stal', label: 'Stal', exact: true },
  { href: '/paarden', label: 'Paarden', exact: false },
  { href: '/stal/taken', label: 'Taken', exact: false },
]

export default function NavLinks() {
  const pathname = usePathname()
  return (
    <div className="app-nav__links">
      {LINKS.map(({ href, label, exact }) => {
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
