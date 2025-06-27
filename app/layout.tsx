import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'
import Navigation from '@/components/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TAMAGOHAN - 食事记录育成游戏',
  description: '通过食事记录培养你的虚拟角色',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-yellow-100 relative overflow-hidden">
            {/* 全局游戏装饰背景 */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-30">
              <div className="absolute top-10 left-10 text-2xl opacity-50 float-animation">🌟</div>
              <div className="absolute top-20 right-20 text-xl opacity-40 float-animation" style={{ animationDelay: '2s' }}>⭐</div>
              <div className="absolute bottom-20 left-20 text-3xl opacity-30 float-animation" style={{ animationDelay: '4s' }}>✨</div>
              <div className="absolute bottom-10 right-10 text-xl opacity-40 float-animation" style={{ animationDelay: '6s' }}>🎮</div>
            </div>
            
            <div className="relative z-10">
              <Navigation />
              <main className="container mx-auto px-4 py-8">
                {children}
              </main>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
} 