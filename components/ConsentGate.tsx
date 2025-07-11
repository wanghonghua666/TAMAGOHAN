'use client'

import React, { useState, useEffect } from 'react'
import ConsentModal from './ConsentModal'

export default function ConsentGate() {
  const [consent, setConsent] = useState(true)

  // 仅在客户端读取 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const has = localStorage.getItem('kukupin-consent') === '1'
      setConsent(has)
    }
  }, [])

  const handleAccept = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kukupin-consent', '1')
    }
    setConsent(true)
  }

  if (consent) return null
  return <ConsentModal onAccept={handleAccept} />
} 