'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { storeItems, StoreItem } from '@/lib/store-items'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function ShopPage () {
  const [purchased, setPurchased] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('purchased-items')
      if (saved) {
        setPurchased(JSON.parse(saved))
      }
    }
  }, [])

  const handleBuy = (item: StoreItem) => {
    if (purchased.includes(item.id)) return
    const newList = [...purchased, item.id]
    setPurchased(newList)
    localStorage.setItem('purchased-items', JSON.stringify(newList))
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <Link href="/" className="inline-flex items-center text-purple-600 font-bold">
        <ArrowLeft size={18} className="mr-1" /> ホームに戻る
      </Link>
      <h1 className="text-3xl font-black text-center text-purple-800 mb-4">🛒 ショップ</h1>
      <div className="grid grid-cols-2 gap-4">
        {storeItems.map(item => {
          const owned = purchased.includes(item.id)
          return (
            <div key={item.id} className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg text-center space-y-2 border-2 border-white">
              <div className="text-5xl">{item.emoji}</div>
              <h3 className="font-bold text-gray-800">{item.name}</h3>
              <p className="text-sm text-gray-600">{item.price} 🪙</p>
              {owned ? (
                <div className="inline-flex items-center text-green-600 text-sm font-bold"><CheckCircle size={14} className="mr-1" /> 購入済み</div>
              ) : (
                <button onClick={() => handleBuy(item)} className="btn-primary text-sm px-3 py-1">購入</button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
} 