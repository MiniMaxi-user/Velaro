import Link from 'next/link'
import PaardForm from '@/features/paarden/PaardForm'

export default function NieuwPaardPage() {
  return (
    <main className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          Nieuw <em>paard</em>
        </h1>
        <Link href="/paarden" className="btn-ghost">
          ← Terug
        </Link>
      </div>
      <PaardForm />
    </main>
  )
}
