import React from 'react'

interface Props {
  onAccept: () => void
}

export default function ConsentModal({ onAccept }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999]">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full m-4">
        <h2 className="text-xl font-black text-purple-800 mb-3 text-center">データ保存の同意</h2>
        <p className="text-sm mb-6 leading-relaxed text-gray-700">
          本ゲームではスコア・図鑑などを <span className="font-bold">お使いのブラウザのローカルストレージ</span> に保存します。<br />
          サーバーへ送信されることはありません。よろしいですか？
        </p>
        <button
          onClick={onAccept}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-full transition"
        >
          同意して続行
        </button>
      </div>
    </div>
  )
} 