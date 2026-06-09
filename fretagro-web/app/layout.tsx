import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

// Principle III — Inter typeface must be used project-wide
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'FreteAgro — Gestão de Frota Agrícola',
  description: 'Plataforma SaaS para controle operacional e financeiro de frotas agrícolas.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Dark mode is canonical (Principle III); class="dark" always present
    <html lang="pt-BR" className={`${inter.variable} dark`}>
      <body>{children}</body>
    </html>
  )
}
