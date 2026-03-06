import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Link from 'next/link'
import { Navigation } from '@/components/Navigation'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MomentumLab1 | Quantitative Research Platform',
  description: 'Simulate and test systematic momentum investment strategies.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-zinc-950 text-zinc-50 min-h-screen flex flex-col`}>
        <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              MomentumLab1
            </Link>
            <Navigation />
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <footer className="border-t border-zinc-800 py-8 bg-zinc-950">
          <div className="container mx-auto px-6 text-center text-zinc-500 text-sm">
            <p className="mb-2">© {new Date().getFullYear()} MomentumLab1. All rights reserved.</p>
            <p className="text-xs">
              Research Use Only. MomentumLab1 does not provide investment advice, financial advice, trading signals, or recommendations to buy or sell securities.
            </p>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  )
}
