'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Camera, Home, History, User, Menu, X } from 'lucide-react'

export default function Navigation() {
  // 禁用登录功能，游客模式
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigationItems = [
    { href: '/', icon: Home, label: 'ホーム' },
    { href: '/meal', icon: Camera, label: '食事記録' },
    { href: '/history', icon: History, label: '履歴' },
  ]

  return (
    <nav className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 shadow-2xl sticky top-0 z-50 border-b-4 border-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* 游戏化Logo */}
          <Link href="/" className="flex items-center space-x-3 transform transition-all duration-200 hover:scale-105">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-3 border-white bounce-animation">
              <span className="text-2xl">🥚</span>
            </div>
            <span className="text-2xl font-black text-white" style={{ fontFamily: 'Fredoka One' }}>TAMAGOHAN</span>
          </Link>

          {/* デスクトップナビゲーション */}
          <div className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-1 text-white hover:text-yellow-300 transition-colors font-bold"
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* ゲストユーザー表示 */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <User size={20} className="text-white" />
              <span className="text-white font-bold" style={{ fontFamily: 'Fredoka' }}>ゲストモード</span>
            </div>
          </div>

          {/* モバイルメニューボタン */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* モバイルメニュー */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="space-y-4">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 text-white hover:text-yellow-300 transition-colors font-bold"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <div className="pt-4 border-t border-white/20">
                <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <User size={20} className="text-white" />
                  <span className="text-white font-bold" style={{ fontFamily: 'Fredoka' }}>ゲストモード</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 