import type { CSSProperties } from 'react'

/**
 * Toont of een paard eigendom is van de stal (stalpaard) of gestald wordt door
 * een externe eigenaar (pension). Bewust prominenter dan de overige badges: een
 * extra gevuld rondje (icoon) vóór de tekst maakt het kenmerk in één oogopslag
 * herkenbaar. Toegankelijk via een tekstlabel + aria-label (niet alleen kleur).
 */
export default function EigendomBadge({
  ownedByStable,
  style,
}: {
  ownedByStable: boolean
  style?: CSSProperties
}) {
  const label = ownedByStable ? 'Stalpaard' : 'Pension'
  const aria = ownedByStable
    ? 'Stalpaard — eigendom van de stal'
    : 'Pension — gestald door externe eigenaar'

  return (
    <span
      className={`badge eigendom-badge ${ownedByStable ? 'badge-navy' : 'badge-gold'}`}
      aria-label={aria}
      title={aria}
      style={style}
    >
      <svg
        className="eigendom-badge-dot"
        width="10"
        height="10"
        viewBox="0 0 10 10"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="5" cy="5" r="4.25" fill="currentColor" />
        <circle cx="5" cy="5" r="1.6" fill="var(--velaro-color-surf-1)" />
      </svg>
      {label}
    </span>
  )
}
