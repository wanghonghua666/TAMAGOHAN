'use client'

// 食物识别结果接口
interface FoodRecognitionResult {
  ingredients: string[]
  categories: Array<{
    name: string
    confidence: number
    isHealthy: boolean
  }>
  nutritionEstimate: {
    calories: number
    carbs: number
    protein: number
    fat: number
    fiber: number
    vitamins: string[]
  }
  healthyScore: number
  confidence: number
  message: string
}

// Clarifai食物识别
async function recognizeWithClarifai(imageBase64: string): Promise<string[]> {
  try {
    console.log('🤖 开始Clarifai食物识别...')
    console.log('🔄 使用服务器端API路由避免CORS问题')

    // 调用我们的Next.js API路由而不是直接调用Clarifai
    const response = await fetch('/api/analyze-food', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64: imageBase64
      })
    })

    console.log('📨 API路由响应状态:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ API路由错误:', errorData)
      throw new Error(`API路由调用失败: ${response.status} - ${errorData.error}`)
    }

    const result = await response.json()
    console.log('🔍 API路由响应:', result)

    if (!result.success) {
      throw new Error(`API识别失败: ${result.error}`)
    }

    const foodItems = result.ingredients || []
    console.log('✅ 最终识别的食物:', foodItems)
    
    return foodItems
      
  } catch (error: any) {
    console.error('❌ Clarifai识别失败:', error.message)
    console.error('🔧 可能的问题:')
    console.error('   1. 服务器端API路由错误')
    console.error('   2. API密钥配置问题')
    console.error('   3. 网络连接问题')
    console.error('   4. 图片格式不支持')
    return []
  }
}

// 使用Google Vision API作为备选
async function recognizeWithGoogleVision(imageBase64: string): Promise<string[]> {
  try {
    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY
    
    if (!GOOGLE_API_KEY) {
      console.log('❌ Google Vision API密钥未设置')
      console.log('🔧 解决方法：在 .env.local 文件中添加 NEXT_PUBLIC_GOOGLE_VISION_API_KEY')
      console.log('📖 获取方式：https://cloud.google.com/vision/docs/setup')
      return []
    }

    // 验证API密钥格式
    if (!GOOGLE_API_KEY.startsWith('AIza')) {
      console.log('❌ Google Vision API密钥格式无效')
      console.log('🔧 正确格式应该以 "AIza" 开头')
      return []
    }

    console.log('开始调用Google Vision API...')

    // 创建超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒超时

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBase64.split(',')[1]
            },
            features: [
              {
                type: 'LABEL_DETECTION',
                maxResults: 10
              }
            ]
          }
        ]
      })
    })

    clearTimeout(timeoutId)

    console.log('Google Vision API响应状态:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Vision API错误:', response.status, errorText)
      throw new Error(`Google Vision API调用失败: ${response.status}`)
    }

    const result = await response.json()
    console.log('Google Vision API原始结果:', result)

    // 检查API响应格式
    if (!result.responses || !result.responses[0]) {
      console.log('Google Vision API返回空结果')
      return []
    }

    const labels = result.responses[0]?.labelAnnotations || []
    console.log('识别的标签:', labels)
    
    // 过滤出食物相关的标签
    const foodKeywords = ['food', 'dish', 'meal', 'cuisine', 'rice', 'meat', 'vegetable', 'fruit', 'bread', 'noodle', 'cooking', 'eating', 'dinner', 'lunch', 'breakfast']
    const foodLabels = labels
      .filter((label: any) => {
        const description = label.description.toLowerCase()
        const isFoodRelated = foodKeywords.some(keyword => description.includes(keyword))
        const hasGoodScore = label.score > 0.6
        console.log(`标签: ${description}, 分数: ${label.score}, 食物相关: ${isFoodRelated}`)
        return hasGoodScore && isFoodRelated
      })
      .map((label: any) => label.description)
      .slice(0, 5)

    console.log('最终识别的食物标签:', foodLabels)
    return foodLabels
      
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('Google Vision API调用超时')
    } else {
      console.error('Google Vision识别失败:', error)
      console.error('可能的问题：')
      console.error('1. API密钥未设置或无效')
      console.error('2. 超出免费配额限制')
      console.error('3. 网络连接问题')
      console.error('4. 图片格式不支持')
    }
    return []
  }
}

