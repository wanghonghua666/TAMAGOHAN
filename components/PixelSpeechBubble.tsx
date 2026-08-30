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
  return (
    <div
      className={`relative block pointer-events-none w-full max-w-[260px] sm:max-w-[280px] lg:max-w-[300px] mx-auto box-border ${className}`}
      style={{
        padding: '0.65em 1em 1.35em',
        backgroundImage: 'url(/pixel-speech-bubble.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        fontSize: 'clamp(14px, 2.2vw, 18px)',
      }}
    >
      <div className="flex items-center justify-center min-h-[3.2em] px-0.5 w-full overflow-hidden">
        <p className="font-pixel-bold text-center text-gray-900 leading-snug break-words w-full [overflow-wrap:anywhere]">
          {display}
          {showCursor && <span className="typing-cursor">▌</span>}
        </p>
      </div>
    </div>
  )
}
