import type { UserProfile } from './meal-assessment'

export const GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
] as const

export interface GeminiFoodResult {
  isEdible: boolean
  foodName?: string
  description?: string
  funReview?: string
  ingredients: string[]
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
  rejectReason?: string
}

export function parseBase64Image(imageBase64: string): { mimeType: string; data: string } {
  const match = imageBase64.match(/^data:(image\/[\w+.-]+);base64,(.+)$/)
  if (match) return { mimeType: match[1], data: match[2] }
  return { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 }
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? Math.round(n) : fallback
}

export function buildFoodPrompt(profile: UserProfile): string {
  return `Food analyst for Japanese pet game 「くっくぴん」. User: ${profile.weightKg}kg, goal=${profile.goal}.
Packaged meals, bento, drinks, snacks = edible. Return ONLY JSON:
{"isEdible":bool,"foodName":"Japanese name","description":"1-2 short Japanese sentences","funReview":"1-2 playful Japanese sentences as pet くっくぴん with emoji","ingredients":["english lowercase"],"healthScore":0-100,"nutrition":{"calories":n,"carbs":n,"protein":n,"fat":n,"fiber":n,"vegetableServings":n},"rejectReason":"only if not food"}
Estimate one visible portion. healthScore=food quality only.`
}

export function extractGeminiJson(text: string): GeminiFoodResult | null {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1))

    if (parsed.isEdible === false) {
      return {
        isEdible: false,
        ingredients: [],
        foodName: parsed.foodName,
        description: parsed.description,
        funReview: parsed.funReview,
        rejectReason: parsed.rejectReason || 'not_food',
        message: parsed.funReview || parsed.message || parsed.description,
      }
    }

    const foodName = typeof parsed.foodName === 'string' ? parsed.foodName.trim() : ''
    let ingredients: string[] = Array.isArray(parsed.ingredients)
      ? parsed.ingredients.map((i: string) => String(i).toLowerCase().trim()).filter(Boolean)
      : []
    if (ingredients.length === 0 && foodName) ingredients = [foodName]

    const nutrition = parsed.nutrition
      ? {
          calories: num(parsed.nutrition.calories, 400),
          carbs: num(parsed.nutrition.carbs, 50),
          protein: num(parsed.nutrition.protein, 15),
          fat: num(parsed.nutrition.fat, 12),
          fiber: num(parsed.nutrition.fiber, 3),
          vegetableServings: num(parsed.nutrition.vegetableServings, 0),
        }
      : undefined

    return {
      isEdible: true,
      foodName,
      description: typeof parsed.description === 'string' ? parsed.description : undefined,
      funReview: typeof parsed.funReview === 'string' ? parsed.funReview : undefined,
      ingredients,
      healthScore: typeof parsed.healthScore === 'number' ? parsed.healthScore : 50,
      message: parsed.funReview || parsed.message,
      nutrition,
    }
  } catch {
    return null
  }
}
