'use client'

import { usePathname } from 'next/navigation'
import Navigation from './Navigation'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <>
      <Navigation />
      {isHome ? (
        children
      ) : (
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          {children}
        </main>
      )}
    </>
  )
}
