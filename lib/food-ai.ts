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
    // Clarifai免费API密钥 - 请替换为你自己的密钥
    const CLARIFAI_API_KEY = process.env.NEXT_PUBLIC_CLARIFAI_API_KEY
    
    if (!CLARIFAI_API_KEY) {
      console.log('Clarifai API密钥未设置，使用模拟数据')
      return []
    }

    const response = await fetch('https://api.clarifai.com/v2/models/food-item-recognition/outputs', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${CLARIFAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: [
          {
            data: {
              image: {
                base64: imageBase64.split(',')[1] // 移除data:image/jpeg;base64,前缀
              }
            }
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error('Clarifai API调用失败')
    }

    const result = await response.json()
    const concepts = result.outputs[0]?.data?.concepts || []
    
    // 提取置信度大于0.6的食物名称
    return concepts
      .filter((concept: any) => concept.value > 0.6)
      .map((concept: any) => concept.name)
      .slice(0, 5) // 最多返回5个食材
      
  } catch (error) {
    console.error('Clarifai识别失败:', error)
    return []
  }
}

// 使用Google Vision API作为备选
async function recognizeWithGoogleVision(imageBase64: string): Promise<string[]> {
  try {
    const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY
    
    if (!GOOGLE_API_KEY) {
      console.log('Google Vision API密钥未设置')
      return []
    }

    const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
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

    if (!response.ok) {
      throw new Error('Google Vision API调用失败')
    }

    const result = await response.json()
    const labels = result.responses[0]?.labelAnnotations || []
    
    // 过滤出食物相关的标签
    const foodKeywords = ['food', 'dish', 'meal', 'cuisine', 'rice', 'meat', 'vegetable', 'fruit', 'bread', 'noodle']
    return labels
      .filter((label: any) => 
        label.score > 0.7 && 
        foodKeywords.some(keyword => label.description.toLowerCase().includes(keyword))
      )
      .map((label: any) => label.description)
      .slice(0, 5)
      
  } catch (error) {
    console.error('Google Vision识别失败:', error)
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
    'pasta': { healthScore: 25, calories: 300, carbs: 55, protein: 12, fat: 8, fiber: 3, category: '炭水化物爆弾', isHealthy: false, keywords: ['pasta', 'spaghetti', 'macaroni', 'パスタ', 'スパゲッティ'] },
    'frozen': { healthScore: 20, calories: 350, carbs: 40, protein: 15, fat: 15, fiber: 2, category: '冷凍ジャンク', isHealthy: false, keywords: ['frozen', 'microwave', 'instant', '冷凍', 'インスタント'] },
    'ramen': { healthScore: 18, calories: 400, carbs: 60, protein: 12, fat: 15, fiber: 2, category: '炭水化物爆弾', isHealthy: false, keywords: ['ramen', 'instant noodles', 'cup noodles', 'ラーメン', 'カップ麺'] },
    'white bread': { healthScore: 30, calories: 80, carbs: 15, protein: 3, fat: 1, fiber: 1, category: '精製炭水化物', isHealthy: false, keywords: ['white bread', 'toast', 'sandwich', '白パン', 'トースト'] },
    'white rice': { healthScore: 35, calories: 130, carbs: 28, protein: 3, fat: 0, fiber: 0, category: '精製炭水化物', isHealthy: false, keywords: ['white rice', 'rice', '白米', 'ご飯'] },
    'cereal': { healthScore: 25, calories: 120, carbs: 25, protein: 3, fat: 2, fiber: 1, category: '糖分シリアル', isHealthy: false, keywords: ['cereal', 'cornflakes', 'シリアル', 'コーンフレーク'] },
    
    // 🥩 一般食品 (35-65分)
    'fried': { healthScore: 35, calories: 300, carbs: 20, protein: 15, fat: 20, fiber: 1, category: '揚げ物', isHealthy: false, keywords: ['fried', 'deep fried', 'tempura', 'katsu', '揚げ物', 'フライ'] },
    'pork': { healthScore: 45, calories: 250, carbs: 0, protein: 26, fat: 16, fiber: 0, category: 'タンパク質', isHealthy: false, keywords: ['pork', 'bacon', '豚肉', 'ベーコン'] },
    'beef': { healthScore: 50, calories: 280, carbs: 0, protein: 28, fat: 18, fiber: 0, category: 'タンパク質', isHealthy: false, keywords: ['beef', 'steak', '牛肉', 'ステーキ'] },
    'chicken': { healthScore: 65, calories: 165, carbs: 0, protein: 31, fat: 4, fiber: 0, category: 'タンパク質', isHealthy: true, keywords: ['chicken', 'poultry', '鶏肉', 'チキン'] },
    'bread': { healthScore: 40, calories: 80, carbs: 15, protein: 3, fat: 1, fiber: 1, category: '主食', isHealthy: false, keywords: ['bread', 'パン'] },
    
    // 🐟 健康食品 (65-85分)
    'fish': { healthScore: 85, calories: 150, carbs: 0, protein: 25, fat: 5, fiber: 0, category: '良質タンパク質', isHealthy: true, keywords: ['fish', 'salmon', 'tuna', '魚', 'サーモン', 'マグロ'] },
    'egg': { healthScore: 75, calories: 70, carbs: 1, protein: 6, fat: 5, fiber: 0, category: '良質タンパク質', isHealthy: true, keywords: ['egg', 'eggs', '卵', 'たまご'] },
    'tofu': { healthScore: 80, calories: 70, carbs: 2, protein: 8, fat: 4, fiber: 1, category: '植物性タンパク質', isHealthy: true, keywords: ['tofu', 'soy', '豆腐', '大豆'] },
    'nuts': { healthScore: 75, calories: 180, carbs: 6, protein: 6, fat: 16, fiber: 3, category: '良質脂質', isHealthy: true, keywords: ['nuts', 'almonds', 'walnuts', 'ナッツ', 'アーモンド'] },
    
    // 🥬 超健康食品 (85-100分)
    'vegetable': { healthScore: 95, calories: 25, carbs: 5, protein: 2, fat: 0, fiber: 3, category: '野菜', isHealthy: true, keywords: ['vegetable', 'vegetables', 'veggie', '野菜'] },
    'broccoli': { healthScore: 98, calories: 25, carbs: 5, protein: 3, fat: 0, fiber: 3, category: 'スーパーフード', isHealthy: true, keywords: ['broccoli', 'ブロッコリー'] },
    'spinach': { healthScore: 100, calories: 20, carbs: 3, protein: 3, fat: 0, fiber: 2, category: 'スーパーフード', isHealthy: true, keywords: ['spinach', 'ほうれん草'] },
    'salad': { healthScore: 95, calories: 20, carbs: 4, protein: 1, fat: 0, fiber: 2, category: '野菜', isHealthy: true, keywords: ['salad', 'lettuce', 'greens', 'サラダ', 'レタス'] },
    'fruit': { healthScore: 85, calories: 60, carbs: 15, protein: 1, fat: 0, fiber: 3, category: '果物', isHealthy: true, keywords: ['fruit', 'apple', 'banana', '果物', 'りんご', 'バナナ'] },
    'avocado': { healthScore: 90, calories: 160, carbs: 9, protein: 2, fat: 15, fiber: 7, category: 'スーパーフード', isHealthy: true, keywords: ['avocado', 'アボカド'] }
  }

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

  // 分析每个识别的食材
  ingredients.forEach(ingredient => {
    const key = ingredient.toLowerCase()
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
    
    // 如果没有找到匹配，给更低的默认分数
    if (!found) {
      totalCalories += 200  // 假设是高热量食品
      totalCarbs += 25
      totalProtein += 8
      totalFat += 10
      totalFiber += 1
      healthScoreSum += 35  // 降低默认分数从60到35
      count++
      unhealthyFoodCount++  // 未知食品视为不健康
      
      categories.push({
        name: '未分類（おそらくジャンク）',
        confidence: 40,
        isHealthy: false
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
    // 将图片转换为base64
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })

    console.log('开始AI食物识别...')
    
    // 尝试使用Clarifai识别
    let ingredients = await recognizeWithClarifai(base64)
    
    // 如果Clarifai失败，尝试Google Vision
    if (ingredients.length === 0) {
      console.log('尝试Google Vision API...')
      ingredients = await recognizeWithGoogleVision(base64)
    }
    
    // 如果所有API都失败，使用基于文件名的智能识别
    if (ingredients.length === 0) {
      console.log('API识别失败，使用本地分析...')
      const fileName = file.name.toLowerCase()
      
      // 垃圾食品识别
      if (fileName.includes('mac') || fileName.includes('mcdonald') || fileName.includes('burger')) {
        ingredients = ['mcdonald', 'fries', 'cola']
      } else if (fileName.includes('kfc') || fileName.includes('fried chicken')) {
        ingredients = ['kfc', 'fries', 'cola']
      } else if (fileName.includes('pizza')) {
        ingredients = ['pizza', 'cheese', 'bread']
      } else if (fileName.includes('pasta') || fileName.includes('spaghetti') || fileName.includes('macaroni')) {
        ingredients = ['pasta', 'white bread']  // 大部分pasta都是简单碳水
      } else if (fileName.includes('frozen') || fileName.includes('instant') || fileName.includes('microwave')) {
        ingredients = ['frozen', 'pasta']
      } else if (fileName.includes('ramen') || fileName.includes('noodle')) {
        ingredients = ['ramen', 'white rice']
      } else if (fileName.includes('fries') || fileName.includes('potato')) {
        ingredients = ['fries']
      } else if (fileName.includes('cola') || fileName.includes('soda') || fileName.includes('coke')) {
        ingredients = ['cola']
      } else if (fileName.includes('candy') || fileName.includes('chocolate') || fileName.includes('sweet')) {
        ingredients = ['candy']
      } 
      // 健康食品识别
      else if (fileName.includes('salad') || fileName.includes('vegetable') || fileName.includes('veggie')) {
        ingredients = ['salad', 'vegetable', 'broccoli']
      } else if (fileName.includes('fish') || fileName.includes('salmon') || fileName.includes('tuna')) {
        ingredients = ['fish', 'vegetable']
      } else if (fileName.includes('chicken') && !fileName.includes('fried')) {
        ingredients = ['chicken', 'vegetable']
      } else if (fileName.includes('fruit') || fileName.includes('apple') || fileName.includes('banana')) {
        ingredients = ['fruit']
      } else if (fileName.includes('broccoli') || fileName.includes('spinach')) {
        ingredients = ['broccoli', 'spinach']
      } else {
        // 未知食品，假设是加工食品
        ingredients = ['frozen', 'pasta']  // 降低默认假设
      }
    }

    console.log('识别的食材:', ingredients)
    
    // 分析营养和健康分数
    const analysis = analyzeNutrition(ingredients)
    
    // 保存健康数据到localStorage
    if (typeof window !== 'undefined') {
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
      
      console.log('健康数据已保存:', {
        lastMealScore: analysis.healthScore,
        newHealthScore: newHealthScore,
        timestamp: new Date().toISOString()
      })
    }
    
    return {
      ingredients,
      categories: analysis.categories,
      nutritionEstimate: analysis.nutrition,
      healthyScore: analysis.healthScore,
      confidence: ingredients.length > 0 ? 85 : 60,
      message: analysis.message
    }
    
  } catch (error) {
    console.error('食物分析失败:', error)
    
    // 返回默认结果
    return {
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
  }
} 