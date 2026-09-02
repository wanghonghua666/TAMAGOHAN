export type FatCategory = 'healthy' | 'neutral' | 'harmful'

export interface FatBreakdown {
  total: number
  healthy: number
  neutral: number
  harmful: number
}

export interface FatSource {
  name: string
  category: FatCategory
  grams?: number
}

export interface FatQualityResult {
  breakdown: FatBreakdown
  qualityScore: number
  grade: 'excellent' | 'good' | 'mixed' | 'poor'
  labelJa: string
  sources: FatSource[]
  tips: string[]
  /** 计入宠物「悪質脂肪」负荷 (0-100) */
  harmfulLoad: number
  /** 计入宠物「良質脂肪」奖励 (0-100) */
  healthyBonus: number
}

const HEALTHY_KEYWORDS = [
  'salmon', 'tuna', 'saba', 'mackerel', 'fish', 'sashimi', 'sushi', '魚', 'サーモン', 'マグロ', 'サバ',
  'avocado', 'アボカド', 'nut', 'almond', 'walnut', 'ナッツ', 'アーモンド',
  'olive', 'オリーブ', 'omega', 'flax', 'chia',
]

const HARMFUL_KEYWORDS = [
  'fried', 'deep-fried', 'deep fried', 'tempura', 'karaage', '唐揚', '揚げ', 'フライ', 'fries',
  'donut', 'doughnut', 'margarine', 'shortening', 'lard', 'bacon', 'ベーコン',
  'processed', 'junk', 'fast food', 'mcdonald', 'kfc', 'burger', 'pizza', 'chips',
  'croissant', 'pastry', 'snack', 'instant', 'カップ', 'ジャンク', 'trans', 'トランス',
]

const NEUTRAL_KEYWORDS = [
  'egg', '卵', 'cheese', 'チーズ', 'milk', '乳', 'yogurt', 'butter', 'バター',
  'chicken', '鶏', 'pork', '豚', 'beef', '牛', 'tofu', '豆腐',
]

