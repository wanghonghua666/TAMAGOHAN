export type UserGoal = 'maintain' | 'lose' | 'gain'
export type ActivityLevel = 'low' | 'moderate' | 'high'

export interface UserProfile {
  weightKg: number
  heightCm: number
  goal: UserGoal
  activity: ActivityLevel
}

export interface DailyTargets {
  calories: number
  protein: number
  carbs: number
  fat: number
  vegetables: number // 份数（1份 ≈ 80g 蔬菜）
}

export interface MealNutrition {
  calories: number
  carbs: number
  protein: number
  fat: number
  fiber: number
  vegetableServings?: number
}

export interface MacroStatus {
  label: string
  actual: number
  target: number
  unit: string
  percent: number
  status: 'low' | 'ok' | 'high'
}

export interface MealAssessment {
  overallScore: number
  healthScore: number
  portionScore: number
  macros: MacroStatus[]
  message: string
  tips: string[]
  dailyTargets: DailyTargets
  perMealTargets: DailyTargets
}

const ACTIVITY_MULT: Record<ActivityLevel, number> = {
  low: 1.2,
  moderate: 1.45,
  high: 1.7,
}

const PROTEIN_PER_KG: Record<UserGoal, number> = {
  maintain: 1.6,
  lose: 1.8,
  gain: 2.0,
}

/** 根据体重计算每日营养目标 */
export function computeDailyTargets(profile: UserProfile): DailyTargets {
  const { weightKg, heightCm, goal, activity } = profile
  // Mifflin-St Jeor（简化，默认 30 岁）
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * 30 + 5
  let tdee = bmr * ACTIVITY_MULT[activity]
  if (goal === 'lose') tdee *= 0.85
  if (goal === 'gain') tdee *= 1.1

  const calories = Math.round(tdee)
  const protein = Math.round(weightKg * PROTEIN_PER_KG[goal])
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)
  const vegetables = goal === 'lose' ? 6 : 5

  return { calories, protein, carbs, fat, vegetables }
}

function perMeal(targets: DailyTargets): DailyTargets {
  return {
    calories: Math.round(targets.calories / 3),
    protein: Math.round(targets.protein / 3),
    carbs: Math.round(targets.carbs / 3),
    fat: Math.round(targets.fat / 3),
    vegetables: Math.round((targets.vegetables / 3) * 10) / 10,
  }
}

function macroStatus(label: string, actual: number, target: number, unit: string): MacroStatus {
  const percent = target > 0 ? Math.round((actual / target) * 100) : 0
  let status: MacroStatus['status'] = 'ok'
  if (percent < 70) status = 'low'
  else if (percent > 130) status = 'high'
  return { label, actual, target, unit, percent, status }
}

function scoreFromMacro(status: MacroStatus['status'], weight: number): number {
  if (status === 'ok') return 100 * weight
  if (status === 'low') return 50 * weight
  return 60 * weight // high is slightly penalized but not as bad as low for protein/veg
}

/** 综合评估一餐：健康度 + 份量是否达标 */
export function assessMeal(
  meal: MealNutrition,
  profile: UserProfile,
  healthScore: number,
): MealAssessment {
  const dailyTargets = computeDailyTargets(profile)
  const mealTargets = perMeal(dailyTargets)

  const vegServings = meal.vegetableServings ?? estimateVegFromFiber(meal.fiber)

  const macros: MacroStatus[] = [
    macroStatus('タンパク質', meal.protein, mealTargets.protein, 'g'),
    macroStatus('炭水化物', meal.carbs, mealTargets.carbs, 'g'),
    macroStatus('野菜', vegServings, mealTargets.vegetables, '份'),
    macroStatus('カロリー', meal.calories, mealTargets.calories, 'kcal'),
  ]

  // 份量得分：蛋白质25% + 碳水20% + 蔬菜30% + 卡路里25%
  let portionScore = 0
  portionScore += scoreFromMacro(macros[0].status, 0.25)
  portionScore += scoreFromMacro(macros[1].status, 0.20)
  portionScore += scoreFromMacro(macros[2].status, 0.30)
  portionScore += scoreFromMacro(macros[3].status, 0.25)
  portionScore = Math.round(portionScore)

  // 综合分：健康质量 40% + 份量达标 60%
  const overallScore = Math.round(healthScore * 0.4 + portionScore * 0.6)

  const tips: string[] = []
  if (macros[0].status === 'low') tips.push(`タンパク質が足りません（目標 ${mealTargets.protein}g）`)
  if (macros[0].status === 'high') tips.push('タンパク質が多めです')
  if (macros[1].status === 'low') tips.push('炭水化物が少なめです')
  if (macros[1].status === 'high') tips.push(`炭水化物が多めです（目標 ${mealTargets.carbs}g）`)
  if (macros[2].status === 'low') tips.push(`野菜が足りません！あと ${Math.max(0, Math.round((mealTargets.vegetables - vegServings) * 10) / 10)} 份`)
  if (macros[2].status === 'ok') tips.push('野菜バランス良好 🥬')
  if (macros[3].status === 'low') tips.push('食べる量が少なめかも？')
  if (macros[3].status === 'high') tips.push('カロリーが多めです')

  let message = ''
  if (overallScore >= 85) message = 'バランス抜群！くっくぴんも大喜び 🌟'
  else if (overallScore >= 70) message = 'いい感じ！あと少し野菜を足すと完璧 💪'
  else if (overallScore >= 50) message = 'まあまあ。栄養バランスを見直してみて 😅'
  else if (healthScore < 30) message = 'ジャンクフード注意！体に悪いよ 🚨'
  else message = '栄養が偏っています。タンパク質と野菜を増やそう 🥗'

  if (tips.length > 0 && overallScore < 70) {
    message = tips[0] + ' — ' + message
  }

  return {
    overallScore,
    healthScore,
    portionScore,
    macros,
    message,
    tips,
    dailyTargets,
    perMealTargets: mealTargets,
  }
}

function estimateVegFromFiber(fiber: number): number {
  // 每份蔬菜约 2-3g 纤维
  return Math.round((fiber / 2.5) * 10) / 10
}

export const DEFAULT_PROFILE: UserProfile = {
  weightKg: 60,
  heightCm: 170,
  goal: 'maintain',
  activity: 'moderate',
}
