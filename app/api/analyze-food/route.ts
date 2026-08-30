import { NextRequest, NextResponse } from 'next/server'
import type { UserProfile } from '@/lib/meal-assessment'
import { DEFAULT_PROFILE } from '@/lib/meal-assessment'

const GEMINI_MODEL = 'gemini-2.0-flash'

interface GeminiFoodResult {
  isEdible: boolean
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
  const match = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/)
  if (match) return { mimeType: match[1], data: match[2] }
  return { mimeType: 'image/jpeg', data: imageBase64.split(',')[1] || imageBase64 }
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
        rejectReason: parsed.rejectReason || 'not_food',
        message: parsed.message,
      }
    }
    if (!Array.isArray(parsed.ingredients) || parsed.ingredients.length === 0) return null
    return {
      isEdible: true,
      ingredients: parsed.ingredients.map((i: string) => i.toLowerCase().trim()),
      healthScore: typeof parsed.healthScore === 'number' ? parsed.healthScore : undefined,
      message: typeof parsed.message === 'string' ? parsed.message : undefined,
      nutrition: parsed.nutrition,
    }
  } catch {
    return null
  }
}

async function callGemini(
  apiKey: string,
  imageBase64: string,
  profile: UserProfile,
): Promise<GeminiFoodResult | null> {
  const { mimeType, data } = parseBase64Image(imageBase64)

  const prompt = `You are a food nutrition analyst for Kukupin, a Japanese pet-raising health app.

User profile:
- Weight: ${profile.weightKg} kg
- Height: ${profile.heightCm} cm
- Goal: ${profile.goal}
- Activity: ${profile.activity}

First check: is this EDIBLE food/drink? If not (people, pets, objects, landscapes, etc.), set isEdible=false.

Respond ONLY with valid JSON:
{
  "isEdible": true/false,
  "ingredients": ["item1", "item2"],
  "healthScore": 0-100,
  "message": "Brief Japanese comment with emoji",
  "nutrition": {
    "calories": number,
    "carbs": number,
    "protein": number,
    "fat": number,
    "fiber": number,
    "vegetableServings": number
  },
  "rejectReason": "only if isEdible=false"
}

Rules when isEdible=true:
- Estimate nutrition for the VISIBLE PORTION in the photo (one meal serving)
- vegetableServings: count vegetable portions (1 serving ≈ 80g leafy/g cooked veg)
- healthScore: food quality only (0=junk, 100=ideal whole foods)
- ingredients: 2-8 items, English lowercase
- Recognize Japanese food (sushi, ramen, curry, bento, miso soup, etc.)

When isEdible=false: ingredients=[], no nutrition data, message asks for food photo in Japanese`

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: mimeType, data } }, { text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
      }),
    }
  )

  if (!res.ok) return null
  const result = await res.json()
  const text = result.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) return null
  return extractJson(text)
}

function rejectNotFood(message?: string) {
  return NextResponse.json({
    success: true,
    isEdible: false,
    ingredients: [],
    source: 'rejected',
    message: message || '食べ物の写真をアップロードしてください 🍽️',
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

    const gemini = await callGemini(geminiKey, imageBase64, profile)
    if (!gemini) {
      return rejectNotFood('分析に失敗しました。もう一度お試しください 📸')
    }
    if (!gemini.isEdible) {
      return rejectNotFood(gemini.message)
    }

    return NextResponse.json({
      success: true,
      isEdible: true,
      ingredients: gemini.ingredients,
      source: 'gemini-flash',
      geminiAnalysis: {
        healthScore: gemini.healthScore,
        message: gemini.message,
        nutrition: gemini.nutrition,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json({ error: '分析失败', details: message }, { status: 500 })
  }
}
