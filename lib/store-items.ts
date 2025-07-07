export interface StoreItem {
  id: string
  name: string
  emoji: string
  price: number
}

export const storeItems: StoreItem[] = [
  { id: 'plant', name: 'グリーンプラント', emoji: '🌿', price: 50 },
  { id: 'sofa', name: 'ソファ', emoji: '🛋️', price: 120 },
  { id: 'lamp', name: 'ランプ', emoji: '💡', price: 80 },
  { id: 'art', name: 'アートフレーム', emoji: '🖼️', price: 100 }
] 