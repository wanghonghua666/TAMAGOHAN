'use client'

import React, { useEffect, useState } from 'react'
import { Heart, Star } from 'lucide-react'
import Image from 'next/image'

// 简化的角色类型
interface SimpleCharacter {
  name: string
  level: number
  healthScore: number
  mood: string
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
      mood: 'happy'
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
      {/* 主舞台背景 - 使用用户提供的房间背景 */}
      <div 
        className="rounded-3xl p-8 shadow-2xl border-4 border-white relative overflow-hidden"
        style={{
          backgroundImage: "url('/character-room-bg.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          minHeight: '600px'
        }}
      >
        {/* 轻微覆盖层 */}
        <div className="absolute inset-0 bg-black/5 rounded-3xl"></div>
        
        <div className="relative z-10 h-full flex flex-col">
          {/* 顶部角色信息 */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Star className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
              <h1 className="text-4xl font-black text-white drop-shadow-lg" style={{ fontFamily: 'Fredoka One' }}>
                {character.name}
              </h1>
              <Star className="w-8 h-8 text-yellow-400 drop-shadow-lg" />
            </div>
            <div className="text-2xl font-bold text-white drop-shadow-lg" style={{ fontFamily: 'Fredoka' }}>
              レベル {character.level}
            </div>
          </div>

          {/* 角色展示区域 - 直接融入房间 */}
          <div className="flex-1 flex items-end justify-center relative" style={{ minHeight: '400px', paddingBottom: '60px' }}>
            {/* 角色直接放在地毯上 */}
            <div className="relative" style={{ transform: 'translateY(50px)' }}>
              <div className="bounce-animation drop-shadow-2xl">
                <Image
                  src="/kukupin-character.png"
                  alt="くっくぴん角色"
                  width={180}
                  height={180}
                  className="mx-auto"
                />
              </div>
              
              {/* 心情状态指示器 - 浮动在角色旁边 */}
              <div className="absolute -top-8 -right-8 w-20 h-20 bg-white/95 backdrop-blur-sm rounded-full border-4 border-yellow-300 flex items-center justify-center shadow-xl">
                <span className="text-4xl">{getMoodEmoji()}</span>
              </div>
            </div>
          </div>

          {/* 对话气泡 - 移到角色上方 */}
          <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
            <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-4 shadow-lg border-4 border-pink-300 max-w-xs relative">
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[20px] border-r-[20px] border-t-[20px] border-l-transparent border-r-transparent border-t-white"></div>
              <p className="text-purple-800 font-black text-lg text-center" style={{ fontFamily: 'Fredoka' }}>
                {getCharacterMessage()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 健康状态面板 - 移到房间外下方 */}
      <div className="mt-6 bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-xl border-4 border-green-300">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Heart className="w-10 h-10 text-red-500" />
          <span className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Fredoka' }}>健康スコア</span>
        </div>
        <div className="text-6xl font-black text-green-600 mb-4 text-center" style={{ fontFamily: 'Fredoka One' }}>
          {character.healthScore}
        </div>
        <div className="stat-bar h-6 rounded-full bg-gray-200 shadow-inner">
          <div 
            className="stat-fill bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full transition-all duration-500 glow-animation shadow-lg"
            style={{ width: `${character.healthScore}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
} 