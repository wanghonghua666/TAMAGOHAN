'use client'

import { analyzeNutrition } from './nutrition'
import { assessMeal, type MealAssessment } from './meal-assessment'
import { STORAGE_KEYS, getUserProfile } from './storage'

export interface FoodRecognitionResult {
  isEdible: boolean
  ingredients: string[]
  categories: Array<{ name: string; confidence: number; isHealthy: boolean }>
  nutritionEstimate: {
    calories: number
    carbs: number
    protein: number
    fat: number
    fiber: number
    vitamins: string[]
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

async function recognizeFood(imageBase64: string): Promise<ApiResponse> {
  const profile = getUserProfile()
  try {
    const response = await fetch('/api/analyze-food', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, userProfile: profile }),
    })
    if (!response.ok) throw new Error(`API ${response.status}`)
    const result = await response.json()
    return {
      isEdible: result.isEdible !== false,
      ingredients: result.ingredients || [],
      source: result.source || 'unknown',
      message: result.message,
      geminiAnalysis: result.geminiAnalysis,
    }
  } catch {
    return { isEdible: false, ingredients: [], source: 'error', message: '分析に失敗しました' }
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
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })

  const { isEdible, ingredients, source, message: apiMessage, geminiAnalysis } = await recognizeFood(base64)

  if (!isEdible) {
    return {
      isEdible: false,
      ingredients: [],
      categories: [],
      nutritionEstimate: { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, vitamins: [] },
      healthyScore: 0,
      overallScore: 0,
      confidence: 0,
      message: apiMessage || '食べ物の写真をアップロードしてください 🍽️',
      source,
    }
  }

  const profile = getUserProfile()
  const localAnalysis = analyzeNutrition(ingredients)

  const nutrition = geminiAnalysis?.nutrition
    ? {
        calories: geminiAnalysis.nutrition.calories,
        carbs: geminiAnalysis.nutrition.carbs,
        protein: geminiAnalysis.nutrition.protein,
        fat: geminiAnalysis.nutrition.fat,
        fiber: geminiAnalysis.nutrition.fiber,
        vegetableServings: geminiAnalysis.nutrition.vegetableServings,
        vitamins: localAnalysis.nutrition.vitamins,
      }
    : { ...localAnalysis.nutrition, vegetableServings: undefined }

  const healthScore = geminiAnalysis?.healthScore ?? localAnalysis.healthScore

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

  return {
    isEdible: true,
    ingredients,
    categories: localAnalysis.categories,
    nutritionEstimate: nutrition,
    healthyScore: healthScore,
    overallScore: assessment.overallScore,
    confidence: 92,
    message: assessment.message,
    source,
    assessment,
  }
}
