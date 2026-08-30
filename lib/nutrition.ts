export interface NutritionResult {
  nutrition: {
    calories: number
    carbs: number
    protein: number
    fat: number
    fiber: number
    vitamins: string[]
  }
  healthScore: number
  categories: Array<{ name: string; confidence: number; isHealthy: boolean }>
  message: string
}

type FoodData = {
  healthScore: number
  calories: number
  carbs: number
  protein: number
  fat: number
  fiber: number
  category: string
  isHealthy: boolean
  keywords: string[]
}

const FOOD_DB: Record<string, FoodData> = {
  mcdonald: { healthScore: 8, calories: 600, carbs: 45, protein: 25, fat: 35, fiber: 2, category: '超級ジャンク', isHealthy: false, keywords: ['mcdonald', 'mcdonalds', 'mac', 'big mac', 'マック'] },
  kfc: { healthScore: 10, calories: 550, carbs: 40, protein: 30, fat: 30, fiber: 1, category: '超級ジャンク', isHealthy: false, keywords: ['kfc', 'kentucky', 'fried chicken'] },
  pizza: { healthScore: 12, calories: 450, carbs: 50, protein: 15, fat: 20, fiber: 2, category: '超級ジャンク', isHealthy: false, keywords: ['pizza', 'ピザ'] },
  burger: { healthScore: 15, calories: 500, carbs: 40, protein: 25, fat: 25, fiber: 2, category: '超級ジャンク', isHealthy: false, keywords: ['burger', 'hamburger', 'バーガー'] },
  fries: { healthScore: 5, calories: 350, carbs: 45, protein: 4, fat: 18, fiber: 3, category: '超級ジャンク', isHealthy: false, keywords: ['fries', 'french fries', 'ポテト'] },
  cola: { healthScore: 3, calories: 150, carbs: 39, protein: 0, fat: 0, fiber: 0, category: '糖分', isHealthy: false, keywords: ['cola', 'coke', 'soda', 'コーラ'] },
  candy: { healthScore: 5, calories: 200, carbs: 50, protein: 0, fat: 2, fiber: 0, category: '糖分', isHealthy: false, keywords: ['candy', 'chocolate', 'チョコ'] },
  pasta: { healthScore: 25, calories: 300, carbs: 55, protein: 12, fat: 8, fiber: 3, category: '炭水化物', isHealthy: false, keywords: ['pasta', 'spaghetti', 'パスタ'] },
  ramen: { healthScore: 18, calories: 400, carbs: 60, protein: 12, fat: 15, fiber: 2, category: '麺類', isHealthy: false, keywords: ['ramen', 'noodle', 'ラーメン'] },
  chicken: { healthScore: 65, calories: 165, carbs: 0, protein: 31, fat: 4, fiber: 0, category: 'タンパク質', isHealthy: true, keywords: ['chicken', '鶏肉', 'チキン'] },
  fish: { healthScore: 85, calories: 150, carbs: 0, protein: 25, fat: 5, fiber: 0, category: '良質タンパク', isHealthy: true, keywords: ['fish', 'salmon', 'tuna', '魚', 'サーモン'] },
  egg: { healthScore: 75, calories: 70, carbs: 1, protein: 6, fat: 5, fiber: 0, category: 'タンパク質', isHealthy: true, keywords: ['egg', '卵'] },
  tofu: { healthScore: 80, calories: 70, carbs: 2, protein: 8, fat: 4, fiber: 1, category: '植物性タンパク', isHealthy: true, keywords: ['tofu', '豆腐'] },
  vegetable: { healthScore: 95, calories: 25, carbs: 5, protein: 2, fat: 0, fiber: 3, category: '野菜', isHealthy: true, keywords: ['vegetable', 'veggie', '野菜'] },
  broccoli: { healthScore: 98, calories: 25, carbs: 5, protein: 3, fat: 0, fiber: 3, category: 'スーパーフード', isHealthy: true, keywords: ['broccoli', 'ブロッコリー'] },
  spinach: { healthScore: 100, calories: 20, carbs: 3, protein: 3, fat: 0, fiber: 2, category: 'スーパーフード', isHealthy: true, keywords: ['spinach', 'ほうれん草'] },
  salad: { healthScore: 95, calories: 20, carbs: 4, protein: 1, fat: 0, fiber: 2, category: '野菜', isHealthy: true, keywords: ['salad', 'サラダ'] },
  fruit: { healthScore: 85, calories: 60, carbs: 15, protein: 1, fat: 0, fiber: 3, category: '果物', isHealthy: true, keywords: ['fruit', 'apple', 'banana', '果物'] },
  rice: { healthScore: 35, calories: 130, carbs: 28, protein: 3, fat: 0, fiber: 0, category: '主食', isHealthy: false, keywords: ['rice', 'ご飯', '白米'] },
  curry: { healthScore: 55, calories: 350, carbs: 40, protein: 15, fat: 12, fiber: 3, category: 'スパイス料理', isHealthy: false, keywords: ['curry', 'カレー'] },
  sushi: { healthScore: 80, calories: 400, carbs: 60, protein: 25, fat: 8, fiber: 2, category: '和食', isHealthy: true, keywords: ['sushi', '寿司'] },
  water: { healthScore: 100, calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, category: '飲料', isHealthy: true, keywords: ['water', '水'] },
  tea: { healthScore: 95, calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, category: '飲料', isHealthy: true, keywords: ['tea', 'お茶', '緑茶'] },
}

