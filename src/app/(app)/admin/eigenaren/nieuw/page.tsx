import Link from 'next/link'
import EigenaarNieuwForm from '@/features/admin/EigenaarNieuwForm'

export default function NieuwEigenaarPage() {
  return (
    <main className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <div className="breadcrumb">
            <Link href="/admin/eigenaren">Eigenaren</Link>
            <span className="breadcrumb-sep">›</span>
            <span className="breadcrumb-current">Nieuw account</span>
          </div>
          <h1 className="page-title">Nieuw eigenaar<em>account</em></h1>
        </div>
        <Link href="/admin/eigenaren" className="btn-ghost">← Terug</Link>
      </div>

      <div className="form-card" style={{ maxWidth: 520 }}>
        <EigenaarNieuwForm />
      </div>
    </main>
  )
}
