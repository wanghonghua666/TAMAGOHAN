'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import DemoNotice from '@/components/DemoNotice'
import StatBar from '@/components/StatBar'
import PixelSpeechBubble from '@/components/PixelSpeechBubble'
import { UtensilsCrossed } from 'lucide-react'
import {
  STORAGE_KEYS,
  computePetMood,
  computeLevel,
  computeHunger,
  computeHappiness,
  getTodayStats,
  getMealHistory,
  getUserProfile,
  saveUserProfile,
  PET_IMAGES,
  DEX_FORMS,
  type PetMood,
  type UserProfileData,
} from '@/lib/storage'
import { computeDailyTargets } from '@/lib/meal-assessment'

const BACKGROUNDS = [
  { name: 'デフォルト', path: '/character-room-bg.png' },
  { name: '森', path: '/character-room-bg.png' },
]

function getPetMessageText(mood: PetMood, lastFed: number): string {
  const messages: Record<PetMood, string> = {
    dead: 'やばい...もっと健康的な食事を！',
    sick: 'うえぇ...ジャンクフードで気持ち悪い',
    fat: 'ちょっと太りすぎかも...運動しよう！',
    indian: 'カレー三昧！スパイシーだよ',
    strong: '元気だよ！健康的な食事ありがとう！',
    happy: lastFed > 3 ? 'お腹がすいたよ～' : '元気だよ！',
  }
  return messages[mood]
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-7rem)] flex items-center justify-center bg-gradient-to-b from-sky-200 to-green-100">
        <p className="text-lg font-bold text-purple-800">読み込み中...</p>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

