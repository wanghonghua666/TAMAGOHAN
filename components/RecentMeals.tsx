'use client'

import React from 'react'

// 简化的食事记录类型
interface SimpleMeal {
  id: string
  name: string
  emoji: string
  healthScore: number
}

export default function RecentMeals() {
  // 简化的示例数据
  const meals: SimpleMeal[] = [
    {
      id: '1',
      name: '野菜サラダ',
      emoji: '🥗',
      healthScore: 85,
    },
    {
      id: '2', 
      name: 'ハンバーガー',
      emoji: '🍔',
      healthScore: 35,
    },
    {
      id: '3',
      name: 'お寿司',
      emoji: '🍣',
      healthScore: 80,
    }
  ]

  return (
    <div>
      <h3 className="text-xl font-black text-blue-800 text-center mb-4" style={{ fontFamily: 'Fredoka' }}>
        📚 最近の食事
      </h3>
      <div className="space-y-3">
        {meals.map((meal) => (
          <div 
            key={meal.id}
            className="flex items-center gap-3 p-3 bg-white/80 rounded-xl hover:bg-white/90 transition-all duration-200"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 flex items-center justify-center text-xl border-2 border-white shadow-sm">
              {meal.emoji}
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-800 text-sm" style={{ fontFamily: 'Fredoka' }}>
                {meal.name}
              </div>
            </div>
            <div className={`text-xs font-bold rounded-full px-2 py-1 ${
              meal.healthScore >= 70 
                ? 'bg-green-200 text-green-700'
                : meal.healthScore >= 50
                ? 'bg-yellow-200 text-yellow-700'
                : 'bg-red-200 text-red-700'
            }`}>
              {meal.healthScore}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 