'use client'

import { useState, useEffect } from 'react'

export function useTypewriter(text: string, speed = 90, startDelay = 500) {
  const [display, setDisplay] = useState('')
  const [phase, setPhase] = useState<'waiting' | 'typing' | 'done'>('waiting')

  useEffect(() => {
    setDisplay('')
    setPhase('waiting')

    let typeTimer: ReturnType<typeof setTimeout> | undefined
    const startTimer = setTimeout(() => {
      setPhase('typing')
      let i = 0
      const tick = () => {
        i++
        setDisplay(text.slice(0, i))
        if (i < text.length) {
          typeTimer = setTimeout(tick, speed)
        } else {
          setPhase('done')
        }
      }
      typeTimer = setTimeout(tick, speed)
    }, startDelay)

    return () => {
      clearTimeout(startTimer)
      if (typeTimer) clearTimeout(typeTimer)
    }
  }, [text, speed, startDelay])

  return { display, phase }
}

interface PixelSpeechBubbleProps {
  text: string
  className?: string
}

export default function PixelSpeechBubble({ text, className = '' }: PixelSpeechBubbleProps) {
  const { display, phase } = useTypewriter(text)
  const showCursor = phase !== 'done' || display.length > 0
  const compact = text.length <= 12

  return (
    <div
      className={`relative inline-block pointer-events-none min-w-[10.8em] max-w-[45vw] md:max-w-[33vw] ${className}`}
      style={{
        width: 'max-content',
        padding: '0.65em 1em 1.35em',
        backgroundImage: 'url(/pixel-speech-bubble.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        fontSize: 'clamp(21px, 4.7vw, 28px)',
      }}
    >
      <div className="flex items-center justify-center min-h-[4.32em] px-1">
        <p
          className={`font-pixel-bold text-center text-gray-900 leading-snug ${compact ? 'whitespace-nowrap' : 'break-words'}`}
        >
          {display}
          {showCursor && <span className="typing-cursor">▌</span>}
        </p>
      </div>
    </div>
  )
}
