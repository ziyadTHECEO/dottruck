'use client'

import { useState, useRef } from 'react'

interface AudioPlayerProps {
  src: string
  isMine?: boolean
}

export function AudioPlayer({ src, isMine }: AudioPlayerProps) {
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggle = () => {
    if (!audioRef.current) {
      const audio = new Audio(src)
      audioRef.current = audio

      audio.ontimeupdate = () => {
        if (audio.duration) {
          setProgress((audio.currentTime / audio.duration) * 100)
        }
      }
      audio.onended = () => {
        setPlaying(false)
        setProgress(0)
      }
    }

    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.play()
      setPlaying(true)
    }
  }

  return (
    <div className={`flex items-center gap-2 min-w-[140px] ${isMine ? 'flex-row-reverse' : ''}`}>
      <button
        type="button"
        onClick={toggle}
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 cursor-pointer ${
          isMine ? 'bg-white/20 text-white' : 'bg-accent/10 text-accent'
        }`}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
        )}
      </button>
      <div className="flex-1 h-1 rounded-full bg-current/20 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isMine ? 'bg-white/60' : 'bg-accent'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
