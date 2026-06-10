'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/paarden', label: 'Paarden' },
  { href: '/stal', label: 'Stal' },
]

export default function NavLinks() {
  const pathname = usePathname()
  return (
    <div className="app-nav__links">
      {LINKS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={`app-nav__link${pathname.startsWith(href) ? ' app-nav__link--active' : ''}`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
