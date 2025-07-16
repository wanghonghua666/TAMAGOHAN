'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User } from 'lucide-react'

export default function Navigation() {
  return (
    <nav className="bg-[#A77D3D] shadow-2xl sticky top-0 z-50 border-b-4 border-[#7b5b2e]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-24">
          {/* 木牌Logo */}
          <Link href="/" className="flex items-center transform transition-all duration-200 hover:scale-105">
            <Image src="/kukupinTitle.png" alt="くっくぴん" width={220} height={60} priority style={{ width: 'auto', height: 'auto' }} />
          </Link>

          {/* ゲストモード标签 */}
          <div className="hidden md:flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
            <User size={20} className="text-white" />
            <span className="text-white font-bold" style={{ fontFamily: 'Fredoka' }}>ゲストモード</span>
          </div>
        </div>
      </div>
    </nav>
  )
} 