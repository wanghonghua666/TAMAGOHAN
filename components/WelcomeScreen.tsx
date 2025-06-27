'use client'

import React from 'react'
import Link from 'next/link'
import { Camera, BarChart3, Heart, Trophy, Star, Sparkles } from 'lucide-react'

export default function WelcomeScreen() {
  const features = [
    {
      icon: Camera,
      title: '📸 写真で簡単記録',
      description: '食事の写真を撮るだけで自動的に食材を分析し、健康スコアを算出します。',
      color: 'from-pink-400 to-pink-600',
      bgColor: 'from-pink-100 to-pink-200'
    },
    {
      icon: Heart,
      title: '💖 キャラクター育成',
      description: '健康的な食事でキャラクターが成長します。食生活が見た目に反映されます。',
      color: 'from-red-400 to-red-600',
      bgColor: 'from-red-100 to-red-200'
    },
    {
      icon: BarChart3,
      title: '📊 詳細な分析',
      description: '栄養バランス、カロリー、健康度など様々な指標で食事を分析します。',
      color: 'from-blue-400 to-blue-600',
      bgColor: 'from-blue-100 to-blue-200'
    },
    {
      icon: Trophy,
      title: '🏆 継続をサポート',
      description: '健康スコアの履歴や成長記録で、継続的な健康改善をサポートします。',
      color: 'from-yellow-400 to-yellow-600',
      bgColor: 'from-yellow-100 to-yellow-200'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-yellow-100 relative overflow-hidden">
      {/* 游戏背景装饰 */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 left-10 text-4xl opacity-20 float-animation">🌟</div>
        <div className="absolute top-20 right-20 text-3xl opacity-20 float-animation" style={{ animationDelay: '1s' }}>⭐</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-15 float-animation" style={{ animationDelay: '2s' }}>✨</div>
        <div className="absolute bottom-10 right-10 text-3xl opacity-20 float-animation" style={{ animationDelay: '3s' }}>🎮</div>
        <div className="absolute top-1/2 left-5 text-2xl opacity-15 float-animation" style={{ animationDelay: '4s' }}>🌈</div>
        <div className="absolute top-1/3 right-5 text-2xl opacity-15 float-animation" style={{ animationDelay: '5s' }}>🎯</div>
        <div className="absolute top-2/3 left-1/4 text-2xl opacity-10 float-animation" style={{ animationDelay: '6s' }}>🍚</div>
        <div className="absolute top-1/4 right-1/4 text-2xl opacity-10 float-animation" style={{ animationDelay: '7s' }}>🥗</div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 游戏化英雄区域 */}
        <div className="text-center py-16 flex-grow flex flex-col justify-center">
          <div className="mb-8">
            <div className="relative inline-block mb-6">
              <div className="text-9xl mb-4 bounce-animation">🥚🍽️</div>
              <div className="absolute -top-4 -right-8 text-3xl wiggle-animation">💫</div>
              <div className="absolute -bottom-4 -left-8 text-3xl float-animation">🌈</div>
            </div>
            
            <div className="relative inline-block mb-8">
              <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 mb-4 bounce-animation" style={{ fontFamily: 'Fredoka One' }}>
                TAMAGOHAN
              </h1>
              <div className="absolute -top-6 -right-12 text-4xl animate-spin">⭐</div>
              <div className="absolute -bottom-6 -left-12 text-4xl wiggle-animation">✨</div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl px-8 py-6 shadow-2xl border-4 border-yellow-300 max-w-3xl mx-auto mb-8">
              <p className="text-2xl md:text-3xl font-bold text-purple-800 mb-3" style={{ fontFamily: 'Fredoka One' }}>
                🎮 食事記録でキャラクターを育てる 🎮
              </p>
              <p className="text-lg md:text-xl text-purple-600 font-semibold" style={{ fontFamily: 'Fredoka' }}>
                楽しい健康管理アプリ
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="btn-game text-xl px-10 py-4 hover:shadow-2xl glow-animation">
              🚀 今すぐ始める
            </Link>
            <Link href="/login" className="bg-gradient-to-r from-purple-400 to-purple-600 text-white font-bold py-4 px-10 rounded-full shadow-xl transform transition-all duration-200 hover:scale-110 active:scale-95 border-4 border-white text-xl">
              🎯 ログイン
            </Link>
          </div>
        </div>

        {/* 游戏化功能介绍 */}
        <div className="py-16 bg-white/80 backdrop-blur-sm rounded-t-3xl border-t-4 border-yellow-300">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-black text-purple-800 mb-4 flex items-center justify-center gap-2" style={{ fontFamily: 'Fredoka One' }}>
                <Star className="w-8 h-8 text-yellow-500" />
                TAMAGOHANの特徴
                <Star className="w-8 h-8 text-yellow-500" />
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div key={index} className={`text-center bg-gradient-to-br ${feature.bgColor} rounded-3xl p-6 shadow-xl border-4 border-white transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${feature.color} rounded-full mb-6 shadow-lg border-3 border-white float-animation`} style={{ animationDelay: `${index * 0.5}s` }}>
                    <feature.icon size={32} className="text-white" />
                  </div>
                  <h3 className="text-xl font-black text-purple-800 mb-4" style={{ fontFamily: 'Fredoka One' }}>
                    {feature.title}
                  </h3>
                  <p className="text-purple-600 leading-relaxed font-semibold" style={{ fontFamily: 'Fredoka' }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 游戏化使用步骤 */}
        <div className="py-16 bg-gradient-to-br from-green-100 to-blue-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-black text-green-800 mb-8 flex items-center justify-center gap-2" style={{ fontFamily: 'Fredoka One' }}>
              <Sparkles className="w-8 h-8 text-yellow-500" />
              使い方はとても簡単
              <Sparkles className="w-8 h-8 text-yellow-500" />
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-pink-300 transform transition-all duration-300 hover:scale-105">
                <div className="text-6xl mb-4 bounce-animation">📸</div>
                <h3 className="text-2xl font-black mb-2 text-pink-800" style={{ fontFamily: 'Fredoka One' }}>1. 写真を撮る</h3>
                <p className="text-pink-600 font-semibold" style={{ fontFamily: 'Fredoka' }}>
                  食事の写真を撮影するか、ギャラリーから選択
                </p>
              </div>
              
              <div className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-blue-300 transform transition-all duration-300 hover:scale-105">
                <div className="text-6xl mb-4 wiggle-animation">🤖</div>
                <h3 className="text-2xl font-black mb-2 text-blue-800" style={{ fontFamily: 'Fredoka One' }}>2. AI分析</h3>
                <p className="text-blue-600 font-semibold" style={{ fontFamily: 'Fredoka' }}>
                  AIが食材を識別し、健康スコアを自動算出
                </p>
              </div>
              
              <div className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-purple-300 transform transition-all duration-300 hover:scale-105">
                <div className="text-6xl mb-4 float-animation">🧸</div>
                <h3 className="text-2xl font-black mb-2 text-purple-800" style={{ fontFamily: 'Fredoka One' }}>3. キャラ育成</h3>
                <p className="text-purple-600 font-semibold" style={{ fontFamily: 'Fredoka' }}>
                  健康スコアに応じてキャラクターが成長
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 游戏化CTA */}
        <div className="py-16 text-center bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
          <div className="relative">
            <h2 className="text-4xl font-black text-white mb-4" style={{ fontFamily: 'Fredoka One' }}>
              🌟 健康的な食生活を始めませんか？ 🌟
            </h2>
            <div className="bg-white/90 rounded-3xl p-6 max-w-3xl mx-auto mb-8 border-4 border-yellow-300">
              <p className="text-purple-800 font-bold text-lg" style={{ fontFamily: 'Fredoka' }}>
                TAMAGOHANと一緒に、楽しく続けられる健康管理を始めましょう。<br />
                あなたの食事習慣が、可愛いキャラクターの成長につながります。
              </p>
            </div>
            <Link href="/signup" className="btn-game text-2xl px-12 py-5 hover:shadow-2xl glow-animation">
              🎮 無料で始める
            </Link>
            <div className="absolute -top-4 left-1/4 text-3xl wiggle-animation">⭐</div>
            <div className="absolute -top-4 right-1/4 text-3xl float-animation">✨</div>
          </div>
        </div>
      </div>
    </div>
  )
} 