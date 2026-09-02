'use client'

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { UserProfile } from './meal-assessment'
import {
  GEMINI_MODELS,
  buildFoodPrompt,
  extractGeminiJson,
  parseBase64Image,
  type GeminiFoodResult,
} from './gemini-food-core'

/** 浏览器直连 Gemini，绕过 Vercel Hobby 10 秒函数限制 */
export async function analyzeFoodWithGeminiClient(
  apiKey: string,
  imageBase64: string,
  profile: UserProfile,
): Promise<{ result: GeminiFoodResult | null; model?: string; error?: string }> {
  const genAI = new GoogleGenerativeAI(apiKey)
  const { mimeType, data } = parseBase64Image(imageBase64)
  const prompt = buildFoodPrompt(profile)

  for (const modelName of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 600,
          responseMimeType: 'application/json',
        },
      })

      const response = await model.generateContent([
        { inlineData: { mimeType, data } },
        { text: prompt },
      ])

      const text = response.response.text()
      const parsed = extractGeminiJson(text)
      if (!parsed) continue

      if (parsed.isEdible && parsed.ingredients.length === 0) {
        parsed.ingredients = parsed.foodName ? [parsed.foodName] : ['meal']
      }

      return { result: parsed, model: modelName }
    } catch (err) {
      console.warn(`Client Gemini ${modelName} failed:`, err)
    }
  }

  return { result: null, error: 'all_models_failed' }
}
