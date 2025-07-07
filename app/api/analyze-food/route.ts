import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 服务器端API路由 - 处理食物识别请求')
    
    // 从环境变量获取API密钥（服务器端不需要NEXT_PUBLIC前缀）
    const CLARIFAI_API_KEY = process.env.CLARIFAI_API_KEY
    
    if (!CLARIFAI_API_KEY) {
      console.error('❌ Clarifai API密钥未设置')
      console.error('🔧 请在.env.local中设置: CLARIFAI_API_KEY=你的密钥')
      console.error('📋 当前环境变量:', Object.keys(process.env).filter(key => key.includes('CLARIFAI')))
      return NextResponse.json(
        { error: 'Clarifai API密钥未配置' },
        { status: 500 }
      )
    }

    console.log('✅ API密钥已读取:', CLARIFAI_API_KEY.substring(0, 8) + '...')

    // 获取请求体中的图片数据
    const { imageBase64 } = await request.json()
    
    if (!imageBase64) {
      return NextResponse.json(
        { error: '缺少图片数据' },
        { status: 400 }
      )
    }

    console.log('🤖 服务器端调用Clarifai API...')
    
    // Clarifai API配置 - 先尝试食物识别模型
    const USER_ID = 'clarifai'
    const APP_ID = 'main'
    const MODEL_ID = 'food-item-recognition' // 先使用專門的食物識別模型
    console.log('🎯 使用模型(主):', MODEL_ID)
    const url = `https://api.clarifai.com/v2/users/${USER_ID}/apps/${APP_ID}/models/${MODEL_ID}/outputs`
    
    console.log('📡 API端点:', url)

    const requestBody = {
      inputs: [
        {
          data: {
            image: {
              base64: imageBase64.split(',')[1] // 移除data:image/jpeg;base64,前缀
            }
          }
        }
      ]
    }

    // 从服务器端调用Clarifai API（没有CORS限制）
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${CLARIFAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📨 Clarifai响应状态:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Clarifai API错误:', response.status, errorText)
      return NextResponse.json(
        { error: `Clarifai API调用失败: ${response.status}` },
        { status: response.status }
      )
    }

    const result = await response.json()
    console.log('🔍 Clarifai API成功响应')
    
    // 🚨 详细打印原始响应用于调试
    console.log('====== Clarifai 原始响应 ======')
    console.log(JSON.stringify(result, null, 2))
    console.log('==============================')

    // 检查响应状态
    if (result.status && result.status.code !== 10000) {
      console.error('❌ Clarifai API错误状态:', result.status)
      console.error('完整状态信息:', JSON.stringify(result.status, null, 2))
      return NextResponse.json(
        { error: `Clarifai API错误: ${result.status.description}` },
        { status: 400 }
      )
    }

    // 详细检查outputs结构
    console.log('🔍 检查outputs结构:')
    console.log('- result.outputs存在:', !!result.outputs)
    console.log('- outputs长度:', result.outputs?.length)
    console.log('- 第一个output:', result.outputs?.[0] ? 'exists' : 'null')
    console.log('- 第一个output.data:', result.outputs?.[0]?.data ? 'exists' : 'null')
    console.log('- concepts:', result.outputs?.[0]?.data?.concepts ? 'exists' : 'null')

    const concepts = result.outputs[0]?.data?.concepts || []
    console.log('🏷️ 识别的概念数量:', concepts.length)
    
    if (concepts.length > 0) {
      console.log('🏷️ 前3个概念:', concepts.slice(0, 3))
    } else {
      console.log('❌ 没有识别到任何概念，完整data结构:', JSON.stringify(result.outputs?.[0]?.data, null, 2))
    }
    
    // 提取置信度大于0.25的食物名称
    const foodItems = concepts
      .filter((concept: any) => {
        console.log(`   - ${concept.name}: ${(concept.value * 100).toFixed(1)}%`)
        return concept.value > 0.25
      })
      .map((concept: any) => concept.name.toLowerCase())
      .slice(0, 20)

    console.log('✅ 服务器端识别成功:', foodItems)

    // 如果 food 模型沒有足夠結果，嘗試通用模型 general-image-recognition
    if (foodItems.length === 0) {
      console.log('🔄 主模型無結果，嘗試備選 general-image-recognition 模型...')
      
      const generalUrl = `https://api.clarifai.com/v2/users/${USER_ID}/apps/${APP_ID}/models/general-image-recognition/outputs`
      console.log('🎯 備選模型URL:', generalUrl)
      
      try {
        const generalResponse = await fetch(generalUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Key ${CLARIFAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        })

        if (generalResponse.ok) {
          const generalResult = await generalResponse.json()
          console.log('====== 備選模型原始响应 ======')
          console.log(JSON.stringify(generalResult, null, 2))
          console.log('==============================')
          
          const generalConcepts = generalResult.outputs[0]?.data?.concepts || []
          const generalFoodItems = generalConcepts
            .filter((concept: any) => {
              const name = concept.name.toLowerCase()
              // 过滤出食物相关的标签
              const foodKeywords = ['food', 'meal', 'dish', 'bread', 'meat', 'fruit', 'vegetable', 'pasta', 'rice', 'chicken', 'fish', 'burger', 'pizza', 'salad']
              return concept.value > 0.25 && foodKeywords.some(keyword => name.includes(keyword))
            })
            .map((concept: any) => concept.name.toLowerCase())
            .slice(0, 20)
          
          console.log('🍽️ 備選模型识别的食物:', generalFoodItems)
          
          if (generalFoodItems.length > 0) {
            return NextResponse.json({
              success: true,
              ingredients: generalFoodItems,
              model: 'general-image-recognition',
              rawResponse: generalResult
            })
          }
        }
      } catch (generalError) {
        console.error('❌ 備選模型也失败了:', generalError)
      }
    }

    return NextResponse.json({
      success: true,
      ingredients: foodItems,
      model: 'food-item-recognition',
      rawResponse: result // 可选：返回原始响应用于调试
    })

  } catch (error: any) {
    console.error('❌ 服务器端API错误:', error.message)
    return NextResponse.json(
      { error: '服务器内部错误', details: error.message },
      { status: 500 }
    )
  }
} 