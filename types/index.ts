// ユーザー関連の型定義
export interface User {
  id: string
  email: string
  displayName?: string
  photoURL?: string
  createdAt: Date
  updatedAt: Date
}

// キャラクター関連の型定義
export interface Character {
  id: string
  userId: string
  name: string
  level: number
  healthScore: number
  appearance: CharacterAppearance
  attributes: CharacterAttributes
  createdAt: Date
  updatedAt: Date
}

export interface CharacterAppearance {
  imageUrl: string
  bodyType: 'slim' | 'normal' | 'chubby' | 'fat'
  style: 'normal' | 'athletic' | 'vegetarian' | 'junk'
  color: string
}

export interface CharacterAttributes {
  health: number // 0-100
  vegetarianLevel: number // 0-100
  junkFoodLevel: number // 0-100
  balanceLevel: number // 0-100
}

// 食事記録関連の型定義
export interface MealRecord {
  id: string
  userId: string
  imageUrl: string
  imagePath: string
  analysisResult: FoodAnalysis
  healthScore: number
  createdAt: Date
}

export interface FoodAnalysis {
  ingredients: string[]
  categories: FoodCategory[]
  nutritionEstimate: NutritionEstimate
  healthyScore: number
  confidence: number
}

export interface FoodCategory {
  name: string
  confidence: number
  isHealthy: boolean
}

export interface NutritionEstimate {
  calories: number
  carbs: number
  protein: number
  fat: number
  fiber: number
  vitamins: string[]
}

// API レスポンス用の型定義
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 食材認識APIの型定義（将来の拡張用）
export interface ImageAnalysisRequest {
  imageData: string | File
  apiProvider: 'google' | 'clarifai' | 'spoonacular' | 'mock'
}

export interface MockAnalysisResult {
  type: 'junk' | 'vegetable' | 'balanced' | 'protein' | 'carbs'
  score: number
  message: string
} 