const GRADE_LABEL: Record<FatQualityResult['grade'], string> = {
  excellent: '良質脂肪が中心 🐟',
  good: 'バランスの良い脂質 ✨',
  mixed: '脂質ミックス ⚖️',
  poor: '悪質脂肪が多め 🍟',
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function normalizeBreakdown(raw: Partial<FatBreakdown>, totalFat: number): FatBreakdown {
  let healthy = Math.max(0, raw.healthy ?? 0)
  let neutral = Math.max(0, raw.neutral ?? 0)
  let harmful = Math.max(0, raw.harmful ?? 0)
  const sum = healthy + neutral + harmful

  if (sum <= 0 && totalFat > 0) {
    return { total: totalFat, healthy: 0, neutral: totalFat, harmful: 0 }
  }

  if (sum > 0 && totalFat > 0 && Math.abs(sum - totalFat) > 1) {
    const scale = totalFat / sum
    healthy *= scale
    neutral *= scale
    harmful *= scale
  }

  const total = totalFat > 0 ? totalFat : healthy + neutral + harmful
  return {
    total: round1(total),
    healthy: round1(healthy),
    neutral: round1(neutral),
    harmful: round1(harmful),
  }
}

function inferFromText(text: string): FatCategory {
  const lower = text.toLowerCase()
  if (HARMFUL_KEYWORDS.some(k => lower.includes(k))) return 'harmful'
  if (HEALTHY_KEYWORDS.some(k => lower.includes(k))) return 'healthy'
  if (NEUTRAL_KEYWORDS.some(k => lower.includes(k))) return 'neutral'
  return 'neutral'
}

function inferBreakdownFromIngredients(totalFat: number, ingredients: string[], foodName?: string): FatBreakdown {
  if (totalFat <= 0) {
    return { total: 0, healthy: 0, neutral: 0, harmful: 0 }
  }

  const texts = [...ingredients, foodName || ''].filter(Boolean)
  let harmfulW = 0
  let healthyW = 0
  let neutralW = 0

  for (const t of texts) {
    const cat = inferFromText(t)
    if (cat === 'harmful') harmfulW += 2
    else if (cat === 'healthy') healthyW += 2
    else neutralW += 1
  }

  const totalW = harmfulW + healthyW + neutralW || 1
  return normalizeBreakdown(
    {
      harmful: (harmfulW / totalW) * totalFat,
      healthy: (healthyW / totalW) * totalFat,
      neutral: (neutralW / totalW) * totalFat,
    },
    totalFat,
  )
}

function gradeFromScore(score: number): FatQualityResult['grade'] {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'mixed'
  return 'poor'
}

function buildTips(breakdown: FatBreakdown, sources: FatSource[]): string[] {
  const tips: string[] = []
  const { total, healthy, harmful } = breakdown
  if (total <= 0) return tips

  const harmfulRatio = harmful / total
  const healthyRatio = healthy / total

  if (harmfulRatio >= 0.5) {
    tips.push('揚げ物・加工油が多め。蒸す・焼く調理に変えてみよう 🍳')
  } else if (harmfulRatio >= 0.3) {
    tips.push('悪質脂肪がやや多め。サラダや魚を足すとバランスUP 🥗')
  }

  if (healthyRatio >= 0.4) {
    tips.push('魚・ナッツなど良質な脂質が取れています 🐟')
  }

  const topHarmful = sources.filter(s => s.category === 'harmful').slice(0, 2)
  if (topHarmful.length > 0 && harmfulRatio >= 0.25) {
    tips.push(`注意: ${topHarmful.map(s => s.name).join('、')} の脂質`)
  }

  return tips.slice(0, 2)
}

/** 综合 AI 输出 + 关键词兜底，评估脂肪质量 */
export function assessFatQuality(
  totalFat: number,
  rawBreakdown: Partial<FatBreakdown> | undefined,
  rawSources: FatSource[] | undefined,
  ingredients: string[],
  foodName?: string,
): FatQualityResult {
  const hasRaw =
    rawBreakdown &&
    (rawBreakdown.healthy != null || rawBreakdown.neutral != null || rawBreakdown.harmful != null)

  const breakdown = hasRaw
    ? normalizeBreakdown(rawBreakdown!, totalFat)
    : inferBreakdownFromIngredients(totalFat, ingredients, foodName)

  const sources: FatSource[] =
    rawSources && rawSources.length > 0
      ? rawSources.map(s => ({ name: s.name, category: s.category, grams: s.grams }))
      : ingredients.slice(0, 4).map(name => ({ name, category: inferFromText(name) }))

  const { healthy, neutral, harmful, total } = breakdown
  const qualityScore =
    total > 0
      ? Math.round(((healthy * 1 + neutral * 0.55 - harmful * 1.2) / total) * 50 + 50)
      : 70

  const clampedScore = clamp(qualityScore, 0, 100)
  const grade = gradeFromScore(clampedScore)
  const harmfulLoad = clamp(Math.round(harmful * 4 + (total > 0 ? (harmful / total) * 30 : 0)), 0, 100)
  const healthyBonus = clamp(Math.round(healthy * 3 + (total > 0 ? (healthy / total) * 20 : 0)), 0, 100)

  return {
    breakdown,
    qualityScore: clampedScore,
    grade,
    labelJa: GRADE_LABEL[grade],
    sources,
    tips: buildTips(breakdown, sources),
    harmfulLoad,
    healthyBonus,
  }
}

/** 脂肪份量状态：结合总量与质量 */
export function fatMacroStatus(
  totalFat: number,
  targetFat: number,
  quality: FatQualityResult,
): { status: 'low' | 'ok' | 'high'; note?: string } {
  const percent = targetFat > 0 ? (totalFat / targetFat) * 100 : 0
  const harmfulRatio = quality.breakdown.total > 0 ? quality.breakdown.harmful / quality.breakdown.total : 0

  if (percent > 130 || (percent > 100 && harmfulRatio >= 0.4)) {
    return { status: 'high', note: harmfulRatio >= 0.4 ? '悪質脂肪多め' : '過多' }
  }
  if (percent < 70) return { status: 'low', note: '不足' }
  if (harmfulRatio >= 0.5) return { status: 'high', note: '悪質脂肪多め' }
  return { status: 'ok', note: quality.grade === 'excellent' ? '良質中心' : undefined }
}

export function mergePetFatValues(
  currentHarmful: number,
  currentHealthy: number,
  quality: FatQualityResult,
): { harmful: number; healthy: number } {
  return {
    harmful: clamp(Math.round(currentHarmful * 0.85 + quality.harmfulLoad * 0.35), 0, 100),
    healthy: clamp(Math.round(currentHealthy * 0.9 + quality.healthyBonus * 0.25), 0, 100),
  }
}
