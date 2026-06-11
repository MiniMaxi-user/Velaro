import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Velaro',
  description: 'Paardenprofiel platform voor pensionstallen',
  icons: {
    icon: '/logo_icon.png',
    apple: '/logo_icon.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  )
}
