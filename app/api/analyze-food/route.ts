import { NextRequest, NextResponse } from 'next/server'
import type { UserProfile } from '@/lib/meal-assessment'
import { DEFAULT_PROFILE } from '@/lib/meal-assessment'
import {
  GEMINI_MODELS,
  buildFoodPrompt,
  extractGeminiJson,
  parseBase64Image,
  type GeminiFoodResult,
} from '@/lib/gemini-food-core'

const MODEL_TIMEOUT_MS: Record<(typeof GEMINI_MODELS)[number], number> = {
  'gemini-3.5-flash-lite': 8_000,
  'gemini-3.1-flash-lite': 8_000,
  'gemini-3.5-flash': 9_000,
}

export const maxDuration = 10

async function callGeminiOnce(
  apiKey: string,
  model: string,
  mimeType: string,
  data: string,
  profile: UserProfile,
  timeoutMs: number,
): Promise<{ result: GeminiFoodResult | null; error?: string; status?: number }> {
  const prompt = buildFoodPrompt(profile)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  let res: Response
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: mimeType, data } }, { text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 600,
            responseMimeType: 'application/json',
          },
        }),
      },
    )
  } catch (err) {
    clearTimeout(timer)
    const aborted = err instanceof Error && err.name === 'AbortError'
    return { result: null, error: aborted ? 'timeout' : 'network' }
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    return { result: null, error: `api_${res.status}`, status: res.status }
  }

  const body = await res.json()
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) return { result: null, error: 'empty_response' }

  const parsed = extractGeminiJson(text)
  if (!parsed) return { result: null, error: 'parse_failed' }

  if (parsed.isEdible && parsed.ingredients.length === 0) {
    parsed.ingredients = parsed.foodName ? [parsed.foodName] : ['meal']
  }

  return { result: parsed }
}

async function callGemini(
  apiKey: string,
  imageBase64: string,
  profile: UserProfile,
): Promise<{ result: GeminiFoodResult | null; error?: string }> {
  const { mimeType, data } = parseBase64Image(imageBase64)
  let lastError: string | undefined

  for (const model of GEMINI_MODELS) {
    const out = await callGeminiOnce(apiKey, model, mimeType, data, profile, MODEL_TIMEOUT_MS[model])
    if (out.result) return { result: out.result }
    lastError = out.error
  }

  return { result: null, error: lastError || 'api_failed' }
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
    let body: { imageBase64?: string; userProfile?: Partial<UserProfile> }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'PAYLOAD_INVALID', message: '画像データの読み取りに失敗しました。別の写真をお試しください。' },
        { status: 413 },
      )
    }

    const { imageBase64, userProfile } = body
    if (!imageBase64) {
      return NextResponse.json({ error: 'MISSING_IMAGE', message: '缺少图片数据' }, { status: 400 })
    }

    if (imageBase64.length > 6_000_000) {
      return NextResponse.json(
        { error: 'PAYLOAD_TOO_LARGE', message: '画像が大きすぎます。もう一度お試しください 📸' },
        { status: 413 },
      )
    }

    const profile: UserProfile = {
      weightKg: userProfile?.weightKg ?? DEFAULT_PROFILE.weightKg,
      heightCm: userProfile?.heightCm ?? DEFAULT_PROFILE.heightCm,
      goal: userProfile?.goal ?? DEFAULT_PROFILE.goal,
      activity: userProfile?.activity ?? DEFAULT_PROFILE.activity,
    }

    const geminiKey = process.env.GEMINI_API_KEY?.trim()
    if (!geminiKey) {
      return NextResponse.json(
        {
          error: 'CONFIG_MISSING',
          message: 'サーバーに GEMINI_API_KEY が設定されていません。NEXT_PUBLIC_GEMINI_API_KEY を設定してください。',
        },
        { status: 503 },
      )
    }

    const { result: gemini, error: geminiError } = await callGemini(geminiKey, imageBase64, profile)
    if (!gemini) {
      const failMsg =
        geminiError === 'timeout'
          ? 'AI分析がタイムアウトしました。ブラウザから直接分析する設定（NEXT_PUBLIC_GEMINI_API_KEY）を確認してください ⏱️'
          : 'AI分析サービスに接続できませんでした。しばらくしてからもう一度お試しください 📸'
      return rejectNotFood(failMsg, 'api_error')
    }

    if (!gemini.isEdible) {
      return rejectNotFood(gemini.funReview || gemini.message || gemini.description, 'not_food', {
        foodName: gemini.foodName,
        description: gemini.description,
        funReview: gemini.funReview,
      })
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
        fatBreakdown: gemini.fatBreakdown,
        fatSources: gemini.fatSources,
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json({ error: '分析失败', details: message }, { status: 500 })
  }
}
