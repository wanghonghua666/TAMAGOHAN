'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, Filter } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function HistoryPage() {
  const { user } = useAuth()
  const [meals, setMeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, week, month
  const [sortBy, setSortBy] = useState('date') // date, score
  const router = useRouter()

  // 未ログインユーザーのリダイレクト
  if (!user) {
    router.push('/login')
    return null
  }

  useEffect(() => {
    if (user) {
      // TODO: Firestoreから食事履歴を取得
      // 現在はダミーデータを使用
      const mockMeals = [
        {
          id: 'meal_1',
          userId: user.id,
          imageUrl: '🥗',
          analysisResult: {
            ingredients: ['レタス', 'トマト', 'キュウリ', 'チキン'],
            categories: [
              { name: '野菜', confidence: 85, isHealthy: true },
              { name: 'タンパク質', confidence: 70, isHealthy: true }
            ]
          },
          healthScore: 85,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        },
        {
          id: 'meal_2',
          userId: user.id,
          imageUrl: '🍔',
          analysisResult: {
            ingredients: ['ハンバーガー', 'フライドポテト'],
            categories: [
              { name: 'ファストフード', confidence: 95, isHealthy: false }
            ]
          },
          healthScore: 25,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        {
          id: 'meal_3',
          userId: user.id,
          imageUrl: '🍽️',
          analysisResult: {
            ingredients: ['ご飯', '焼き魚', '野菜炒め'],
            categories: [
              { name: '和食', confidence: 90, isHealthy: true }
            ]
          },
          healthScore: 72,
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'meal_4',
          userId: user.id,
          imageUrl: '🍕',
          analysisResult: {
            ingredients: ['ピザ', 'チーズ'],
            categories: [
              { name: 'ファストフード', confidence: 88, isHealthy: false }
            ]
          },
          healthScore: 35,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        {
          id: 'meal_5',
          userId: user.id,
          imageUrl: '🥙',
          analysisResult: {
            ingredients: ['ラップ', '野菜', 'チキン'],
            categories: [
              { name: 'バランス食', confidence: 80, isHealthy: true }
            ]
          },
          healthScore: 68,
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
        }
      ]

      setTimeout(() => {
        setMeals(mockMeals)
        setLoading(false)
      }, 1000)
    }
  }, [user])

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 70) return <TrendingUp className="w-4 h-4 text-green-600" />
    return <TrendingDown className="w-4 h-4 text-red-600" />
  }

  const calculateAverageScore = () => {
    if (meals.length === 0) return 0
    const total = meals.reduce((sum, meal) => sum + meal.healthScore, 0)
    return Math.round(total / meals.length)
  }

  const getHealthTrend = () => {
    if (meals.length < 2) return 'stable'
    const recent = meals.slice(0, Math.ceil(meals.length / 2))
    const older = meals.slice(Math.ceil(meals.length / 2))
    
    const recentAvg = recent.reduce((sum, meal) => sum + meal.healthScore, 0) / recent.length
    const olderAvg = older.reduce((sum, meal) => sum + meal.healthScore, 0) / older.length
    
    if (recentAvg > olderAvg + 5) return 'improving'
    if (recentAvg < olderAvg - 5) return 'declining'
    return 'stable'
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-4 p-4 bg-gray-100 rounded-lg">
              <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const trend = getHealthTrend()
  const averageScore = calculateAverageScore()

  return (
    <div className="max-w-4xl mx-auto">
      {/* ヘッダー */}
      <div className="mb-8">
        <Link href="/" className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4">
          <ArrowLeft size={20} className="mr-2" />
          ホームに戻る
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">食事履歴</h1>
        <p className="text-gray-600">
          これまでの食事記録と健康スコアの推移を確認できます
        </p>
      </div>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card text-center">
          <div className="text-3xl font-bold text-primary-600 mb-2">
            {meals.length}
          </div>
          <div className="text-sm text-gray-600">総記録数</div>
        </div>
        
        <div className="card text-center">
          <div className="text-3xl font-bold text-secondary-600 mb-2">
            {averageScore}
          </div>
          <div className="text-sm text-gray-600">平均スコア</div>
        </div>
        
        <div className="card text-center">
          <div className={`text-3xl mb-2 ${
            trend === 'improving' ? 'text-green-600' :
            trend === 'declining' ? 'text-red-600' : 'text-blue-600'
          }`}>
            {trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️'}
          </div>
          <div className="text-sm text-gray-600">
            {trend === 'improving' ? '改善傾向' : 
             trend === 'declining' ? '要注意' : '安定'}
          </div>
        </div>
      </div>

      {/* フィルターとソート */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter size={16} className="text-gray-600" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">すべて</option>
            <option value="week">過去1週間</option>
            <option value="month">過去1ヶ月</option>
          </select>
        </div>
        
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="date">日付順</option>
          <option value="score">スコア順</option>
        </select>
      </div>

      {/* 食事履歴リスト */}
      {meals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            まだ食事記録がありません
          </h3>
          <p className="text-gray-600 mb-6">
            最初の食事を記録して、キャラクターを育て始めましょう！
          </p>
          <Link href="/meal" className="btn-primary">
            食事を記録する
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => (
            <div key={meal.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4">
                {/* 食事アイコン */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                    {meal.imageUrl}
                  </div>
                </div>

                {/* 食事情報 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">
                      {meal.analysisResult.ingredients.slice(0, 3).join(', ')}
                      {meal.analysisResult.ingredients.length > 3 && '...'}
                    </h3>
                    <div className="flex items-center space-x-2">
                      {getScoreIcon(meal.healthScore)}
                      <span className={`text-lg font-bold ${getScoreColor(meal.healthScore)}`}>
                        {meal.healthScore}点
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formatDate(meal.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {meal.analysisResult.categories.map((category: any, index: number) => (
                        <span 
                          key={index}
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            category.isHealthy 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {category.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* アクションボタン */}
      <div className="text-center mt-8">
        <Link href="/meal" className="btn-primary text-lg px-8 py-3">
          新しい食事を記録する
        </Link>
      </div>
    </div>
  )
} 