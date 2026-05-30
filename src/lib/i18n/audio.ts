import type { Language } from './constants'

function getVoice(lang: Language): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null

  const voices = window.speechSynthesis.getVoices()
  const langCode = lang === 'ar' ? 'ar' : 'fr'

  return (
    voices.find(v => v.lang === (lang === 'ar' ? 'ar-MA' : 'fr-FR')) ??
    voices.find(v => v.lang.startsWith(langCode)) ??
    null
  )
}

export function speak(text: string, lang: Language): { cancel: () => void } {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return { cancel: () => {} }
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  const voice = getVoice(lang)

  if (voice) {
    utterance.voice = voice
  }

  utterance.lang = lang === 'ar' ? 'ar-MA' : 'fr-FR'
  utterance.rate = 0.8
  utterance.pitch = 1

  window.speechSynthesis.speak(utterance)

  return {
    cancel: () => window.speechSynthesis.cancel(),
  }
}

export function isTTSSupported(lang: Language): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  return getVoice(lang) !== null
}

export function playAudioFile(path: string): { cancel: () => void } {
  const audio = new Audio(path)
  audio.play().catch(() => {})
  return {
    cancel: () => {
      audio.pause()
      audio.currentTime = 0
    },
  }
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine') {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.value = 0.3
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.stop(ctx.currentTime + duration)
}

export function playSoundEffect(type: 'success' | 'error' | 'notification') {
  switch (type) {
    case 'success':
      playTone(523, 0.15)
      setTimeout(() => playTone(659, 0.15), 150)
      setTimeout(() => playTone(784, 0.3), 300)
      break
    case 'error':
      playTone(200, 0.3, 'square')
      break
    case 'notification':
      playTone(880, 0.1)
      setTimeout(() => playTone(1047, 0.2), 120)
      break
  }

  if (type === 'notification' && navigator.vibrate) {
    navigator.vibrate(200)
  }
}
