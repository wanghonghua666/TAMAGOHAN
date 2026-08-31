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
  size?: 'small' | 'large'
}

const BUBBLE_STYLE = {
  small: {
    maxWidth: 'max-w-[260px] sm:max-w-[280px]',
    fontSize: 'clamp(14px, 2.2vw, 18px)',
    minHeight: '3.2em',
    padding: '0.65em 1.15em 1.35em',
    innerPx: '0.4em',
    textWidth: '86%',
  },
  large: {
    maxWidth: 'max-w-[390px]',
    fontSize: 'clamp(18px, 2.2vw, 23px)',
    minHeight: '5.4em',
    padding: '0.85em 1.5em 1.75em',
    innerPx: '0.5em',
    textWidth: '82%',
  },
} as const

export default function PixelSpeechBubble({ text, className = '', size = 'small' }: PixelSpeechBubbleProps) {
  const { display, phase } = useTypewriter(text)
  const showCursor = phase !== 'done' || display.length > 0
  const cfg = BUBBLE_STYLE[size]

  return (
    <div
      className={`relative block pointer-events-none w-full ${cfg.maxWidth} mx-auto box-border ${className}`}
      style={{
        padding: cfg.padding,
        backgroundImage: 'url(/pixel-speech-bubble.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        fontSize: cfg.fontSize,
      }}
    >
      <div
        className="flex items-center justify-center w-full overflow-hidden mx-auto"
        style={{ minHeight: cfg.minHeight, paddingLeft: cfg.innerPx, paddingRight: cfg.innerPx }}
      >
        <p
          className="font-pixel-bold text-center text-gray-900 leading-relaxed break-words [word-break:break-word] [overflow-wrap:break-word]"
          style={{ width: cfg.textWidth, maxWidth: '100%' }}
        >
          {display}
          {showCursor && <span className="typing-cursor">▌</span>}
        </p>
      </div>
    </div>
  )
}
