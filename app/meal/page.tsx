'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Camera, Upload, Sparkles, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import MacroAssessment from '@/components/MacroAssessment'
import FatQualityCard from '@/components/FatQualityCard'

export default function MealPage() {
  // 禁用登录检查，使用游客模式
  const guestUser = {
    id: 'guest-user',
    email: 'guest@kukupin.com',
    displayName: 'ゲストユーザー'
  }
  
  // 移动端检测
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(mobile)
      console.log('设备检测:', { mobile, userAgent: navigator.userAgent })
    }
    checkMobile()
  }, [])
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dragCounterRef = useRef(0)
  const router = useRouter()

  const processImageFile = (file: File) => {
    const isImage =
      file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name)

    if (isImage) {
      console.log('有效图片文件:', file.name, file.size, file.type)
      setSelectedFile(file)

      const reader = new FileReader()
      reader.onload = (e) => {
        console.log('图片预览创建完成')
        setPreview(e.target?.result as string)
      }
      reader.onerror = (e) => {
        console.error('图片读取失败:', e)
      }
      reader.readAsDataURL(file)
    } else {
      console.log('无效文件或非图片文件')
      alert('画像ファイルを選択してください。')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('文件选择事件触发')
    const file = event.target.files?.[0]
    console.log('选择的文件:', file)
    if (file) processImageFile(file)
    event.target.value = ''
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current -= 1
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragging(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragCounterRef.current = 0
    setIsDragging(false)

    const file = event.dataTransfer.files?.[0]
    console.log('拖拽文件:', file)
    if (file) processImageFile(file)
  }

  const triggerFileInput = () => {
    console.log('触发文件选择...')
    if (fileInputRef.current) {
      fileInputRef.current.click()
      console.log('文件选择器已触发')
    } else {
      console.error('文件输入引用不存在')
    }
  }

  // 真实AI图像分析函数
  const analyzeImage = async (file: File) => {
    setLoading(true)
    
    try {
      console.log('开始AI食物识别...', file.name)
      
      // 使用真实的AI分析API
      const { analyzeFoodImage } = await import('@/lib/food-ai')
      const result = await analyzeFoodImage(file)
      
      console.log('AI识别结果:', result)
      
      // 转换结果格式以匹配UI组件
      const formattedResult = {
        isEdible: result.isEdible,
        type: result.overallScore >= 70 ? 'healthy' : result.overallScore >= 40 ? 'balanced' : 'unhealthy',
        score: result.overallScore,
        healthScore: result.healthyScore,
        portionScore: result.assessment?.portionScore ?? 0,
        fatQualityScore: result.assessment?.fatQualityScore ?? 0,
        fatQuality: result.fatQuality,
        perMealFatTarget: result.assessment?.perMealTargets.fat ?? 0,
        message: result.message,
        foodName: result.foodName,
        description: result.description,
        funReview: result.funReview,
        ingredients: result.ingredients,
        nutrition: {
          calories: result.nutritionEstimate.calories,
          carbs: result.nutritionEstimate.carbs,
          protein: result.nutritionEstimate.protein,
          fat: result.nutritionEstimate.fat,
          fiber: result.nutritionEstimate.fiber,
          vegetableServings: result.nutritionEstimate.vegetableServings,
        },
        macros: result.assessment?.macros ?? [],
        tips: result.assessment?.tips ?? [],
        recommendations: result.assessment?.tips ?? [],
        confidence: result.confidence,
        source: result.source,
      }
      
      setAnalysisResult(formattedResult)
      
    } catch (error) {
      console.error('AI分析失敗:', error)
      setAnalysisResult({
        isEdible: false,
        type: 'unknown',
        score: 0,
        message: '分析に失敗しました。食事の写真をもう一度アップロードしてください 📸',
        ingredients: [],
        categories: [],
        nutrition: { calories: 0, carbs: 0, protein: 0, fat: 0, fiber: 0 },
        recommendations: [],
        source: 'error',
      })
    }
    
    setLoading(false)
  }

  const saveRecord = async () => {
    if (!analysisResult?.isEdible) return
    if (!analysisResult || !selectedFile) {
      console.error('缺少必要数据:', { analysisResult: !!analysisResult, selectedFile: !!selectedFile })
      alert('保存に必要なデータが不足しています。')
      return
    }

    try {
      // ゲストモードでは localStorage に保存
      const hasConsent = localStorage.getItem('kukupin-consent')==='1'
      console.log('同意状态:', hasConsent)
      
      if(!hasConsent){
        alert('データ保存の同意が必要です。\n\nホーム画面の「設定」ボタンから「データ保存の同意」を有効にしてください。\n\nこれにより、くっくぴんの健康データが保存され、食事記録が反映されます。')
        return
      }
      const historyKey = 'meal-history'
      const existing = hasConsent ? JSON.parse(localStorage.getItem(historyKey) || '[]') : []
      const newRecord = {
        id: Date.now(),
        fileName: selectedFile.name,
        timestamp: new Date().toISOString(),
        analysis: analysisResult,
        preview: preview
      }
      if(hasConsent){
        const updated = [newRecord, ...existing].slice(0, 50)
        localStorage.setItem(historyKey, JSON.stringify(updated))
      }

      console.log('ゲストモード - 保存完了', newRecord)
      
      // 成功メッセージを表示してホームに戻る
      alert('食事記録が記録されました！（ゲストモード）')
      router.push('/')
    } catch (error) {
      console.error('Save error:', error)
      alert('記録に失敗しました。もう一度お試しください。')
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Camera size={22} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">食事記録</h1>
            <p className="text-sm text-gray-500">写真をアップロードして AI 分析</p>
          </div>
        </div>
      </div>

      {!preview ? (
        /* ファイルアップロード */
        <div className="space-y-6">
          <div 
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer touch-manipulation ${
              isDragging
                ? 'border-primary-500 bg-primary-50 scale-[1.01]'
                : 'border-gray-300 hover:border-primary-400'
            }`}
            onClick={triggerFileInput}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              style={{ fontSize: '16px' }}
            />
            
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Camera size={32} className="text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  食事の写真をアップロード
                </h3>
                <p className="text-gray-600 mb-4">
                  {isMobile
                    ? 'タップしてカメラで撮影、または下のボタンから選択してください'
                    : isDragging
                      ? 'ここにドロップしてください 📥'
                      : 'クリックしてファイルを選択するか、ドラッグ&ドロップしてください'}
                </p>
                <p className="text-sm text-gray-500">
                  JPG, PNG形式に対応
                </p>
              </div>
            </div>
          </div>

          {isMobile && (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                または
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    // 创建专门用于相机的input
                    const cameraInput = document.createElement('input')
                    cameraInput.type = 'file'
                    cameraInput.accept = 'image/*'
                    cameraInput.capture = 'environment'
                    cameraInput.onchange = (e) => {
                      const target = e.target as HTMLInputElement
                      if (target.files?.[0]) processImageFile(target.files[0])
                    }
                    cameraInput.click()
                  }}
                  className="btn-secondary inline-flex items-center touch-manipulation"
                >
                  <Camera size={16} className="mr-2" />
                  カメラで撮影
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); triggerFileInput() }}
                  className="btn-secondary inline-flex items-center touch-manipulation"
                >
                  <Upload size={16} className="mr-2" />
                  ギャラリーから選択
                </button>
              </div>
            </div>
          )}
          
          {!isMobile && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                または
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); triggerFileInput() }}
                className="mt-2 btn-secondary inline-flex items-center touch-manipulation"
              >
                <Upload size={16} className="mr-2" />
                ファイルを選択
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 画像プレビューと分析 */
        <div className="space-y-6">
          {/* 画像プレビュー */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              アップロードした画像
            </h3>
            <div className="aspect-w-16 aspect-h-12 bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={preview}
                alt="選択された食事"
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => {
                  setPreview(null)
                  setSelectedFile(null)
                  setAnalysisResult(null)
                }}
                className="text-gray-600 hover:text-gray-800"
              >
                別の画像を選択
              </button>
              {!loading && !analysisResult && (
                              <button
                onClick={() => analyzeImage(selectedFile!)}

                className="btn-primary inline-flex items-center touch-manipulation"
              >
                  <Sparkles size={16} className="mr-2" />
                  AI分析を開始
                </button>
              )}
            </div>
          </div>

          {/* 分析中表示 */}
          {loading && (
            <div className="card text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                AI分析中...
              </h3>
              <p className="text-gray-600">
                画像を解析して健康スコアを算出しています
              </p>
              <p className="text-sm text-gray-400 mt-2">
                通常 15〜40 秒かかります。しばらくお待ちください…
              </p>
            </div>
          )}

          {/* 分析結果 */}
          {analysisResult && !analysisResult.isEdible && (
            <div className="card text-center py-8">
              <div className="text-6xl mb-4">{analysisResult.source === 'error' ? '⚠️' : '🚫'}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {analysisResult.source === 'error' ? '分析できませんでした' : '食べ物が見つかりません'}
              </h3>
              {analysisResult.description && (
                <p className="text-gray-700 text-left bg-gray-50 rounded-xl p-4 mb-3 text-sm leading-relaxed">
                  {analysisResult.description}
                </p>
              )}
              <p className="text-gray-600 mb-4">{analysisResult.funReview || analysisResult.message}</p>
              <button
                onClick={() => { setPreview(null); setSelectedFile(null); setAnalysisResult(null) }}
                className="btn-secondary"
              >
                別の写真を選ぶ
              </button>
            </div>
          )}

          {analysisResult && analysisResult.isEdible && (
            <div className="space-y-6">
              {/* AI 描述 */}
              {(analysisResult.foodName || analysisResult.description) && (
                <div className="card">
                  {analysisResult.foodName && (
                    <h3 className="text-lg font-black text-purple-800 mb-2">🍽️ {analysisResult.foodName}</h3>
                  )}
                  {analysisResult.description && (
                    <p className="text-gray-700 text-sm leading-relaxed">{analysisResult.description}</p>
                  )}
                </div>
              )}

              {/* スコア表示 */}
              <div className="card text-center">
                <div className="mb-4">
                  <div className="text-6xl mb-2">🐻</div>
                  <div className="text-4xl font-bold text-primary-600 mb-1">
                    {analysisResult.score}/100
                  </div>
                  <div className="text-lg text-gray-600 mb-1">総合スコア</div>
                  <div className="text-xs text-gray-400 mb-2">
                    食品質 {analysisResult.healthScore}点 · 份量 {analysisResult.portionScore}点 · 脂質 {analysisResult.fatQualityScore}点
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className={`h-4 rounded-full transition-all duration-1000 ${
                        analysisResult.score >= 70 ? 'bg-green-500' :
                        analysisResult.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${analysisResult.score}%` }}
                    ></div>
                  </div>
                </div>
                {(analysisResult.funReview || analysisResult.message) && (
                  <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-4 text-left">
                    <p className="text-xs font-bold text-orange-600 mb-1">くっくぴんのコメント</p>
                    <p className="text-gray-800 leading-relaxed">{analysisResult.funReview || analysisResult.message}</p>
                  </div>
                )}
              </div>

              {/* 宏量营养素评估 */}
              {analysisResult.macros?.length > 0 && (
                <MacroAssessment
                  macros={analysisResult.macros}
                  portionScore={analysisResult.portionScore}
                />
              )}

              {analysisResult.fatQuality && (
                <FatQualityCard
                  fatQuality={analysisResult.fatQuality}
                  targetFat={analysisResult.perMealFatTarget || 20}
                />
              )}

              {/* 詳細分析 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 検出された食材 */}
                {analysisResult.ingredients?.length > 0 && (
                <div className="card">
                  <h4 className="font-medium text-gray-900 mb-3">検出された食材</h4>
                  <div className="space-y-2">
                    {analysisResult.ingredients.map((ingredient: string, index: number) => (
                      <div key={index} className="flex items-center">
                        <CheckCircle size={16} className="text-green-500 mr-2" />
                        <span className="text-gray-700">{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>
                )}

                {/* 栄養情報 */}
                <div className="card">
                  <h4 className="font-medium text-gray-900 mb-3">栄養情報（推定）</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">カロリー</span>
                      <span className="font-medium">{analysisResult.nutrition.calories} kcal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">炭水化物</span>
                      <span className="font-medium">{analysisResult.nutrition.carbs} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">タンパク質</span>
                      <span className="font-medium">{analysisResult.nutrition.protein} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">脂質</span>
                      <span className="font-medium">{analysisResult.nutrition.fat} g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">食物繊維</span>
                      <span className="font-medium">{analysisResult.nutrition.fiber} g</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 推奨事項 */}
              {analysisResult.recommendations?.length > 0 && (
              <div className="card">
                <h4 className="font-medium text-gray-900 mb-3">アドバイス</h4>
                <ul className="space-y-2">
                  {analysisResult.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary-500 mr-2">•</span>
                      <span className="text-gray-700">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              )}

              {/* 保存ボタン */}
              <div className="text-center">
                <button
                  onClick={saveRecord}

                  className="btn-primary text-lg px-8 py-3 touch-manipulation"
                >
                  記録を保存してキャラクターを育てる
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 