'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { Heart, Star, History, Camera, Palette, Award, Zap, ShoppingBag } from 'lucide-react'
import DemoNotice from '@/components/DemoNotice'
import { storeItems } from '@/lib/store-items'

// 背景配置 - 使用正确的图片路径
const backgrounds = [
  { name: '默認', path: '/character-room-bg.png', gradient: 'from-purple-400 to-pink-500' },
  { name: '森の中', path: '/backgrounds/character-room-bg.png', gradient: 'from-green-400 to-blue-500' },
  { name: '海辺', path: '/character-room-bg.png', gradient: 'from-blue-400 to-cyan-500' },
  { name: '山の上', path: '/character-room-bg.png', gradient: 'from-purple-400 to-pink-500' },
  { name: '桜並木', path: '/character-room-bg.png', gradient: 'from-pink-400 to-rose-500' }
]

export default function HomePage() {
  const { user, logout, isDemo } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentBackground, setCurrentBackground] = useState(0)
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false)
  const [petMood, setPetMood] = useState<'happy' | 'excited' | 'sick' | 'dead'>('happy')
  const [lastFed, setLastFed] = useState(2) // 小时
  const [healthScore, setHealthScore] = useState(85) // 健康分数
  const [lastMealScore, setLastMealScore] = useState(null as number | null) // 最后一餐的分数
  const [isClient, setIsClient] = useState(false) // 添加客户端检查
  const [purchasedItems, setPurchasedItems] = useState<string[]>([])

  // 客户端检查
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 小熊状态逻辑 - 只在客户端执行
  useEffect(() => {
    if (!isClient) return // 防止hydration错误
    
    // 检查localStorage中的健康数据
    if (typeof window !== 'undefined') {
      const savedHealthScore = localStorage.getItem('pet-health-score')
      const savedLastMealScore = localStorage.getItem('last-meal-score')
      const savedLastFed = localStorage.getItem('last-fed-time')
      
      if (savedHealthScore) {
        setHealthScore(parseInt(savedHealthScore))
      }
      if (savedLastMealScore) {
        setLastMealScore(parseInt(savedLastMealScore))
      }
      if (savedLastFed) {
        const fedTime = parseInt(savedLastFed)
        const now = Date.now()
        const hoursAgo = Math.floor((now - fedTime) / (1000 * 60 * 60))
        setLastFed(hoursAgo)
      }
    }
  }, [isClient])

  // 根据健康分数和最后一餐决定小熊状态
  useEffect(() => {
    if (!isClient) return // 防止hydration错误
    
    if (lastMealScore !== null && lastMealScore < 20) {
      // 吃了低于20分的食物 -> 🤢
      setPetMood('sick')
    } else if (healthScore < 30) {
      // 健康分数很低 -> 💀
      setPetMood('dead')
    } else if (healthScore > 80) {
      // 健康分数很高 -> 开心
      setPetMood('excited')
    } else {
      // 普通状态
      setPetMood('happy')
    }
  }, [healthScore, lastMealScore, isClient])

  // 获取小熊组件
  const getPetComponent = (size: 'large' | 'small' = 'large') => {
    // 根据心情状态选择不同的效果
    const getClassName = () => {
      switch (petMood) {
        case 'dead':
          return 'grayscale shake-animation'
        case 'sick':
          return 'opacity-80 wiggle-animation'
        case 'excited':
          return 'bounce-animation'
        case 'happy':
        default:
          return 'bounce-animation'
      }
    }

    const dimensions = size === 'large' ? { width: 200, height: 200 } : { width: 120, height: 120 }
    const emojiSize = size === 'large' ? 'text-[200px]' : 'text-[120px]'

    // 对于死亡和生病状态，仍然使用emoji
    if (petMood === 'dead') {
      return <div className={`${emojiSize} shake-animation`}>💀</div>
    }
    if (petMood === 'sick') {
      return <div className={`${emojiSize} wiggle-animation`}>🤢</div>
    }

    // 健康和兴奋状态使用图片
    return (
      <Image
        src="/kukupin.png"
        alt="くっくぴん"
        width={dimensions.width}
        height={dimensions.height}
        className={getClassName()}
      />
    )
  }

  // 获取小熊状态消息
  const getPetMessage = () => {
    switch (petMood) {
      case 'dead':
        return 'やばい...もっと健康的な食事を！💀'
      case 'sick':
        return 'うえぇ...ジャンクフードで気持ち悪い 🤢'
      case 'excited':
        return '元気だよ！健康的な食事ありがとう！✨'
      case 'happy':
      default:
        return lastFed > 3 ? "お腹がすいたよ～ 🍚" : "元気だよ！ 😊"
    }
  }

  // 处理小熊点击
  const handlePetClick = () => {
    if (petMood === 'excited') {
      // 添加额外动画或效果
      console.log('Pet is very happy!')
    }
  }

  // 时间更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  // 背景切换处理
  const handleBackgroundChange = (index: number) => {
    setCurrentBackground(index)
    setShowBackgroundSelector(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('selected-background', index.toString())
    }
  }

  // 从localStorage恢复背景设置 - 只在客户端执行
  useEffect(() => {
    if (!isClient) return // 防止hydration错误
    
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selected-background')
      if (saved) {
        setCurrentBackground(parseInt(saved))
      }
    }
  }, [isClient])

  // 如果还没有在客户端渲染，显示简化版本
  if (!isClient) {
    return (
      <div 
        className="min-h-screen relative overflow-hidden"
        style={{
          backgroundImage: `url('${backgrounds[0].path}')`,
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="bounce-animation mb-4">
              <Image
                src="/kukupin.png"
                alt="くっくぴん"
                width={200}
                height={200}
                className="mx-auto"
              />
            </div>
            <div className="bg-white/95 rounded-full px-6 py-3 shadow-lg">
              <p className="text-xl font-bold text-purple-800">読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url('${backgrounds[currentBackground].path}')`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 移除所有覆盖层和效果，保持原始图片 */}
      
      {/* 背景装饰 - 减少透明度 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-10 text-4xl opacity-5 float-animation">🌟</div>
        <div className="absolute top-20 right-20 text-3xl opacity-5 float-animation" style={{ animationDelay: '1s' }}>⭐</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-5 float-animation" style={{ animationDelay: '2s' }}>✨</div>
        <div className="absolute bottom-10 right-10 text-3xl opacity-5 float-animation" style={{ animationDelay: '3s' }}>🎮</div>

        {/* 已购买道具装饰 */}
        {purchasedItems.map((id) => {
          const item = storeItems.find(i => i.id === id)
          if (!item) return null
          // 简单定位规则
          const styleMap: Record<string, React.CSSProperties> = {
            plant: { bottom: '15%', left: '10%' },
            sofa: { bottom: '5%', right: '10%' },
            lamp: { top: '15%', right: '15%' },
            art: { top: '20%', left: '45%' }
          }
          const posStyle = styleMap[id] || { bottom: '10%', left: '50%' }
          return (
            <div key={id} style={{ position: 'absolute', fontSize: '48px', pointerEvents: 'none', ...posStyle }}>
              {item.emoji}
            </div>
          )
        })}
      </div>

      {/* 背景切换按钮 */}
      <div className="absolute top-4 left-4 z-40">
        <div className="relative">
          <button
            onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
            className="bg-black/20 rounded-full p-3 shadow-lg hover:bg-black/30 transition-all duration-200"
            aria-label="背景切換"
          >
            <Palette className="w-5 h-5 text-white" />
          </button>
          
          {/* 背景选择器 */}
          {showBackgroundSelector && (
            <div className="absolute top-14 left-0 bg-white/95 rounded-xl p-4 shadow-xl min-w-[180px] z-50">
              <h3 className="text-sm font-bold text-gray-800 mb-3">背景を選択</h3>
              <div className="space-y-2">
                {backgrounds.map((bg, index) => (
                  <button
                    key={index}
                    onClick={() => handleBackgroundChange(index)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                      currentBackground === index 
                        ? 'bg-purple-100 text-purple-800 font-bold' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${bg.gradient}`}></div>
                      <span className="text-sm">{bg.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主游戏界面 */}
      <div className="h-screen flex flex-col relative z-10">
        {/* 桌面版布局 */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-3 p-3 flex-1">
          {/* 左侧状态栏 */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white/95 rounded-2xl p-4 shadow-xl border-2 border-white/50">
              <h3 className="text-lg font-black text-purple-800 mb-3 text-center">📊 ステータス</h3>
              
              {/* 等级 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">🌟 レベル</span>
                  <span className="text-xl font-black text-yellow-600">12</span>
                </div>
                <div className="stat-bar">
                  <div className="stat-fill bg-gradient-to-r from-yellow-400 to-orange-500 w-3/4"></div>
                </div>
              </div>

              {/* 健康度 - 使用动态健康分数 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">❤️ 健康度</span>
                  <span className={`text-lg font-black ${healthScore < 30 ? 'text-red-600' : healthScore < 60 ? 'text-orange-500' : 'text-green-500'}`}>
                    {healthScore}%
                  </span>
                </div>
                <div className="stat-bar">
                  <div className={`stat-fill w-[${healthScore}%] ${healthScore < 30 ? 'bg-gradient-to-r from-red-600 to-red-400' : healthScore < 60 ? 'bg-gradient-to-r from-orange-500 to-yellow-500' : 'bg-gradient-to-r from-green-400 to-emerald-500'}`}></div>
                </div>
              </div>

              {/* 幸福度 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">😊 幸福度</span>
                  <span className="text-lg font-black text-green-500">92%</span>
                </div>
                <div className="stat-bar">
                  <div className="stat-fill bg-gradient-to-r from-green-400 to-emerald-500 w-[92%]"></div>
                </div>
              </div>

              {/* 饥饿度 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">🍽️ 空腹度</span>
                  <span className="text-lg font-black text-orange-500">65%</span>
                </div>
                <div className="stat-bar">
                  <div className="stat-fill bg-gradient-to-r from-orange-400 to-red-500 w-[65%]"></div>
                </div>
              </div>
            </div>

            {/* 时间显示 */}
            <div className="bg-white/95 rounded-2xl p-4 shadow-xl border-2 border-white/50 text-center">
              <div className="text-2xl font-black text-purple-800 mb-1">
                {formatTime(currentTime)}
              </div>
              <div className="text-xs text-gray-600">
                最後の食事: {lastFed}時間前
              </div>
            </div>
          </div>

          {/* 中央互动区域 */}
          <div className="lg:col-span-8 flex flex-col">
            {/* 宠物互动主区域 */}
            <div className="flex-1 bg-white/10 rounded-3xl shadow-inner border-2 border-white/20 relative overflow-hidden">
              {/* 互动提示 */}
              <div className="absolute top-4 left-4 bg-white/90 rounded-full px-4 py-2 shadow-lg z-20">
                <span className="text-sm font-bold text-purple-800">👆 タップして遊ぼう！</span>
      </div>

              {/* 移除3D地毯效果，使用图片原有的地毯 */}

              {/* 宠物显示区域 - 在图片的地毯位置 */}
              <div 
                className="absolute bottom-[120px] left-1/2 transform -translate-x-1/2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 z-10"
                onClick={handlePetClick}
              >
                <div className="text-center">
                  {/* 宠物角色 */}
                  <div className="relative">
                    <div className={`${petMood === 'excited' ? 'bounce-animation' : petMood === 'sick' ? 'wiggle-animation' : petMood === 'dead' ? 'shake-animation' : 'bounce-animation'}`}>
                      {getPetComponent()}
                    </div>
                    {petMood === 'excited' && (
                      <div className="absolute -top-4 -right-4 text-4xl wiggle-animation">💫</div>
                    )}
                    {petMood === 'sick' && (
                      <div className="absolute -top-4 -left-4 text-3xl float-animation">🤧</div>
                    )}
                    {petMood === 'dead' && (
                      <div className="absolute -bottom-4 -right-4 text-3xl pulse-animation">⚰️</div>
                    )}
                    {lastFed > 3 && petMood === 'happy' && (
                      <div className="absolute -bottom-4 -left-4 text-3xl float-animation">😋</div>
                    )}
                  </div>

                  {/* 宠物状态文字 - 移到上方 */}
                  <div className={`absolute -top-16 left-1/2 transform -translate-x-1/2 rounded-full px-6 py-3 shadow-lg ${petMood === 'dead' ? 'bg-red-200/95' : petMood === 'sick' ? 'bg-yellow-200/95' : 'bg-white/95'}`}>
                    <p className={`text-xl font-bold ${petMood === 'dead' ? 'text-red-800' : petMood === 'sick' ? 'text-orange-800' : 'text-purple-800'}`}>
                      {getPetMessage()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 分离的互动按钮区域 - 删除药物按钮 */}
              <div className="absolute top-1/3 right-8 flex flex-col space-y-4">
                <Link href="/meal">
                  <button className="bg-gradient-to-r from-orange-400 to-red-500 text-white font-black text-lg py-4 px-6 rounded-full shadow-xl transform transition-all duration-200 hover:scale-110 active:scale-95 border-4 border-white pulse-animation">
                    🍽️ 食事をあげる
                  </button>
                </Link>
                
                <button className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-black text-lg py-4 px-6 rounded-full shadow-xl transform transition-all duration-200 hover:scale-110 active:scale-95 border-4 border-white">
                  🎮 遊ぶ
                </button>
              </div>
            </div>
          </div>

          {/* 右侧信息栏 */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white/95 rounded-2xl p-4 shadow-xl border-2 border-white/50">
              <h3 className="text-lg font-black text-purple-800 mb-3 text-center">🏆 実績</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <Award className="w-3 h-3 text-yellow-600" />
                    <span className="text-xs font-bold text-yellow-800">健康食品マスター</span>
                  </div>
                  <span className="text-xs text-yellow-600">3/5</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-green-100 to-green-200 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <Zap className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-bold text-green-800">連続記録</span>
                  </div>
                  <span className="text-xs text-green-600">7日</span>
                </div>
                
                <div className="flex items-center justify-between p-2 bg-gradient-to-r from-blue-100 to-blue-200 rounded-lg">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-blue-600" />
                    <span className="text-xs font-bold text-blue-800">レベルアップ</span>
                  </div>
                  <span className="text-xs text-blue-600">NEW!</span>
                </div>
              </div>
            </div>

            <div className="bg-white/95 rounded-2xl p-4 shadow-xl border-2 border-white/50">
              <h3 className="text-lg font-black text-purple-800 mb-3 text-center">📈 今日の記録</h3>
              
              <div className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-black text-green-600 mb-1">3</div>
                  <div className="text-xs text-gray-600">食事回数</div>
        </div>

                <div className="text-center">
                  <div className="text-2xl font-black text-blue-600 mb-1">2,150</div>
                  <div className="text-xs text-gray-600">総カロリー</div>
                </div>
                
                <div className="text-center">
                  <div className={`text-2xl font-black mb-1 ${healthScore < 30 ? 'text-red-600' : healthScore < 60 ? 'text-orange-500' : 'text-green-600'}`}>{healthScore}</div>
                  <div className="text-xs text-gray-600">健康スコア</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 手机版布局 */}
        <div className="lg:hidden flex flex-col h-full p-2">
          {/* 手机版顶部状态栏 */}
          <div className="bg-white/95 rounded-2xl p-3 mb-3 shadow-xl border-2 border-white/50">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4 text-red-500" />
                  <span className={`font-bold ${healthScore < 30 ? 'text-red-600' : healthScore < 60 ? 'text-orange-500' : 'text-green-500'}`}>{healthScore}%</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-yellow-600">Lv.12</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-black text-purple-800">
                  {formatTime(currentTime)}
                </div>
              </div>
            </div>
          </div>

          {/* 手机版宠物互动区域 */}
          <div className="flex-1 bg-white/10 rounded-3xl shadow-inner border-2 border-white/20 relative overflow-hidden">
            {/* 互动提示 */}
            <div className="absolute top-4 left-4 bg-white/90 rounded-full px-4 py-2 shadow-lg z-20">
              <span className="text-sm font-bold text-purple-800">👆 タップして遊ぼう！</span>
            </div>

            {/* 移除3D地毯效果 */}

            {/* 宠物显示区域 */}
            <div 
              className="absolute bottom-[80px] left-1/2 transform -translate-x-1/2 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 z-10"
              onClick={handlePetClick}
            >
              <div className="text-center">
                {/* 宠物角色 */}
                <div className="relative">
                  <div className={`${petMood === 'excited' ? 'bounce-animation' : petMood === 'sick' ? 'wiggle-animation' : petMood === 'dead' ? 'shake-animation' : 'bounce-animation'}`}>
                    {getPetComponent('small')}
                  </div>
                  {petMood === 'excited' && (
                    <div className="absolute -top-4 -right-4 text-4xl wiggle-animation">💫</div>
                  )}
                  {petMood === 'sick' && (
                    <div className="absolute -top-4 -left-4 text-3xl float-animation">🤧</div>
                  )}
                  {petMood === 'dead' && (
                    <div className="absolute -bottom-4 -right-4 text-3xl pulse-animation">⚰️</div>
                  )}
                  {lastFed > 3 && petMood === 'happy' && (
                    <div className="absolute -bottom-4 -left-4 text-3xl float-animation">😋</div>
                  )}
                </div>

                {/* 宠物状态文字 - 移到上方 */}
                <div className={`absolute -top-14 left-1/2 transform -translate-x-1/2 rounded-full px-4 py-2 shadow-lg ${petMood === 'dead' ? 'bg-red-200/95' : petMood === 'sick' ? 'bg-yellow-200/95' : 'bg-white/95'}`}>
                  <p className={`text-lg font-bold ${petMood === 'dead' ? 'text-red-800' : petMood === 'sick' ? 'text-orange-800' : 'text-purple-800'}`}>
                    {getPetMessage()}
                  </p>
                </div>
              </div>
            </div>

            {/* 手机版互动按钮 - 删除药物按钮 */}
            <div className="absolute top-1/4 right-4 flex flex-col space-y-3">
              <Link href="/meal">
                <button className="bg-gradient-to-r from-orange-400 to-red-500 text-white font-black text-sm py-3 px-4 rounded-full shadow-xl transform transition-all duration-200 hover:scale-110 active:scale-95 border-4 border-white pulse-animation">
                  🍽️ 食事
                </button>
              </Link>
              
              <button className="bg-gradient-to-r from-blue-400 to-purple-500 text-white font-black text-sm py-3 px-4 rounded-full shadow-xl transform transition-all duration-200 hover:scale-110 active:scale-95 border-4 border-white">
                🎮 遊ぶ
              </button>
            </div>
          </div>
        </div>

        {/* 底部导航栏 - 固定在底部 */}
        <div className="bg-white/95 rounded-t-2xl shadow-xl border-t-2 border-white/50 p-4">
          <div className="flex items-center justify-around max-w-md mx-auto">
            <Link href="/" className="flex flex-col items-center space-y-1 p-2 rounded-xl hover:bg-purple-100 transition-colors">
              <div className="bg-purple-100 rounded-full p-2">
                <Heart className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs font-bold text-purple-800">主頁</span>
            </Link>
            
            <Link href="/meal" className="flex flex-col items-center space-y-1 p-2 rounded-xl hover:bg-purple-100 transition-colors">
              <div className="bg-orange-100 rounded-full p-2">
                <Camera className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-xs font-bold text-purple-800">食事記録</span>
            </Link>
            
            <Link href="/history" className="flex flex-col items-center space-y-1 p-2 rounded-xl hover:bg-purple-100 transition-colors">
              <div className="bg-blue-100 rounded-full p-2">
                <History className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-purple-800">履歴</span>
            </Link>
            
            <Link href="/shop" className="flex flex-col items-center space-y-1 p-2 rounded-xl hover:bg-purple-100 transition-colors">
              <div className="bg-green-100 rounded-full p-2">
                <ShoppingBag className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs font-bold text-purple-800">商店</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Demo通知 - 绝对定位在右下角 */}
      <div className="fixed bottom-4 right-4 max-w-sm z-50">
        <DemoNotice />
      </div>
    </div>
  )
} 