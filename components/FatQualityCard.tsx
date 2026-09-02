'use client'

import React from 'react'
import StatBar from './StatBar'
import type { FatQualityResult } from '@/lib/fat-quality'

const GRADE_COLOR: Record<FatQualityResult['grade'], string> = {
  excellent: 'bg-gradient-to-r from-emerald-400 to-teal-500',
  good: 'bg-gradient-to-r from-green-400 to-lime-500',
  mixed: 'bg-gradient-to-r from-yellow-400 to-orange-400',
  poor: 'bg-gradient-to-r from-red-400 to-pink-500',
}

const CAT_LABEL = {
  healthy: { emoji: '🐟', label: '良質', color: 'text-emerald-600 bg-emerald-50' },
  neutral: { emoji: '🥚', label: '中性', color: 'text-gray-600 bg-gray-100' },
  harmful: { emoji: '🍟', label: '悪質', color: 'text-red-600 bg-red-50' },
} as const

export default function FatQualityCard({ fatQuality, targetFat }: {
  fatQuality: FatQualityResult
  targetFat: number
}) {
  const { breakdown, qualityScore, labelJa, sources, tips } = fatQuality
  const fatPercent = targetFat > 0 ? Math.round((breakdown.total / targetFat) * 100) : 0

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="font-bold text-gray-900">脂質分析</h4>
          <p className="text-sm text-gray-600 mt-1">{labelJa}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-black text-purple-700">{qualityScore}</div>
          <div className="text-xs text-gray-500">脂質スコア</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="font-medium text-gray-700">総脂質</span>
          <span className="text-gray-600">{breakdown.total}g / {targetFat}g（{fatPercent}%）</span>
        </div>
        <StatBar value={Math.min(150, fatPercent)} max={150} colorClass={GRADE_COLOR[fatQuality.grade]} />
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        {(['healthy', 'neutral', 'harmful'] as const).map(cat => {
          const meta = CAT_LABEL[cat]
          const grams = breakdown[cat]
          return (
            <div key={cat} className={`rounded-xl p-3 text-center ${meta.color}`}>
              <div className="text-lg">{meta.emoji}</div>
              <div className="text-xs font-bold">{meta.label}</div>
              <div className="text-sm font-black mt-1">{grams}g</div>
            </div>
          )
        })}
      </div>

      {sources.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-bold text-gray-500 mb-2">脂質の主な来源</p>
          <div className="flex flex-wrap gap-2">
            {sources.slice(0, 5).map((s, i) => {
              const meta = CAT_LABEL[s.category]
              return (
                <span key={i} className={`text-xs px-2 py-1 rounded-full ${meta.color}`}>
                  {meta.emoji} {s.name}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {tips.length > 0 && (
        <ul className="text-sm text-gray-700 space-y-1">
          {tips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="text-orange-500">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
