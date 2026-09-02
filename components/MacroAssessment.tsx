'use client'

import React from 'react'
import StatBar from './StatBar'
import type { MacroStatus } from '@/lib/meal-assessment'

const STATUS_COLOR: Record<MacroStatus['status'], string> = {
  low: 'bg-gradient-to-r from-orange-400 to-yellow-400',
  ok: 'bg-gradient-to-r from-green-400 to-emerald-500',
  high: 'bg-gradient-to-r from-red-400 to-pink-500',
}

const STATUS_LABEL: Record<MacroStatus['status'], string> = {
  low: '不足',
  ok: 'OK',
  high: '過多',
}

export default function MacroAssessment({ macros, portionScore }: {
  macros: MacroStatus[]
  portionScore: number
}) {
  return (
    <div className="card">
      <h4 className="font-bold text-gray-900 mb-1">栄養バランス（1食あたり目標比）</h4>
      <p className="text-xs text-gray-500 mb-4">份量スコア: {portionScore}/100</p>
      <div className="space-y-3">
        {macros.map(m => (
          <div key={m.label}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-gray-700">{m.label}</span>
                <span className="text-gray-600">
                {m.actual}{m.unit} / {m.target}{m.unit}
                <span className={`ml-2 text-xs font-bold ${
                  m.status === 'ok' ? 'text-green-600' : m.status === 'low' ? 'text-orange-500' : 'text-red-500'
                }`}>
                  {STATUS_LABEL[m.status]}{m.note ? ` · ${m.note}` : ''}
                </span>
              </span>
            </div>
            <StatBar value={Math.min(150, m.percent)} max={150} colorClass={STATUS_COLOR[m.status]} />
          </div>
        ))}
      </div>
    </div>
  )
}
