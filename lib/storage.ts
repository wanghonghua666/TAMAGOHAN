export const STORAGE_KEYS = {
  consent: 'kukupin-consent',
  healthScore: 'pet-health-score',
  lastMealScore: 'last-meal-score',
  lastFed: 'last-fed-time',
  protein: 'protein-value',
  fat: 'fat-value',
  indianMode: 'indian-mode',
  mealHistory: 'meal-history',
  background: 'selected-background',
  userProfile: 'kukupin-user-profile',
  todayMacros: 'kukupin-today-macros',
} as const

export interface UserProfileData {
  weightKg: number
  heightCm: number
  goal: 'maintain' | 'lose' | 'gain'
  activity: 'low' | 'moderate' | 'high'
}

export function getUserProfile(): UserProfileData {
  if (typeof window === 'undefined') {
    return { weightKg: 60, heightCm: 170, goal: 'maintain', activity: 'moderate' }
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.userProfile)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return { weightKg: 60, heightCm: 170, goal: 'maintain', activity: 'moderate' }
}

export function saveUserProfile(profile: UserProfileData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.userProfile, JSON.stringify(profile))
}

export interface MealHistoryRecord {
  id: number
  fileName: string
  timestamp: string
  analysis: {
    score: number
    message: string
    ingredients: string[]
    categories: Array<{ name: string; confidence: number; isHealthy: boolean }>
    nutrition: { calories: number; carbs: number; protein: number; fat: number; fiber: number }
  }
  preview?: string | null
}

export function hasConsent(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEYS.consent) === '1'
}

export function getMealHistory(): MealHistoryRecord[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.mealHistory) || '[]')
  } catch {
    return []
  }
}


export function getTodayStats() {
  const meals = getMealHistory()
  const today = new Date().toDateString()
  const todayMeals = meals.filter(m => new Date(m.timestamp).toDateString() === today)
  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.analysis?.nutrition?.calories || 0), 0)
  const healthScore = parseInt(localStorage.getItem(STORAGE_KEYS.healthScore) || '75')
  return { count: todayMeals.length, totalCalories, healthScore }
}

export function computeLevel(mealCount: number): number {
  return Math.min(99, Math.floor(mealCount / 3) + 1)
}

export function computeHunger(lastFedHours: number): number {
  return Math.min(100, Math.round(lastFedHours * 15))
}

export function computeHappiness(healthScore: number, lastMealScore: number | null): number {
  const base = healthScore
  const mealBonus = lastMealScore !== null ? Math.round(lastMealScore * 0.2) : 0
  return Math.min(100, Math.round(base * 0.7 + mealBonus))
}

export type PetMood = 'happy' | 'strong' | 'sick' | 'dead' | 'fat' | 'indian'

export function computePetMood(
  healthScore: number,
  lastMealScore: number | null,
  proteinValue: number,
  fatValue: number,
  indianMode: boolean
): PetMood {
  if (indianMode) return 'indian'
  if (lastMealScore !== null && lastMealScore < 20) return 'sick'
  if (fatValue >= 75) return 'fat'
  if (healthScore < 30) return 'dead'
  if (proteinValue >= 75) return 'strong'
  return 'happy'
}

export const PET_IMAGES: Record<PetMood, string> = {
  dead: '/kukupinDead.png',
  sick: '/KukupinPuke.png',
  strong: '/KukupinStrong.png',
  fat: '/kukupinFatDebu-Photoroom.png',
  indian: '/kukupinIndian.png',
  happy: '/kukupinHappy.png',
}

export const DEX_FORMS = [
  { id: 'happy', label: 'ハッピー', image: '/kukupinHappy.png' },
  { id: 'strong', label: 'パワフル', image: '/KukupinStrong.png' },
  { id: 'fat', label: 'ぽっちゃり', image: '/kukupinFatDebu-Photoroom.png' },
  { id: 'sick', label: 'ぐったり', image: '/KukupinPuke.png' },
  { id: 'dead', label: '危険', image: '/kukupinDead.png' },
  { id: 'indian', label: 'カレー', image: '/kukupinIndian.png' },
] as const
