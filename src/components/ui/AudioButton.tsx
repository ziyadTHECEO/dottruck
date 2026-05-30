'use client'

import { useState, useRef } from 'react'
import { speak, isTTSSupported, playAudioFile } from '@/lib/i18n/audio'
import { useTranslation } from '@/lib/i18n/context'

interface AudioButtonProps {
  text: string
  audioFallback?: string
  size?: 'sm' | 'md'
  className?: string
}

export function AudioButton({ text, audioFallback, size = 'sm', className = '' }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false)
  const cancelRef = useRef<(() => void) | null>(null)
  const { lang } = useTranslation()

  const handlePlay = () => {
    if (playing) {
      cancelRef.current?.()
      setPlaying(false)
      return
    }

    setPlaying(true)

    if (isTTSSupported(lang)) {
      const { cancel } = speak(text, lang)
      cancelRef.current = cancel

      const checkInterval = setInterval(() => {
        if (!window.speechSynthesis.speaking) {
          setPlaying(false)
          clearInterval(checkInterval)
        }
      }, 200)
    } else if (audioFallback) {
      const { cancel } = playAudioFile(audioFallback)
      cancelRef.current = cancel
      setTimeout(() => setPlaying(false), 3000)
    } else {
      const { cancel } = speak(text, lang)
      cancelRef.current = cancel
      setTimeout(() => setPlaying(false), 3000)
    }
  }

  const iconSize = size === 'sm' ? 14 : 18
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <button
      type="button"
      onClick={handlePlay}
      className={`${btnSize} rounded-lg flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
        playing
          ? 'bg-accent text-white'
          : 'bg-accent/10 text-accent hover:bg-accent/20'
      } ${className}`}
      aria-label={playing ? 'إيقاف' : 'سمع'}
      title="سمع"
    >
      {playing ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="4" width="4" height="16" />
          <rect x="14" y="4" width="4" height="16" />
        </svg>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 010 7.07" />
          <path d="M19.07 4.93a10 10 0 010 14.14" />
        </svg>
      )}
    </button>
  )
}
