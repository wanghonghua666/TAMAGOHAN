'use client'

import React, { useEffect, useState } from 'react'
import { Heart, Star } from 'lucide-react'

// 简化的角色类型
interface SimpleCharacter {
  name: string
  level: number
  healthScore: number
  mood: string
  emoji: string
}

export default function CharacterDisplay() {
  const [character, setCharacter] = useState<SimpleCharacter | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 加载示例角色数据
    const dummyCharacter: SimpleCharacter = {
      name: 'たまごちゃん',
      level: 5,
      healthScore: 78,
      mood: 'happy',
      emoji: '🧸'
    }

    setTimeout(() => {
      setCharacter(dummyCharacter)
      setLoading(false)
    }, 500)
  }, [])

  const getCharacterMessage = () => {
    if (!character) return ''
    
    if (character.healthScore >= 80) {
      return 'お腹がすいたなー！🍚'
    } else if (character.healthScore >= 60) {
      return '何か食べたいです！😋'
    } else {
      return 'ごはんが欲しいよー 🥺'
    }
  }

  const getMoodEmoji = () => {
    if (!character) return ''
    if (character.healthScore >= 80) return '😊'
    if (character.healthScore >= 60) return '🤤'
    return '😴'
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto bg-gradient-to-b from-sky-300 via-sky-200 to-green-200 rounded-3xl p-8 shadow-2xl border-4 border-white">
        <div className="animate-pulse text-center">
          <div className="w-48 h-48 bg-gray-300 rounded-full mx-auto mb-4"></div>
          <div className="h-8 bg-gray-300 rounded w-1/2 mx-auto mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-1/3 mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!character) {
    return (
      <div className="max-w-lg mx-auto bg-gradient-to-b from-sky-300 via-sky-200 to-green-200 rounded-3xl p-8 shadow-2xl border-4 border-white text-center">
        <div className="text-6xl mb-4">😔</div>
        <p className="text-white font-bold">キャラクターが見つかりません</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto relative">
      {/* 主舞台背景 */}
      <div className="bg-gradient-to-b from-sky-300 via-sky-200 to-green-200 rounded-3xl p-8 shadow-2xl border-4 border-white relative overflow-hidden">
        {/* 云朵装饰 */}
        <div className="absolute top-4 left-6 text-2xl opacity-60 float-animation">☁️</div>
        <div className="absolute top-6 right-8 text-xl opacity-40 float-animation" style={{ animationDelay: '1s' }}>☁️</div>
        
        <div className="text-center relative z-10">
          {/* 角色名称和等级 */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-8 h-8 text-yellow-400" />
              <h1 className="text-4xl font-black text-white" style={{ fontFamily: 'Fredoka One' }}>
                {character.name}
              </h1>
              <Star className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white" style={{ fontFamily: 'Fredoka' }}>
              レベル {character.level}
            </div>
          </div>

          {/* 超大角色展示 */}
          <div className="mb-6">
            <div className="relative inline-block">
              <div className="w-60 h-60 mx-auto rounded-full flex items-center justify-center bg-white shadow-2xl border-6 border-yellow-300 relative overflow-hidden bounce-animation">
                <div className="text-[10rem] leading-none">{character.emoji}</div>
                
                {/* 心情状态指示器 */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white rounded-full border-4 border-yellow-300 flex items-center justify-center shadow-lg">
                  <span className="text-3xl">{getMoodEmoji()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 对话气泡 */}
          <div className="mb-6">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-lg border-4 border-pink-300 max-w-sm mx-auto relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[20px] border-r-[20px] border-b-[20px] border-l-transparent border-r-transparent border-b-white"></div>
              <p className="text-purple-800 font-black text-xl text-center" style={{ fontFamily: 'Fredoka' }}>
                {getCharacterMessage()}
              </p>
            </div>
          </div>

          {/* 简化的健康状态 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg border-3 border-green-300">
            <div className="flex items-center justify-center gap-3 mb-3">
              <Heart className="w-8 h-8 text-red-500" />
              <span className="text-xl font-bold text-gray-800">健康スコア</span>
            </div>
            <div className="text-5xl font-black text-green-600 mb-3" style={{ fontFamily: 'Fredoka One' }}>
              {character.healthScore}
            </div>
            <div className="stat-bar h-4 rounded-full">
              <div 
                className="stat-fill bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500 glow-animation"
                style={{ width: `${character.healthScore}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 