// 根据识别的食材分析营养和健康分数
function analyzeNutrition(ingredients: string[]): {
  nutrition: FoodRecognitionResult['nutritionEstimate']
  healthScore: number
  categories: FoodRecognitionResult['categories']
  message: string
} {
  // 大幅扩展的食材健康度数据库 - 更严格的评分标准
  const foodHealthData: Record<string, {
    healthScore: number
    calories: number
    carbs: number
    protein: number
    fat: number
    fiber: number
    category: string
    isHealthy: boolean
    keywords: string[]  // 用于更好的匹配
  }> = {
    // 💀 超级垃圾食品 (0-15分)
    'mcdonald': { healthScore: 8, calories: 600, carbs: 45, protein: 25, fat: 35, fiber: 2, category: '超級ジャンクフード', isHealthy: false, keywords: ['mcdonald', 'mcdonalds', 'mac', 'big mac', 'マック'] },
    'kfc': { healthScore: 10, calories: 550, carbs: 40, protein: 30, fat: 30, fiber: 1, category: '超級ジャンクフード', isHealthy: false, keywords: ['kfc', 'kentucky', 'fried chicken'] },
    'pizza': { healthScore: 12, calories: 450, carbs: 50, protein: 15, fat: 20, fiber: 2, category: '超級ジャンクフード', isHealthy: false, keywords: ['pizza', 'ピザ', 'domino', 'pizza hut'] },
    'burger': { healthScore: 15, calories: 500, carbs: 40, protein: 25, fat: 25, fiber: 2, category: '超級ジャンクフード', isHealthy: false, keywords: ['burger', 'hamburger', 'cheeseburger', 'バーガー'] },
    'fries': { healthScore: 5, calories: 350, carbs: 45, protein: 4, fat: 18, fiber: 3, category: '超級ジャンクフード', isHealthy: false, keywords: ['fries', 'french fries', 'ポテト', 'フライドポテト'] },
    'cola': { healthScore: 3, calories: 150, carbs: 39, protein: 0, fat: 0, fiber: 0, category: '糖分爆弾', isHealthy: false, keywords: ['cola', 'coke', 'pepsi', 'soda', 'コーラ'] },
    'candy': { healthScore: 5, calories: 200, carbs: 50, protein: 0, fat: 2, fiber: 0, category: '糖分爆弾', isHealthy: false, keywords: ['candy', 'chocolate', 'キャンディ', 'チョコレート'] },
    
    // 🍝 加工食品/冷冻食品 (15-35分)
    'pasta': { healthScore: 25, calories: 300, carbs: 55, protein: 12, fat: 8, fiber: 3, category: '炭水化物爆弾', isHealthy: false, keywords: ['pasta', 'spaghetti', 'fettuccine', 'linguine', 'macaroni', 'パスタ', 'スパゲッティ'] },
    'frozen': { healthScore: 20, calories: 350, carbs: 40, protein: 15, fat: 15, fiber: 2, category: '冷凍ジャンク', isHealthy: false, keywords: ['frozen', 'microwave', 'instant', '冷凍', 'インスタント'] },
    'ramen': { healthScore: 18, calories: 400, carbs: 60, protein: 12, fat: 15, fiber: 2, category: '炭水化物爆弾', isHealthy: false, keywords: ['ramen', 'instant noodles', 'cup noodles', 'ラーメン', 'カップ麺'] },
    'white bread': { healthScore: 30, calories: 80, carbs: 15, protein: 3, fat: 1, fiber: 1, category: '精製炭水化物', isHealthy: false, keywords: ['white bread', 'toast', 'sandwich', '白パン', 'トースト'] },
    'white rice': { healthScore: 35, calories: 130, carbs: 28, protein: 3, fat: 0, fiber: 0, category: '精製炭水化物', isHealthy: false, keywords: ['white rice', 'rice', '白米', 'ご飯'] },
    'cereal': { healthScore: 25, calories: 120, carbs: 25, protein: 3, fat: 2, fiber: 1, category: '糖分シリアル', isHealthy: false, keywords: ['cereal', 'cornflakes', 'シリアル', 'コーンフレーク'] },
    
    // 🥩 一般食品 (35-65分)
    'fried': { healthScore: 35, calories: 300, carbs: 20, protein: 15, fat: 20, fiber: 1, category: '揚げ物', isHealthy: false, keywords: ['fried', 'deep fried', 'tempura', 'katsu', '揚げ物', 'フライ'] },
    'pork': { healthScore: 45, calories: 250, carbs: 0, protein: 26, fat: 16, fiber: 0, category: 'タンパク質', isHealthy: false, keywords: ['pork', 'bacon', 'pork cutlet', 'cutlet', 'tonkatsu', '豚肉', 'ベーコン'] },
    'beef': { healthScore: 50, calories: 280, carbs: 0, protein: 28, fat: 18, fiber: 0, category: 'タンパク質', isHealthy: false, keywords: ['beef', 'steak', '牛肉', 'ステーキ'] },
    'chicken': { healthScore: 65, calories: 165, carbs: 0, protein: 31, fat: 4, fiber: 0, category: 'タンパク質', isHealthy: true, keywords: ['chicken', 'poultry', '鶏肉', 'チキン'] },
    'bread': { healthScore: 40, calories: 80, carbs: 15, protein: 3, fat: 1, fiber: 1, category: '主食', isHealthy: false, keywords: ['bread', 'パン'] },
    
    // 🐟 健康食品 (65-85分)
    'fish': { healthScore: 85, calories: 150, carbs: 0, protein: 25, fat: 5, fiber: 0, category: '良質タンパク質', isHealthy: true, keywords: ['fish', 'salmon', 'tuna', '魚', 'サーモン', 'マグロ'] },
    'egg': { healthScore: 75, calories: 70, carbs: 1, protein: 6, fat: 5, fiber: 0, category: '良質タンパク質', isHealthy: true, keywords: ['egg', 'eggs', '卵', 'たまご'] },
    'tofu': { healthScore: 80, calories: 70, carbs: 2, protein: 8, fat: 4, fiber: 1, category: '植物性タンパク質', isHealthy: true, keywords: ['tofu', 'soy', '豆腐', '大豆'] },
    'nuts': { healthScore: 75, calories: 180, carbs: 6, protein: 6, fat: 16, fiber: 3, category: '良質脂質', isHealthy: true, keywords: ['nuts', 'almonds', 'walnuts', 'ナッツ', 'アーモンド'] },
    
    // 🥬 超健康食品 (85-100分)
    'vegetable': { healthScore: 95, calories: 25, carbs: 5, protein: 2, fat: 0, fiber: 3, category: '野菜', isHealthy: true, keywords: ['vegetable', 'vegetables', 'veggie', 'cabbage', 'chili', 'レタス', 'キャベツ', '野菜'] },
    'broccoli': { healthScore: 98, calories: 25, carbs: 5, protein: 3, fat: 0, fiber: 3, category: 'スーパーフード', isHealthy: true, keywords: ['broccoli', 'ブロッコリー'] },
    'spinach': { healthScore: 100, calories: 20, carbs: 3, protein: 3, fat: 0, fiber: 2, category: 'スーパーフード', isHealthy: true, keywords: ['spinach', 'ほうれん草'] },
    'salad': { healthScore: 95, calories: 20, carbs: 4, protein: 1, fat: 0, fiber: 2, category: '野菜', isHealthy: true, keywords: ['salad', 'lettuce', 'greens', 'サラダ', 'レタス'] },
    'fruit': { healthScore: 85, calories: 60, carbs: 15, protein: 1, fat: 0, fiber: 3, category: '果物', isHealthy: true, keywords: ['fruit', 'apple', 'banana', '果物', 'りんご', 'バナナ'] },
    'avocado': { healthScore: 90, calories: 160, carbs: 9, protein: 2, fat: 15, fiber: 7, category: 'スーパーフード', isHealthy: true, keywords: ['avocado', 'アボカド'] },
    // 🥗 サラダ典型具材
    'tomato': { healthScore: 90, calories: 18, carbs: 4, protein: 1, fat: 0, fiber: 1, category: '野菜', isHealthy: true, keywords: ['tomato', 'トマト'] },
    'cucumber': { healthScore: 85, calories: 15, carbs: 3, protein: 1, fat: 0, fiber: 1, category: '野菜', isHealthy: true, keywords: ['cucumber', 'きゅうり', 'キュウリ'] },
    'onion': { healthScore: 80, calories: 40, carbs: 9, protein: 1, fat: 0, fiber: 1, category: '野菜', isHealthy: true, keywords: ['onion', 'red onion', 'オニオン', '玉ねぎ', 'たまねぎ'] },
    'pepper': { healthScore: 85, calories: 30, carbs: 6, protein: 1, fat: 0, fiber: 2, category: '野菜', isHealthy: true, keywords: ['pepper', 'bell pepper', 'capsicum', 'パプリカ'] },
    'herb': { healthScore: 90, calories: 5, carbs: 1, protein: 0, fat: 0, fiber: 0, category: 'ハーブ', isHealthy: true, keywords: ['cilantro', 'parsley', 'herb', 'コリアンダー', 'パクチー', 'パセリ'] },
  }

  // === 🚀 追加 / 覆盖的食材健康评分数据（由用户提供） ===
  const additionalFoodData: Record<string, {
    healthScore: number
    calories: number
    carbs: number
    protein: number
    fat: number
    fiber: number
    category: string
    isHealthy: boolean
    keywords: string[]
  }> = {
    // 超级垃圾食品 0-15分
    'icecream': { healthScore: 7, calories: 210, carbs: 26, protein: 3, fat: 11, fiber: 0, category: '糖分爆弾', isHealthy: false, keywords: ['icecream', 'ice cream', 'アイス', 'アイスクリーム', '雪糕', '冰淇淋'] },
    'donut':    { healthScore: 7, calories: 240, carbs: 30, protein: 3, fat: 12, fiber: 1, category: '糖分爆弾', isHealthy: false, keywords: ['donut', 'doughnut', 'ドーナツ', '甜甜圈'] },
    'snack':    { healthScore: 10, calories: 200, carbs: 22, protein: 2, fat: 11, fiber: 1, category: '零食',     isHealthy: false, keywords: ['snack', 'chips', 'snacks', 'お菓子', '零食'] },

    // 加工 / 快餐 15-35
    'udon':     { healthScore: 25, calories: 270, carbs: 55, protein: 8, fat: 1, fiber: 2, category: '麺類', isHealthy: false, keywords: ['udon', 'うどん'] },

    // 乳製品 35-75
    'milk':     { healthScore: 70, calories: 50, carbs: 5, protein: 4, fat: 2, fiber: 0, category: '乳製品', isHealthy: true,  keywords: ['milk', '牛乳', 'ミルク'] },
    'cheese':   { healthScore: 60, calories: 90, carbs: 1, protein: 6, fat: 7, fiber: 0, category: '乳製品', isHealthy: false, keywords: ['cheese', 'チーズ'] },
    'yogurt':   { healthScore: 75, calories: 60, carbs: 7, protein: 5, fat: 2, fiber: 0, category: '乳製品', isHealthy: true,  keywords: ['yogurt', 'ヨーグルト'] },

    // 水 / 茶 85-100
    'water':    { healthScore: 100, calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, category: '飲料', isHealthy: true, keywords: ['water', '水', 'みず'] },
    'tea':      { healthScore: 95,  calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0, category: '飲料', isHealthy: true, keywords: ['tea', 'green tea', 'お茶', '緑茶', '紅茶', 'tea'] },
  }

  // 合并额外数据；如有同名键将覆盖旧值
  Object.assign(foodHealthData, additionalFoodData)

  let totalCalories = 0
  let totalCarbs = 0
  let totalProtein = 0
  let totalFat = 0
  let totalFiber = 0
  let healthScoreSum = 0
  let count = 0
  let unhealthyFoodCount = 0
  
  const categories: FoodRecognitionResult['categories'] = []
  const vitamins: string[] = []
  const detectedFoods: string[] = []

  // 通用 StopWord，過濾非食物相關泛用詞
  const stopWords = [
    'food', 'meal', 'dinner', 'lunch', 'breakfast', 'dish', 'cooking', 'nutrition', 'health',
    'taste', 'delicious', 'traditional', 'homemade', 'ready', 'horizontal', 'vertical', 'isolate',
    'no person', 'ingredients', 'wood', 'indoors', 'hot', 'cold'
  ]

  // 分析每个识别的食材
  ingredients.forEach(ingredient => {
    const keyOriginal = ingredient.toLowerCase().trim()

    // 若屬於 StopWord，直接跳過
    if (stopWords.includes(keyOriginal)) {
      return
    }

    const key = keyOriginal
    let found = false
    
    // 更智能的匹配算法
    for (const [foodKey, data] of Object.entries(foodHealthData)) {
      // 检查关键词匹配
      const keywordMatch = data.keywords.some(keyword => 
        key.includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(key)
      )
      
      if (keywordMatch || key.includes(foodKey) || foodKey.includes(key)) {
        totalCalories += data.calories
        totalCarbs += data.carbs
        totalProtein += data.protein
        totalFat += data.fat
        totalFiber += data.fiber
        healthScoreSum += data.healthScore
        count++
        
        if (!data.isHealthy) {
          unhealthyFoodCount++
        }
        
        categories.push({
          name: data.category,
          confidence: 90,
          isHealthy: data.isHealthy
        })
        
        detectedFoods.push(foodKey)
        
        if (data.isHealthy) {
          vitamins.push('ビタミンC', 'ビタミンA', 'ビタミンK')
        }
        
        found = true
        break
      }
    }
    
    // 如果没有找到匹配，給中立分數（不視為垃圾食物）
    if (!found) {
      totalCalories += 150  // 假設中等熱量
      totalCarbs += 15
      totalProtein += 5
      totalFat += 5
      totalFiber += 1
      healthScoreSum += 60  // 未分類但大概率是配料，給較高中立分
      count++
      
      categories.push({
        name: '未分類',
        confidence: 30,
        isHealthy: true
      })
    }
  })

  let avgHealthScore = count > 0 ? Math.round(healthScoreSum / count) : 35
  
  // 如果有多个垃圾食品，进一步降低分数
  if (unhealthyFoodCount > 1) {
    avgHealthScore = Math.max(5, avgHealthScore - (unhealthyFoodCount * 5))
  }
  
  // 如果全是垃圾食品，强制低分
  if (unhealthyFoodCount === count && count > 0) {
    avgHealthScore = Math.min(avgHealthScore, 25)
  }

  // 💚 健康加成：若無垃圾食品，最低 +10 分，最高 95
  if (unhealthyFoodCount === 0 && avgHealthScore < 75) {
    avgHealthScore = Math.min(95, avgHealthScore + 15)
  }

  // 生成更尖锐的评价信息
  let message = ''
  const hasJunkFood = detectedFoods.some(food => ['mcdonald', 'kfc', 'fries', 'cola', 'candy'].includes(food))
  const hasPasta = detectedFoods.includes('pasta')
  const hasFrozen = detectedFoods.includes('frozen')
  
  if (avgHealthScore >= 90) {
    message = '完璧です！これこそ理想的な食事！あなたの体が喜んでいます！🌟✨'
  } else if (avgHealthScore >= 80) {
    message = 'とても良い選択です！健康への意識が高いですね！💪'
  } else if (avgHealthScore >= 65) {
    message = 'まあまあですが、もう少し野菜を増やしませんか？🥬'
  } else if (avgHealthScore >= 50) {
    message = 'う〜ん...もう少し健康的な選択肢を考えてみて？😅'
  } else if (avgHealthScore >= 30) {
    if (hasPasta) {
      message = 'パスタは炭水化物の塊ですよ！野菜も一緒に食べましょう！🍝→🥗'
    } else {
      message = 'これはちょっと...野菜と魚を増やしてください！😰'
    }
  } else if (avgHealthScore >= 15) {
    if (hasFrozen) {
      message = '冷凍食品ばかりじゃダメです！料理しましょう！❄️❌'
    } else {
      message = 'これじゃあ体に悪いです！もっと野菜を食べて！🚨'
    }
  } else {
    if (hasJunkFood) {
      message = 'マック？KFC？これはもう食事じゃなくて毒です！🤮💀'
    } else {
      message = 'これは危険レベルです！今すぐサラダを食べてください！🆘🥗'
    }
  }

  return {
    nutrition: {
      calories: Math.round(totalCalories),
      carbs: Math.round(totalCarbs),
      protein: Math.round(totalProtein),
      fat: Math.round(totalFat),
      fiber: Math.round(totalFiber),
      vitamins: [...new Set(vitamins)]
    },
    healthScore: avgHealthScore,
    categories: categories.slice(0, 3),
    message
  }
}