const STOP_WORDS = [
  'food', 'meal', 'dinner', 'lunch', 'breakfast', 'dish', 'cooking',
  'nutrition', 'health', 'delicious', 'homemade', 'no person', 'indoors',
]

function matchFood(key: string): [string, FoodData] | null {
  for (const [foodKey, data] of Object.entries(FOOD_DB)) {
    const matched = data.keywords.some(kw =>
      key.includes(kw.toLowerCase()) || kw.toLowerCase().includes(key)
    )
    if (matched || key.includes(foodKey) || foodKey.includes(key)) {
      return [foodKey, data]
    }
  }
  return null
}

export function analyzeNutrition(ingredients: string[]): NutritionResult {
  let totalCalories = 0, totalCarbs = 0, totalProtein = 0, totalFat = 0, totalFiber = 0
  let healthScoreSum = 0, count = 0, unhealthyCount = 0
  const categories: NutritionResult['categories'] = []
  const vitamins: string[] = []
  const detected: string[] = []

  for (const raw of ingredients) {
    const key = raw.toLowerCase().trim()
    if (STOP_WORDS.includes(key)) continue

    const match = matchFood(key)
    if (match) {
      const [, data] = match
      totalCalories += data.calories
      totalCarbs += data.carbs
      totalProtein += data.protein
      totalFat += data.fat
      totalFiber += data.fiber
      healthScoreSum += data.healthScore
      count++
      if (!data.isHealthy) unhealthyCount++
      categories.push({ name: data.category, confidence: 90, isHealthy: data.isHealthy })
      detected.push(match[0])
      if (data.isHealthy) vitamins.push('ビタミンC')
    } else {
      totalCalories += 150
      totalCarbs += 15
      totalProtein += 5
      totalFat += 5
      totalFiber += 1
      healthScoreSum += 60
      count++
      categories.push({ name: '未分類', confidence: 30, isHealthy: true })
    }
  }

  let score = count > 0 ? Math.round(healthScoreSum / count) : 50
  if (unhealthyCount > 1) score = Math.max(5, score - unhealthyCount * 5)
  if (unhealthyCount === count && count > 0) score = Math.min(score, 25)
  if (unhealthyCount === 0 && score < 75) score = Math.min(95, score + 15)

  const hasJunk = detected.some(f => ['mcdonald', 'kfc', 'fries', 'cola', 'candy'].includes(f))
  let message = ''
  if (score >= 90) message = '完璧！理想的な食事です！🌟'
  else if (score >= 80) message = 'とても良い選択です！💪'
  else if (score >= 65) message = 'まあまあ。もう少し野菜を増やしましょう 🥬'
  else if (score >= 50) message = 'もう少し健康的な選択を考えてみて 😅'
  else if (score >= 30) message = '野菜と魚を増やしてください！😰'
  else if (score >= 15) message = '体に悪いかも...改善しましょう！🚨'
  else message = hasJunk ? 'ジャンクフード注意！🤮' : '危険レベル！サラダを食べて！🆘'

  return {
    nutrition: {
      calories: Math.round(totalCalories),
      carbs: Math.round(totalCarbs),
      protein: Math.round(totalProtein),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber),
      vitamins: [...new Set(vitamins)],
    },
    healthScore: score,
    categories: categories.slice(0, 3),
    message,
  }
}

export function guessIngredientsFromFileName(fileName: string): string[] {
  const f = fileName.toLowerCase()
  if (f.includes('mac') || f.includes('mcdonald') || f.includes('burger')) return ['mcdonald', 'fries', 'cola']
  if (f.includes('kfc') || f.includes('fried')) return ['kfc', 'fries']
  if (f.includes('pizza')) return ['pizza']
  if (f.includes('pasta') || f.includes('spaghetti')) return ['pasta']
  if (f.includes('ramen') || f.includes('noodle')) return ['ramen']
  if (f.includes('salad') || f.includes('vegetable')) return ['salad', 'vegetable', 'broccoli']
  if (f.includes('fish') || f.includes('salmon') || f.includes('sushi')) return ['fish', 'vegetable']
  if (f.includes('chicken')) return ['chicken', 'vegetable']
  if (f.includes('fruit') || f.includes('apple')) return ['fruit']
  if (f.includes('curry') || f.includes('カレー')) return ['curry', 'rice']
  if (f.includes('rice') || f.includes('ご飯')) return ['rice', 'fish']
  return ['rice', 'vegetable']
}
