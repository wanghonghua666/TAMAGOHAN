'use client'

import React from 'react'
import CharacterDisplay from '../components/CharacterDisplay'
import RecentMeals from '../components/RecentMeals'
import DemoNotice from '../components/DemoNotice'

export default function HomePage() {
  // 禁用登录检查，直接显示游戏内容
  const guestUser = {
    id: 'guest-user',
    email: 'guest@tamagohan.com',
    displayName: 'ゲストユーザー'
  }

  return (
    <div className="space-y-8 relative">
      {/* 游戏背景装饰 */}
      <div className="absolute -top-10 -left-10 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 text-3xl opacity-20 float-animation">🌟</div>
        <div className="absolute top-20 right-20 text-2xl opacity-20 float-animation" style={{ animationDelay: '1s' }}>⭐</div>
        <div className="absolute bottom-20 left-20 text-4xl opacity-15 float-animation" style={{ animationDelay: '2s' }}>✨</div>
        <div className="absolute bottom-10 right-10 text-2xl opacity-20 float-animation" style={{ animationDelay: '3s' }}>🎮</div>
      </div>

      {/* Demo通知 */}
      <DemoNotice />
      
      {/* 简化的欢迎区域 */}
      <div className="text-center relative z-10 mb-4">
        <h1 className="text-3xl font-black text-purple-800 mb-2 bounce-animation" style={{ fontFamily: 'Fredoka One' }}>
          🎉 おかえりなさい！
        </h1>
        <p className="text-purple-600 font-bold" style={{ fontFamily: 'Fredoka' }}>
          ペットに食事をあげてレベルアップしよう！
        </p>
      </div>

      {/* 核心区域：角色展示 */}
      <div className="relative z-10 mb-8">
        <CharacterDisplay />
      </div>

      {/* 主要按钮：吃饭记录 */}
      <div className="text-center relative z-10 mb-8">
        <a
          href="/meal"
          className="inline-block bg-gradient-to-r from-orange-400 via-red-400 to-pink-500 text-white font-black text-3xl py-8 px-12 rounded-full shadow-2xl transform transition-all duration-300 hover:scale-110 active:scale-95 border-6 border-white bounce-animation"
          style={{ fontFamily: 'Fredoka One' }}
        >
          🍚 食事を記録する 🍚
        </a>
        <p className="text-sm text-gray-600 mt-3" style={{ fontFamily: 'Fredoka' }}>
          📸 写真を撮ってペットに食べさせよう！
        </p>
      </div>

      {/* 简化的信息区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* 最近の食事 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border-3 border-blue-300">
          <RecentMeals />
        </div>

        {/* 简化的状态和次要按钮 */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-6 border-3 border-green-300">
          <h3 className="text-xl font-black text-green-800 text-center mb-4" style={{ fontFamily: 'Fredoka' }}>
            📊 ステータス
          </h3>
          
          {/* 简化的状态显示 */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl">
              <span className="font-bold text-yellow-800">🌟 レベル</span>
              <span className="text-2xl font-black text-yellow-600">12</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl">
              <span className="font-bold text-green-800">❤️ 健康度</span>
              <span className="text-2xl font-black text-green-600">85%</span>
            </div>
          </div>

          {/* 次要按钮 */}
          <a
            href="/history"
            className="block w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold py-3 px-6 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 text-center"
            style={{ fontFamily: 'Fredoka' }}
          >
            📚 履歴を見る
          </a>
        </div>
      </div>
    </div>
  )
} 