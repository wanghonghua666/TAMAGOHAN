import { NextRequest, NextResponse } from 'next/server'
import type { UserProfile } from '@/lib/meal-assessment'
import { DEFAULT_PROFILE } from '@/lib/meal-assessment'

const GEMINI_MODEL = 'gemini-3.6-flash'

export const maxDuration = 60

interface GeminiFoodResult {
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

function parseBase64Image(imageBase64: string): { mimeType: string; data: string } {
  const match = imageBase64.match(/^data:(image\/[\w+.-]+);base64,(.+)$/)
  if (match) return { mimeType: match[1], data: match[2] }
  return { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 }
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isFinite(n) ? Math.round(n) : fallback
}

function extractJson(text: string): GeminiFoodResult | null {
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

async function callGemini(
  apiKey: string,
  imageBase64: string,
  profile: UserProfile,
): Promise<{ result: GeminiFoodResult | null; error?: string }> {
  const { mimeType, data } = parseBase64Image(imageBase64)

  const prompt = `You are the food analyst for 「くっくぴん」, a cute Japanese pet health game.
Look at the photo carefully — packaged convenience-store meals, bento boxes, restaurant dishes, drinks, and snacks ALL count as edible food.

User: ${profile.weightKg}kg, ${profile.heightCm}cm, goal=${profile.goal}, activity=${profile.activity}

Return ONLY valid JSON (no markdown):
{
  "isEdible": boolean,
  "foodName": "Japanese dish name",
  "description": "2-3 sentences in Japanese describing what you see (brand, packaging, colors, portions)",
  "funReview": "2-3 sentences in Japanese — playful, exaggerated reaction AS IF the pet くっくぴん is commenting. Use emoji. Be funny but still mention health.",
  "ingredients": ["english lowercase", "..."],
  "healthScore": 0-100,
  "nutrition": {
    "calories": number,
    "carbs": number,
    "protein": number,
    "fat": number,
    "fiber": number,
    "vegetableServings": number
  },
  "rejectReason": "only when isEdible is false"
}

Rules:
- Convenience store / コンビニ packaged food IS edible (7-Eleven pasta, onigiri, bento, etc.)
- Estimate nutrition for the visible portion (one serving)
- healthScore = food quality only (0=junk, 100=ideal)
- If not food at all, set isEdible=false and explain in description + funReview`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: mimeType, data } }, { text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 1200,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!res.ok) {
    console.error('Gemini API error:', res.status)
    return { result: null, error: `api_${res.status}` }
  }

  const body = await res.json()
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    console.error('Gemini empty response:', body.candidates?.[0]?.finishReason)
    return { result: null, error: 'empty_response' }
  }

  const parsed = extractJson(text)
  if (!parsed) {
    console.error('Gemini JSON parse failed, length:', text.length)
    return { result: null, error: 'parse_failed' }
  }

  if (parsed.isEdible && parsed.ingredients.length === 0) {
    parsed.ingredients = parsed.foodName ? [parsed.foodName] : ['meal']
  }

  return { result: parsed }
}

function rejectNotFood(message?: string, reason?: 'not_food' | 'api_error', extra?: Partial<GeminiFoodResult>) {
  return NextResponse.json({
    success: true,
    isEdible: false,
    ingredients: [],
    source: reason === 'api_error' ? 'error' : 'rejected',
    message: message || '食べ物の写真をアップロードしてください 🍽️',
    geminiAnalysis: extra,
  })
}

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, userProfile } = await request.json()
    if (!imageBase64) {
      return NextResponse.json({ error: '缺少图片数据' }, { status: 400 })
    }

    const profile: UserProfile = {
      weightKg: userProfile?.weightKg ?? DEFAULT_PROFILE.weightKg,
      heightCm: userProfile?.heightCm ?? DEFAULT_PROFILE.heightCm,
      goal: userProfile?.goal ?? DEFAULT_PROFILE.goal,
      activity: userProfile?.activity ?? DEFAULT_PROFILE.activity,
    }

    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      return NextResponse.json({ error: 'Gemini API 未配置' }, { status: 500 })
    }

    const { result: gemini, error } = await callGemini(geminiKey, imageBase64, profile)
    if (!gemini) {
      return rejectNotFood(
        'AI分析サービスに接続できませんでした。しばらくしてからもう一度お試しください 📸',
        'api_error',
      )
    }
    if (!gemini.isEdible) {
      return rejectNotFood(
        gemini.funReview || gemini.message || gemini.description,
        'not_food',
        {
          foodName: gemini.foodName,
          description: gemini.description,
          funReview: gemini.funReview,
        },
      )
    }

    return NextResponse.json({
      success: true,
      isEdible: true,
      ingredients: gemini.ingredients,
      source: 'gemini-flash',
      geminiAnalysis: {
        foodName: gemini.foodName,
        description: gemini.description,
        funReview: gemini.funReview,
        healthScore: gemini.healthScore,
        message: gemini.funReview || gemini.message,
        nutrition: gemini.nutrition,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json({ error: '分析失败', details: message }, { status: 500 })
  }
}