function HomeContent() {
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentBackground, setCurrentBackground] = useState(0)
  const [showDex, setShowDex] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const [healthScore, setHealthScore] = useState(75)
  const [lastMealScore, setLastMealScore] = useState<number | null>(null)
  const [lastFed, setLastFed] = useState(0)
  const [proteinValue, setProteinValue] = useState(0)
  const [fatValue, setFatValue] = useState(0)
  const [indianMode, setIndianMode] = useState(false)
  const [level, setLevel] = useState(1)
  const [todayStats, setTodayStats] = useState({ count: 0, totalCalories: 0, healthScore: 75 })
  const [profile, setProfile] = useState<UserProfileData>({ weightKg: 60, heightCm: 170, goal: 'maintain', activity: 'moderate' })

  const petMood = computePetMood(healthScore, lastMealScore, proteinValue, fatValue, indianMode)
  const happiness = computeHappiness(healthScore, lastMealScore)
  const hunger = computeHunger(lastFed)

  const loadData = useCallback(() => {
    if (typeof window === 'undefined') return

    const saved = localStorage.getItem(STORAGE_KEYS.healthScore)
    setHealthScore(saved ? parseInt(saved) : 75)
    if (!saved) localStorage.setItem(STORAGE_KEYS.healthScore, '75')

    const meal = localStorage.getItem(STORAGE_KEYS.lastMealScore)
    setLastMealScore(meal ? parseInt(meal) : null)

    const fed = localStorage.getItem(STORAGE_KEYS.lastFed)
    if (fed) {
      setLastFed(Math.floor((Date.now() - parseInt(fed)) / 3600000))
    }

    setProteinValue(parseInt(localStorage.getItem(STORAGE_KEYS.protein) || '0'))
    setFatValue(parseInt(localStorage.getItem(STORAGE_KEYS.fat) || '0'))
    setIndianMode(!!localStorage.getItem(STORAGE_KEYS.indianMode))

    const bg = localStorage.getItem(STORAGE_KEYS.background)
    if (bg) setCurrentBackground(parseInt(bg))

    const meals = getMealHistory()
    setLevel(computeLevel(meals.length))
    setTodayStats(getTodayStats())
    setProfile(getUserProfile())
  }, [])

  useEffect(() => {
    setIsClient(true)
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!isClient) return
    const onResize = () => setIsDesktop(window.innerWidth >= 1024)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isClient])

  useEffect(() => {
    if (!isClient) return
    localStorage.setItem(`dex-${petMood}`, 'unlocked')
  }, [petMood, isClient])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const panel = searchParams.get('panel')
    if (panel === 'dex') setShowDex(true)
    if (panel === 'settings') setShowSettings(true)
  }, [searchParams])

  useEffect(() => {
    const onDex = () => setShowDex(true)
    const onSettings = () => setShowSettings(true)
    window.addEventListener('kukupin:open-dex', onDex)
    window.addEventListener('kukupin:open-settings', onSettings)
    return () => {
      window.removeEventListener('kukupin:open-dex', onDex)
      window.removeEventListener('kukupin:open-settings', onSettings)
    }
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-200 to-green-100">
        <div className="text-center">
          <Image src="/kukupin.png" alt="くっくぴん" width={160} height={160} className="mx-auto bounce-animation" />
          <p className="mt-4 text-lg font-bold text-purple-800">読み込み中...</p>
        </div>
      </div>
    )
  }

  const bgPath = isDesktop ? '/background2.png' : BACKGROUNDS[currentBackground].path
  const healthColor = healthScore < 30 ? 'bg-gradient-to-r from-red-500 to-red-400'
    : healthScore < 60 ? 'bg-gradient-to-r from-orange-400 to-yellow-400'
    : 'bg-gradient-to-r from-green-400 to-emerald-500'

  return (
    <div
      className="relative overflow-hidden"
      style={{
        minHeight: 'calc(100vh - 7rem)',
        backgroundImage: `url('${bgPath}')`,
        backgroundSize: isDesktop ? '100% 100%' : 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="flex flex-col relative z-10" style={{ minHeight: 'calc(100vh - 7rem)' }}>
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-5 p-5 flex-1 items-stretch">
          {/* 左：状态 */}
          <div className="lg:col-span-3 flex flex-col justify-center">
            <div className="game-panel game-panel-glass lg:p-6">
              <h3 className="panel-title lg:text-xl lg:mb-5">📊 ステータス</h3>
              <StatusRow label="🌟 レベル" value={`Lv.${level}`} color="text-yellow-600" large />
              <StatRow label="❤️ 健康度" value={`${healthScore}%`} barValue={healthScore} barColor={healthColor} large />
              <StatRow label="😊 幸福度" value={`${happiness}%`} barValue={happiness} barColor="bg-gradient-to-r from-green-400 to-emerald-500" large />
              <StatRow label="🍽️ 空腹度" value={`${hunger}%`} barValue={hunger} barColor="bg-gradient-to-r from-orange-400 to-red-400" large />
              <StatRow label="💪 タンパク質" value={String(proteinValue)} barValue={Math.min(100, proteinValue / 2)} barColor="bg-gradient-to-r from-purple-400 to-purple-600" large />
              <StatRow label="🍩 脂肪" value={String(fatValue)} barValue={Math.min(100, fatValue / 2)} barColor="bg-gradient-to-r from-pink-400 to-red-500" large />
              <p className="text-sm text-gray-500 text-center mt-3">最後の食事: {lastFed}時間前</p>
            </div>
          </div>

          {/* 中：宠物 */}
          <div className="lg:col-span-6 flex flex-col min-h-0">
            <PetArea mood={petMood} lastFed={lastFed} size="large" />
          </div>

          {/* 右：今日记录 */}
          <div className="lg:col-span-3 flex flex-col justify-center gap-5">
            <div className="game-panel game-panel-glass lg:p-6">
              <h3 className="panel-title lg:text-xl lg:mb-5">📈 今日の記録</h3>
              <div className="grid grid-cols-1 gap-5 text-center">
                <div><div className="text-4xl font-black text-green-600">{todayStats.count}</div><div className="text-sm text-gray-500 mt-1">食事回数</div></div>
                <div><div className="text-4xl font-black text-blue-600">{todayStats.totalCalories}</div><div className="text-sm text-gray-500 mt-1">総カロリー</div></div>
                <div><div className="text-4xl font-black text-purple-600">{healthScore}</div><div className="text-sm text-gray-500 mt-1">健康スコア</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* 移动版 */}
        <div className="lg:hidden flex flex-col flex-1 p-2">
          <div className="game-panel mb-2 py-2 px-3">
            <div className="flex justify-between items-center text-sm">
              <div className="flex gap-3">
                <span className="font-bold text-red-500">❤️ {healthScore}%</span>
                <span className="font-bold text-yellow-600">Lv.{level}</span>
              </div>
              <span className="font-bold text-purple-800 text-xs">
                {currentTime.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </div>
          </div>
          <PetArea mood={petMood} lastFed={lastFed} size="small" />
        </div>
      </div>

      <div className="fixed bottom-4 right-3 max-w-xs z-50 hidden md:block">
        <DemoNotice />
      </div>

      {/* 图鉴 */}
      {showDex && (
        <Modal onClose={() => setShowDex(false)} title="くっくぴん図鑑">
          <div className="grid grid-cols-3 gap-4">
            {DEX_FORMS.map(form => {
              const unlocked = form.id === 'happy' || localStorage.getItem(`dex-${form.id}`)
              return (
                <div key={form.id} className="flex flex-col items-center">
                  {unlocked ? (
                    <Image src={form.image} alt={form.label} width={72} height={72} />
                  ) : (
                    <div className="w-[72px] h-[72px] bg-gray-200 rounded-full flex items-center justify-center text-2xl text-gray-400">?</div>
                  )}
                  <span className="text-xs font-bold mt-1">{unlocked ? form.label : '？？'}</span>
                </div>
              )
            })}
          </div>
        </Modal>
      )}

      {/* 设置 */}
      {showSettings && (
        <Modal onClose={() => setShowSettings(false)} title="設定">
          <div className="space-y-4">
            {/* 用户体征 */}
            <div className="bg-purple-50 rounded-xl p-4 space-y-3">
              <h3 className="font-bold text-purple-800 text-sm">👤 あなたのプロフィール</h3>
              <p className="text-xs text-gray-500">体重に合わせて1食の目標量を計算します</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-medium text-gray-600">
                  体重 (kg)
                  <input type="number" min={30} max={200} value={profile.weightKg}
                    onChange={e => setProfile(p => ({ ...p, weightKg: Number(e.target.value) }))}
                    className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm" />
                </label>
                <label className="text-xs font-medium text-gray-600">
                  身長 (cm)
                  <input type="number" min={120} max={220} value={profile.heightCm}
                    onChange={e => setProfile(p => ({ ...p, heightCm: Number(e.target.value) }))}
                    className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm" />
                </label>
              </div>
              <label className="text-xs font-medium text-gray-600 block">
                目標
                <select value={profile.goal} onChange={e => setProfile(p => ({ ...p, goal: e.target.value as UserProfileData['goal'] }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm">
                  <option value="maintain">体重維持</option>
                  <option value="lose">減量</option>
                  <option value="gain">増量</option>
                </select>
              </label>
              <label className="text-xs font-medium text-gray-600 block">
                活動量
                <select value={profile.activity} onChange={e => setProfile(p => ({ ...p, activity: e.target.value as UserProfileData['activity'] }))}
                  className="mt-1 w-full border rounded-lg px-2 py-1.5 text-sm">
                  <option value="low">少ない（デスクワーク）</option>
                  <option value="moderate">普通</option>
                  <option value="high">多い（運動習慣あり）</option>
                </select>
              </label>
              {(() => {
                const t = computeDailyTargets(profile)
                const per = { calories: Math.round(t.calories/3), protein: Math.round(t.protein/3), carbs: Math.round(t.carbs/3), vegetables: Math.round(t.vegetables/3*10)/10 }
                return (
                  <div className="text-xs text-gray-600 bg-white rounded-lg p-2">
                    <p className="font-bold text-purple-700 mb-1">1食の目標目安</p>
                    <p>🔥 {per.calories} kcal · 💪 {per.protein}g タンパク質 · 🍚 {per.carbs}g 炭水化物 · 🥬 {per.vegetables}份 野菜</p>
                  </div>
                )
              })()}
              <button
                onClick={() => { saveUserProfile(profile); setShowSettings(false) }}
                className="w-full bg-purple-500 text-white font-bold py-2 rounded-full text-sm"
              >
                プロフィールを保存
              </button>
            </div>

            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-600 mb-3">スコア・図鑑などをブラウザのローカルストレージに保存します。</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">データ保存</span>
                <button
                  onClick={() => {
                    const on = localStorage.getItem(STORAGE_KEYS.consent) === '1'
                    if (on) localStorage.removeItem(STORAGE_KEYS.consent)
                    else localStorage.setItem(STORAGE_KEYS.consent, '1')
                    setShowSettings(false)
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-bold text-white ${localStorage.getItem(STORAGE_KEYS.consent) === '1' ? 'bg-red-500' : 'bg-green-500'}`}
                >
                  {localStorage.getItem(STORAGE_KEYS.consent) === '1' ? '無効にする' : '有効にする'}
                </button>
              </div>
            </div>
            <button
              onClick={() => {
                if (confirm('すべてのデータを削除しますか？')) {
                  localStorage.clear()
                  loadData()
                  setShowSettings(false)
                }
              }}
              className="w-full bg-red-500 text-white font-bold py-2 rounded-full"
            >
              すべてのデータを削除
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function StatusRow({ label, value, color, large }: { label: string; value: string; color: string; large?: boolean }) {
  return (
    <div className={`flex justify-between items-center ${large ? 'mb-3' : 'mb-2'}`}>
      <span className={`font-bold text-gray-600 ${large ? 'text-sm' : 'text-xs'}`}>{label}</span>
      <span className={`font-black ${color} ${large ? 'text-2xl' : 'text-lg'}`}>{value}</span>
    </div>
  )
}

function StatRow({ label, value, barValue, barColor, large }: { label: string; value: string; barValue: number; barColor: string; large?: boolean }) {
  return (
    <div className={large ? 'mb-3' : 'mb-2'}>
      <div className="flex justify-between mb-1">
        <span className={`font-bold text-gray-600 ${large ? 'text-sm' : 'text-xs'}`}>{label}</span>
        <span className={`font-black text-gray-700 ${large ? 'text-base' : 'text-sm'}`}>{value}</span>
      </div>
      <StatBar value={barValue} colorClass={barColor} />
    </div>
  )
}

function PetArea({ mood, lastFed, size }: { mood: PetMood; lastFed: number; size: 'large' | 'small' }) {
  const dim = size === 'large' ? 340 : 280
  const anim = mood === 'dead' ? 'shake-animation' : mood === 'sick' || mood === 'fat' ? 'wiggle-animation' : 'bounce-animation'
  const message = getPetMessageText(mood, lastFed)

  return (
    <div className={`flex-1 rounded-3xl relative min-h-[420px] lg:min-h-0 ${size === 'small' ? 'bg-white/10 shadow-inner border-2 border-white/20 overflow-hidden' : ''}`}>
      {/* 宠物 + 气泡（气泡在上，尖角指向小熊） */}
      <div
        className={`absolute left-1/2 -translate-x-1/2 z-10 flex flex-col items-center w-full max-w-md px-4 ${
          size === 'small' ? 'bottom-[88px]' : 'bottom-[10%]'
        }`}
      >
        <div className="mb-3 w-full flex justify-center">
          <PixelSpeechBubble text={message} size={size} />
        </div>
        <div className="cursor-pointer hover:scale-105 active:scale-95 transition-transform">
          <Image
            src={PET_IMAGES[mood]}
            alt="くっくぴん"
            width={dim}
            height={dim}
            className={anim}
            priority
            style={{ imageRendering: 'auto' }}
          />
        </div>
      </div>

      <div className={`absolute flex flex-col gap-3 ${size === 'small' ? 'bottom-6 right-4' : 'top-1/2 -translate-y-1/2 right-4 lg:right-8'}`}>
        <Link href="/meal" title="食事を記録">
          {size === 'small' ? (
            <div className="w-[4.5rem] h-[4.5rem] rounded-full bg-white shadow-lg flex items-center justify-center border-2 border-orange-100 transition-transform hover:scale-105 active:scale-95">
              <UtensilsCrossed className="w-9 h-9 text-orange-500" strokeWidth={2.5} />
            </div>
          ) : (
            <div className="flex items-center gap-2.5 bg-white/95 backdrop-blur-sm rounded-full pl-4 pr-5 py-3 shadow-lg border-2 border-orange-100 transition-transform hover:scale-105 active:scale-95">
              <UtensilsCrossed className="w-7 h-7 text-orange-500 shrink-0" strokeWidth={2.5} />
              <span className="font-bold text-orange-600 text-base whitespace-nowrap">食事をあげる</span>
            </div>
          )}
        </Link>
      </div>
    </div>
  )
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-xl font-black text-purple-800 mb-4 text-center">{title}</h2>
        {children}
        <button className="mt-4 mx-auto block bg-purple-500 text-white font-bold px-6 py-2 rounded-full" onClick={onClose}>閉じる</button>
      </div>
    </div>
  )
}
