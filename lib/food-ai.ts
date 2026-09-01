'use client'

import { assessMeal, type MealAssessment } from './meal-assessment'
import { STORAGE_KEYS, getUserProfile } from './storage'

export interface FoodRecognitionResult {
  isEdible: boolean
  foodName?: string
  description?: string
  funReview?: string
  ingredients: string[]
  nutritionEstimate: {
    calories: number
    carbs: number
    protein: number
    fat: number
    fiber: number
    vegetableServings?: number
  }
  healthyScore: number
  overallScore: number
  confidence: number
  message: string
  source?: string
  assessment?: MealAssessment
}

interface ApiResponse {
  isEdible: boolean
  ingredients: string[]
  source: string
  message?: string
  geminiAnalysis?: {
    foodName?: string
    description?: string
    funReview?: string
    healthScore?: number
    message?: string
    nutrition?: {
      calories: number
      carbs: number
      protein: number
      fat: number
      fiber: number
      vegetableServings?: number
    }
  }
}

/** 上传前压缩大图，避免 API 超时或失败 */
async function fileToCompressedBase64(file: File): Promise<string> {
  const maxWidth = file.size > 800_000 ? 960 : file.size > 400_000 ? 1120 : 1280
  const quality = file.size > 800_000 ? 0.72 : file.size > 400_000 ? 0.78 : 0.82

  if (typeof document === 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('图片读取失败'))
      reader.readAsDataURL(file)
    })
  }

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, maxWidth / bitmap.width)
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 不可用')
    ctx.drawImage(bitmap, 0, 0, w, h)
    bitmap.close()

    return canvas.toDataURL('image/jpeg', quality)
  } catch {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('图片读取失败'))
      reader.readAsDataURL(file)
    })
  }
}

async function recognizeFood(imageBase64: string): Promise<ApiResponse> {
  const profile = getUserProfile()
  try {
    const response = await fetch('/api/analyze-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, userProfile: profile }),
    })

    let payload: { isEdible?: boolean; ingredients?: string[]; source?: string; message?: string; geminiAnalysis?: ApiResponse['geminiAnalysis']; error?: string } = {}
    try {
      payload = await response.json()
    } catch {
      payload = {}
    }

    if (!response.ok) {
      const msg =
        payload.message ||
        (payload.error === 'CONFIG_MISSING'
          ? 'サーバー設定エラー：APIキー未設定です'
          : payload.error === 'PAYLOAD_TOO_LARGE'
            ? '画像が大きすぎます。別の写真をお試しください 📸'
            : `分析に失敗しました（${response.status}）`)
      return { isEdible: false, ingredients: [], source: 'error', message: msg, geminiAnalysis: payload.geminiAnalysis }
    }

    return {
      isEdible: payload.isEdible !== false,
      ingredients: payload.ingredients || [],
      source: payload.source || 'unknown',
      message: payload.message,
      geminiAnalysis: payload.geminiAnalysis,
    }
  } catch {
    return { isEdible: false, ingredients: [], source: 'error', message: 'ネットワークエラー。接続を確認してください 📡' }
  }
}

function savePetData(ingredients: string[], overallScore: number, nutrition: FoodRecognitionResult['nutritionEstimate']) {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(STORAGE_KEYS.consent) !== '1') return

  localStorage.setItem(STORAGE_KEYS.lastMealScore, overallScore.toString())
  localStorage.setItem(STORAGE_KEYS.lastFed, Date.now().toString())

  const current = parseInt(localStorage.getItem(STORAGE_KEYS.healthScore) || '75')
  const newScore = Math.round(current * 0.7 + overallScore * 0.3)
  localStorage.setItem(STORAGE_KEYS.healthScore, newScore.toString())

  const protein = parseInt(localStorage.getItem(STORAGE_KEYS.protein) || '0') + nutrition.protein
  const fat = parseInt(localStorage.getItem(STORAGE_KEYS.fat) || '0') + nutrition.fat
  localStorage.setItem(STORAGE_KEYS.protein, protein.toString())
  localStorage.setItem(STORAGE_KEYS.fat, fat.toString())

  const isCurry = ingredients.some(i => i.includes('curry') || i.includes('カレー'))
  if (isCurry) localStorage.setItem(STORAGE_KEYS.indianMode, 'true')
  else localStorage.removeItem(STORAGE_KEYS.indianMode)
}

export async function analyzeFoodImage(file: File): Promise<FoodRecognitionResult> {
  const base64 = await fileToCompressedBase64(file)
  const { isEdible, ingredients, source, message: apiMessage, geminiAnalysis } = await recognizeFood(base64)

  if (!isEdible) {
    return {
      isEdible: false,
      foodName: geminiAnalysis?.foodName,
      description: geminiAnalysis?.description,
      funReview: geminiAnalysis?.funReview,
      ingredients: [],
      nutritionEstimate: { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
      healthyScore: 0,
      overallScore: 0,
      confidence: 0,
      message: geminiAnalysis?.funReview || geminiAnalysis?.description || apiMessage || '食べ物の写真をアップロードしてください 🍽️',
      source,
    }
  }

  const profile = getUserProfile()
  const g = geminiAnalysis

  const nutrition = {
    calories: g?.nutrition?.calories ?? 400,
    carbs: g?.nutrition?.carbs ?? 50,
    protein: g?.nutrition?.protein ?? 15,
    fat: g?.nutrition?.fat ?? 12,
    fiber: g?.nutrition?.fiber ?? 3,
    vegetableServings: g?.nutrition?.vegetableServings ?? 0,
  }

  const healthScore = g?.healthScore ?? 50

  const assessment = assessMeal(
    {
      calories: nutrition.calories,
      carbs: nutrition.carbs,
      protein: nutrition.protein,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      vegetableServings: nutrition.vegetableServings,
    },
    profile,
    healthScore,
  )

  savePetData(ingredients, assessment.overallScore, nutrition)

  const funReview = g?.funReview || g?.message || assessment.message

  return {
    isEdible: true,
    foodName: g?.foodName,
    description: g?.description,
    funReview,
    ingredients,
    nutritionEstimate: nutrition,
    healthyScore: healthScore,
    overallScore: assessment.overallScore,
    confidence: 92,
    message: funReview,
    source,
    assessment,
  }
}