// 主要分析函数
export async function analyzeFoodImage(file: File): Promise<FoodRecognitionResult> {
  try {
    console.log('=== 🍽️ 开始食物分析 ===')
    console.log('📋 当前API架构:')
    console.log('   ✅ Next.js API路由: /api/analyze-food')
    console.log('   ✅ Clarifai API: 服务器端调用 (解决CORS问题)')
    console.log('   ✅ 免费额度: 5000次/月')
    console.log('   ❌ Google Vision API: 已禁用 (需要付费)')
    console.log('   ✅ 文件名识别: 智能备选方案')
    console.log('文件名:', file.name)
    console.log('文件大小:', file.size, 'bytes')
    
    // 将图片转换为base64
    console.log('1. 转换图片为base64...')
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('图片转换完成')
        resolve(e.target?.result as string)
      }
      reader.onerror = (e) => {
        console.error('图片读取失败:', e)
        reject(new Error('图片读取失败'))
      }
      reader.readAsDataURL(file)
    })

    console.log('2. 🤖 开始AI食物识别...')
    
    // 使用Clarifai API进行主要识别
    console.log('2a. 🎯 使用Clarifai API识别...')
    let ingredients = await recognizeWithClarifai(base64)
    console.log('🍽️ Clarifai识别结果:', ingredients)
    
    // 如果Clarifai失败，暂时跳过Google Vision（需要付费）
    if (ingredients.length === 0) {
      console.log('2b. Clarifai无结果，跳过Google Vision（需要计费）...')
      // ingredients = await recognizeWithGoogleVision(base64)  // 暂时禁用
      console.log('Google Vision已禁用，直接使用文件名识别')
    }
    
    // 如果所有API都失败，使用基于文件名的智能识别
    if (ingredients.length === 0) {
      console.log('2c. API识别失败，使用文件名分析...')
      const fileName = file.name.toLowerCase()
      console.log('分析文件名:', fileName)
      
      // 垃圾食品识别
      if (fileName.includes('mac') || fileName.includes('mcdonald') || fileName.includes('burger')) {
        ingredients = ['mcdonald', 'fries', 'cola']
        console.log('识别为麦当劳类食品')
      } else if (fileName.includes('kfc') || fileName.includes('fried chicken')) {
        ingredients = ['kfc', 'fries', 'cola']
        console.log('识别为KFC类食品')
      } else if (fileName.includes('pizza')) {
        ingredients = ['pizza', 'cheese', 'bread']
        console.log('识别为披萨')
      } else if (fileName.includes('pasta') || fileName.includes('spaghetti') || fileName.includes('macaroni')) {
        ingredients = ['pasta', 'white bread']  // 大部分pasta都是简单碳水
        console.log('识别为意面类')
      } else if (fileName.includes('frozen') || fileName.includes('instant') || fileName.includes('microwave')) {
        ingredients = ['frozen', 'pasta']
        console.log('识别为冷冻食品')
      } else if (fileName.includes('ramen') || fileName.includes('noodle')) {
        ingredients = ['ramen', 'white rice']
        console.log('识别为拉面/面条')
      } else if (fileName.includes('fries') || fileName.includes('potato')) {
        ingredients = ['fries']
        console.log('识别为薯条/土豆')
      } else if (fileName.includes('cola') || fileName.includes('soda') || fileName.includes('coke')) {
        ingredients = ['cola']
        console.log('识别为可乐/汽水')
      } else if (fileName.includes('candy') || fileName.includes('chocolate') || fileName.includes('sweet')) {
        ingredients = ['candy']
        console.log('识别为糖果/巧克力')
      } else if (fileName.includes('salad') || fileName.includes('vegetable') || fileName.includes('veggie')) {
        ingredients = ['salad', 'vegetable', 'broccoli']
        console.log('识别为沙拉/蔬菜')
      } else if (fileName.includes('fish') || fileName.includes('salmon') || fileName.includes('tuna')) {
        ingredients = ['fish', 'vegetable']
        console.log('识别为鱼类')
      } else if (fileName.includes('chicken') && !fileName.includes('fried')) {
        ingredients = ['chicken', 'vegetable']
        console.log('识别为鸡肉(非油炸)')
      } else if (fileName.includes('fruit') || fileName.includes('apple') || fileName.includes('banana')) {
        ingredients = ['fruit']
        console.log('识别为水果')
      } else if (fileName.includes('broccoli') || fileName.includes('spinach')) {
        ingredients = ['broccoli', 'spinach']
        console.log('识别为绿色蔬菜')
      } else {
        // 未知食品，假设是加工食品
        ingredients = ['frozen', 'pasta']  // 降低默认假设
        console.log('未知食品，默认为加工食品')
      }
    }

    console.log('3. 最终识别的食材:', ingredients)
    
    // 分析营养和健康分数
    console.log('4. 分析营养和健康分数...')
    const analysis = analyzeNutrition(ingredients)
    console.log('健康分析结果:', {
      healthScore: analysis.healthScore,
      categories: analysis.categories.map(c => c.name),
      calories: analysis.nutrition.calories
    })
    
    // 保存健康数据到localStorage
    if (typeof window !== 'undefined' && localStorage.getItem('kukupin-consent')==='1') {
      console.log('5. 保存数据到本地存储...')
      // 保存最后一餐的分数
      localStorage.setItem('last-meal-score', analysis.healthScore.toString())
      localStorage.setItem('last-fed-time', Date.now().toString())
      
      // 更新总体健康分数（平均值）
      const currentHealthScore = localStorage.getItem('pet-health-score')
      let newHealthScore = analysis.healthScore
      
      if (currentHealthScore) {
        const current = parseInt(currentHealthScore)
        // 使用加权平均：70%当前分数 + 30%新分数
        newHealthScore = Math.round(current * 0.7 + analysis.healthScore * 0.3)
      }
      
      localStorage.setItem('pet-health-score', newHealthScore.toString())

      // === 新增：累计蛋白质 & 脂肪数值 ===
      const currentProtein = parseInt(localStorage.getItem('protein-value') || '0')
      const currentFat = parseInt(localStorage.getItem('fat-value') || '0')

      const newProtein = currentProtein + analysis.nutrition.protein
      const newFat = currentFat + analysis.nutrition.fat

      localStorage.setItem('protein-value', newProtein.toString())
      localStorage.setItem('fat-value', newFat.toString())

      // === 新增：咖喱判定 -> 印度模式 ===
      const isCurry = ingredients.some(i => i.toLowerCase().includes('curry') || i.includes('カレー'))
      if (isCurry) {
        localStorage.setItem('indian-mode', 'true')
      } else {
        // 清除上一次的印度状态
        localStorage.removeItem('indian-mode')
      }

      console.log('健康数据已保存:', {
        lastMealScore: analysis.healthScore,
        newHealthScore: newHealthScore,
        protein: newProtein,
        fat: newFat,
        timestamp: new Date().toISOString()
      })
    }
    
    console.log('=== 食物分析完成 ===')
    
    const result = {
      ingredients,
      categories: analysis.categories,
      nutritionEstimate: analysis.nutrition,
      healthyScore: analysis.healthScore,
      confidence: ingredients.length > 0 ? 85 : 60,
      message: analysis.message
    }
    
    console.log('返回结果:', result)
    return result
    
  } catch (error: any) {
    console.error('=== 食物分析失败 ===')
    console.error('错误详情:', error)
    console.error('错误堆栈:', error.stack)
    
    // 返回默认结果
    const fallbackResult = {
      ingredients: ['未知食材'],
      categories: [{ name: '未分類', confidence: 50, isHealthy: true }],
      nutritionEstimate: {
        calories: 300,
        carbs: 40,
        protein: 15,
        fat: 10,
        fiber: 5,
        vitamins: []
      },
      healthyScore: 60,
      confidence: 30,
      message: '画像の分析に失敗しました。もう一度お試しください。'
    }
    
    console.log('返回默认结果:', fallbackResult)
    return fallbackResult
  }
} 