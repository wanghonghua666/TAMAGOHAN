import React from 'react'
import type { Metadata } from 'next'
import { DotGothic16 } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import AppShell from '@/components/AppShell'
import ConsentGate from '@/components/ConsentGate'

const dotGothic = DotGothic16({ weight: '400', subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'くっくぴん Kukupin - 食事记录育成游戏',
  description: '通过食事记录培养你的虚拟角色',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={dotGothic.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100">
            <AppShell>{children}</AppShell>
            <ConsentGate />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
