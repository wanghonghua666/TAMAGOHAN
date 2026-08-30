'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Filter } from 'lucide-react'
import Link from 'next/link'
import { getMealHistory, type MealHistoryRecord } from '@/lib/storage'

export default function HistoryPage() {
  const [meals, setMeals] = useState<MealHistoryRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sortBy, setSortBy] = useState('date')

  useEffect(() => {
    setMeals(getMealHistory())
    setLoading(false)
  }, [])

  const filtered = useMemo(() => {
    let list = [...meals]
    const now = Date.now()
    if (filter === 'week') {
      list = list.filter(m => now - new Date(m.timestamp).getTime() < 7 * 86400000)
    } else if (filter === 'month') {
      list = list.filter(m => now - new Date(m.timestamp).getTime() < 30 * 86400000)
    }
    if (sortBy === 'score') {
      list.sort((a, b) => b.analysis.score - a.analysis.score)
    }
    return list
  }, [meals, filter, sortBy])

  const averageScore = filtered.length
    ? Math.round(filtered.reduce((s, m) => s + m.analysis.score, 0) / filtered.length)
    : 0

  const trend = useMemo(() => {
    if (filtered.length < 2) return 'stable'
    const half = Math.ceil(filtered.length / 2)
    const recent = filtered.slice(0, half)
    const older = filtered.slice(half)
    const rAvg = recent.reduce((s, m) => s + m.analysis.score, 0) / recent.length
    const oAvg = older.reduce((s, m) => s + m.analysis.score, 0) / older.length
    if (rAvg > oAvg + 5) return 'improving'
    if (rAvg < oAvg - 5) return 'declining'
    return 'stable'
  }, [filtered])

  const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso))

  const scoreColor = (s: number) =>
    s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : s >= 40 ? 'text-orange-600' : 'text-red-600'

  if (loading) {
    return <div className="animate-pulse h-64 bg-white/50 rounded-2xl" />
  }

  return (
    <div>
      <Link href="/" className="inline-flex items-center text-purple-600 hover:text-purple-800 font-bold mb-4">
        <ArrowLeft size={18} className="mr-1" /> ホームに戻る
      </Link>

      <div className="game-card mb-6">
        <h1 className="text-2xl font-black text-purple-800 mb-1">食事履歴</h1>
        <p className="text-gray-600 text-sm">記録した食事と健康スコアの推移</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center py-4">
          <div className="text-2xl font-black text-purple-600">{filtered.length}</div>
          <div className="text-xs text-gray-500">記録数</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl font-black text-green-600">{averageScore}</div>
          <div className="text-xs text-gray-500">平均スコア</div>
        </div>
        <div className="card text-center py-4">
          <div className="text-2xl">{trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️'}</div>
          <div className="text-xs text-gray-500">{trend === 'improving' ? '改善中' : trend === 'declining' ? '要注意' : '安定'}</div>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex items-center gap-1">
          <Filter size={14} className="text-gray-500" />
          <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded-lg px-2 py-1 text-sm">
            <option value="all">すべて</option>
            <option value="week">1週間</option>
            <option value="month">1ヶ月</option>
          </select>
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded-lg px-2 py-1 text-sm">
          <option value="date">日付順</option>
          <option value="score">スコア順</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-3">📝</div>
          <h3 className="font-bold text-gray-800 mb-2">まだ記録がありません</h3>
          <p className="text-gray-500 text-sm mb-4">食事を記録してくっくぴんを育てましょう！</p>
          <Link href="/meal" className="btn-primary">食事を記録する</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(meal => (
            <div key={meal.id} className="card flex gap-4 items-center">
              {meal.preview ? (
                <img src={meal.preview} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 bg-orange-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-bold text-gray-800 truncate">
                    {meal.analysis.ingredients.slice(0, 3).join(', ')}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                    {meal.analysis.score >= 70
                      ? <TrendingUp className="w-4 h-4 text-green-500" />
                      : <TrendingDown className="w-4 h-4 text-red-500" />}
                    <span className={`font-black ${scoreColor(meal.analysis.score)}`}>{meal.analysis.score}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar size={12} />
                  {formatDate(meal.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-center mt-6">
        <Link href="/meal" className="btn-primary">新しい食事を記録</Link>
      </div>
    </div>
  )
}
