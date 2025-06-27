'use client'

import React from 'react'
import { useAuth } from '@/lib/auth-context'
import { Info, Settings } from 'lucide-react'

export default function DemoNotice() {
  const { isDemo } = useAuth()

  if (!isDemo) return null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-blue-900 mb-1">
            🚀 Demo模式で実行中
          </h3>
          <p className="text-sm text-blue-700 mb-3">
            現在はFirebaseなしのデモ版として動作しています。すべての機能を体験できますが、データは保存されません。
          </p>
          <div className="bg-blue-100 rounded-md p-3">
            <h4 className="text-xs font-medium text-blue-900 mb-2 flex items-center">
              <Settings className="w-4 h-4 mr-1" />
              本格的に使用するには：
            </h4>
            <ol className="text-xs text-blue-800 space-y-1 ml-4">
              <li>1. <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Firebase Console</a>でプロジェクトを作成</li>
              <li>2. Authentication、Firestore、Storageを有効化</li>
              <li>3. プロジェクトルートに<code className="bg-blue-200 px-1 rounded">.env.local</code>ファイルを作成</li>
              <li>4. Firebase設定情報を環境変数として追加</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
} 