'use client'

import { useState, useEffect, useCallback } from 'react'
import { markOnboardingComplete } from '@/app/onboarding/actions'

// ── SVG Illustrations ─────────────────────────────────────────────────────────

function IlluWelcome() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background circle */}
      <circle cx="100" cy="90" r="72" fill="#EFF6FF" />
      {/* Truck body */}
      <rect x="44" y="88" width="68" height="38" rx="6" fill="#1D4ED8" />
      <rect x="112" y="96" width="34" height="30" rx="5" fill="#2563EB" />
      {/* Cab window */}
      <rect x="116" y="100" width="22" height="14" rx="3" fill="#BFDBFE" />
      {/* Wheels */}
      <circle cx="62" cy="130" r="10" fill="#1E3A5F" />
      <circle cx="62" cy="130" r="5" fill="#93C5FD" />
      <circle cx="128" cy="130" r="10" fill="#1E3A5F" />
      <circle cx="128" cy="130" r="5" fill="#93C5FD" />
      {/* Road */}
      <rect x="30" y="138" width="140" height="6" rx="3" fill="#DBEAFE" />
      {/* Stars / sparkles */}
      <circle cx="60" cy="55" r="5" fill="#FCD34D" />
      <circle cx="150" cy="48" r="4" fill="#FCD34D" />
      <circle cx="165" cy="75" r="3" fill="#FCD34D" />
      <circle cx="38" cy="72" r="3" fill="#FCD34D" />
      {/* Dottruck D logo on truck */}
      <text x="70" y="112" fontFamily="sans-serif" fontWeight="bold" fontSize="18" fill="white">D</text>
    </svg>
  )
}

function IlluSeeCharges() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="90" r="72" fill="#EFF6FF" />
      {/* Phone frame */}
      <rect x="60" y="30" width="80" height="130" rx="12" fill="white" stroke="#DBEAFE" strokeWidth="2" />
      {/* Screen */}
      <rect x="66" y="42" width="68" height="106" rx="6" fill="#F0F9FF" />
      {/* Charge cards */}
      <rect x="70" y="48" width="60" height="22" rx="5" fill="#1D4ED8" />
      <rect x="70" y="75" width="60" height="22" rx="5" fill="#DBEAFE" />
      <rect x="70" y="102" width="60" height="22" rx="5" fill="#DBEAFE" />
      {/* Text lines on cards */}
      <rect x="74" y="53" width="32" height="4" rx="2" fill="white" opacity="0.9" />
      <rect x="74" y="61" width="24" height="3" rx="1.5" fill="white" opacity="0.6" />
      <rect x="74" y="80" width="32" height="4" rx="2" fill="#1D4ED8" opacity="0.7" />
      <rect x="74" y="107" width="32" height="4" rx="2" fill="#1D4ED8" opacity="0.7" />
      {/* Arrow pointing to first card */}
      <path d="M145 59 L130 59" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" markerEnd="url(#arr)" />
      <circle cx="148" cy="59" r="5" fill="#F59E0B" />
    </svg>
  )
}

function IlluAccept() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="90" r="72" fill="#ECFDF5" />
      {/* Big checkmark circle */}
      <circle cx="100" cy="88" r="45" fill="#059669" opacity="0.1" />
      <circle cx="100" cy="88" r="34" fill="#059669" />
      <path d="M82 88 L96 102 L122 76" stroke="white" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Accept button style */}
      <rect x="54" y="140" width="92" height="26" rx="13" fill="#059669" />
      <text x="100" y="157" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="12" fill="white">قبل ✓</text>
      {/* Sparkles */}
      <circle cx="50" cy="72" r="4" fill="#34D399" />
      <circle cx="155" cy="68" r="5" fill="#34D399" />
      <circle cx="162" cy="110" r="3" fill="#34D399" />
    </svg>
  )
}

function IlluPrice() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="90" r="72" fill="#FFFBEB" />
      {/* Price tag */}
      <path d="M68 52 L138 52 L138 118 L100 140 L62 118 L62 62 Z" fill="#FCD34D" opacity="0.25" />
      <rect x="66" y="55" width="68" height="78" rx="10" fill="white" stroke="#FCD34D" strokeWidth="2.5" />
      {/* MAD symbol */}
      <text x="100" y="92" textAnchor="middle" fontFamily="sans-serif" fontWeight="800" fontSize="28" fill="#D97706">MAD</text>
      {/* Underline / input field style */}
      <rect x="72" y="100" width="56" height="3" rx="1.5" fill="#FCD34D" />
      <text x="100" y="115" textAnchor="middle" fontFamily="sans-serif" fontSize="10" fill="#9CA3AF">حدد الثمن هنا</text>
      {/* Coins */}
      <circle cx="42" cy="95" r="12" fill="#FCD34D" />
      <text x="42" y="99" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="10" fill="#92400E">د</text>
      <circle cx="162" cy="88" r="10" fill="#FCD34D" />
      <text x="162" y="92" textAnchor="middle" fontFamily="sans-serif" fontWeight="bold" fontSize="9" fill="#92400E">د</text>
    </svg>
  )
}

function IlluComplete() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="90" r="72" fill="#F5F3FF" />
      {/* Trophy / celebration */}
      <path d="M75 110 L75 72 Q75 55 100 55 Q125 55 125 72 L125 110 Z" fill="#7C3AED" opacity="0.15" />
      <path d="M80 106 L80 76 Q80 62 100 62 Q120 62 120 76 L120 106 Z" fill="#7C3AED" />
      {/* Trophy base */}
      <rect x="88" y="106" width="24" height="6" rx="3" fill="#7C3AED" />
      <rect x="82" y="112" width="36" height="8" rx="4" fill="#5B21B6" />
      {/* Stars on trophy */}
      <path d="M100 72 L102 78 L108 78 L103 82 L105 88 L100 84 L95 88 L97 82 L92 78 L98 78 Z" fill="#FCD34D" />
      {/* Money notes flying */}
      <rect x="36" y="76" width="22" height="14" rx="3" fill="#059669" transform="rotate(-15 47 83)" />
      <text x="47" y="85" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="white" transform="rotate(-15 47 83)">MAD</text>
      <rect x="142" y="80" width="22" height="14" rx="3" fill="#059669" transform="rotate(12 153 87)" />
      <text x="153" y="89" textAnchor="middle" fontFamily="sans-serif" fontSize="7" fontWeight="bold" fill="white" transform="rotate(12 153 87)">MAD</text>
      {/* Confetti dots */}
      <circle cx="50" cy="55" r="4" fill="#FCD34D" />
      <circle cx="155" cy="58" r="3" fill="#F87171" />
      <circle cx="168" cy="115" r="4" fill="#34D399" />
      <circle cx="35" cy="120" r="3" fill="#60A5FA" />
    </svg>
  )
}

function IlluPublish() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="90" r="72" fill="#EFF6FF" />
      {/* Package box */}
      <rect x="62" y="80" width="76" height="62" rx="8" fill="#1D4ED8" />
      <path d="M62 94 L100 106 L138 94" stroke="#BFDBFE" strokeWidth="2" />
      <path d="M100 106 L100 142" stroke="#BFDBFE" strokeWidth="2" />
      {/* Upload arrow */}
      <circle cx="100" cy="52" r="20" fill="#DBEAFE" />
      <path d="M100 62 L100 42 M92 50 L100 42 L108 50" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {/* Box top lid lines */}
      <path d="M62 88 L100 100 L138 88 L100 76 Z" fill="#2563EB" />
    </svg>
  )
}

function IlluChoose() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="90" r="72" fill="#F0FDF4" />
      {/* Three transporter cards */}
      <rect x="30" y="68" width="56" height="70" rx="8" fill="white" stroke="#D1FAE5" strokeWidth="2" />
      <rect x="72" y="55" width="56" height="70" rx="8" fill="#059669" />
      <rect x="114" y="68" width="56" height="70" rx="8" fill="white" stroke="#D1FAE5" strokeWidth="2" />
      {/* Avatar circles */}
      <circle cx="58" cy="88" r="14" fill="#D1FAE5" />
      <circle cx="100" cy="76" r="16" fill="white" opacity="0.3" />
      <circle cx="142" cy="88" r="14" fill="#D1FAE5" />
      {/* Stars on middle card */}
      <path d="M100 90 L101.6 95.1 L106.9 95.1 L102.7 98.1 L104.2 103.1 L100 100.2 L95.8 103.1 L97.3 98.1 L93.1 95.1 L98.4 95.1 Z" fill="#FCD34D" />
      {/* Checkmark on middle */}
      <circle cx="116" cy="62" r="9" fill="#34D399" />
      <path d="M111 62 L115 66 L121 58" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IlluTrack() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="90" r="72" fill="#EFF6FF" />
      {/* Map background */}
      <rect x="42" y="44" width="116" height="100" rx="10" fill="white" stroke="#DBEAFE" strokeWidth="2" />
      {/* Route line */}
      <path d="M62 120 Q80 80 140 65" stroke="#1D4ED8" strokeWidth="3" strokeLinecap="round" strokeDasharray="5 4" />
      {/* Start pin */}
      <circle cx="62" cy="120" r="7" fill="#059669" />
      <circle cx="62" cy="120" r="4" fill="white" />
      {/* End pin */}
      <path d="M140 55 C140 48 135 44 140 40 C145 44 140 48 140 55 Z" fill="#DC2626" />
      <circle cx="140" cy="46" r="5" fill="#DC2626" />
      <circle cx="140" cy="46" r="2.5" fill="white" />
      {/* Mini truck on route */}
      <rect x="96" y="86" width="16" height="10" rx="2" fill="#1D4ED8" />
      <circle cx="99" cy="97" r="2.5" fill="#1E3A5F" />
      <circle cx="109" cy="97" r="2.5" fill="#1E3A5F" />
    </svg>
  )
}

function IlluConfirmDelivery() {
  return (
    <svg viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="100" cy="90" r="72" fill="#ECFDF5" />
      {/* Handshake icon */}
      <path d="M52 100 C52 100 68 85 85 88 L100 92 L115 88 C132 85 148 100 148 100" stroke="#059669" strokeWidth="4" strokeLinecap="round" />
      {/* Hands */}
      <ellipse cx="55" cy="104" rx="18" ry="11" fill="#059669" opacity="0.2" />
      <ellipse cx="145" cy="104" rx="18" ry="11" fill="#1D4ED8" opacity="0.2" />
      <path d="M38 104 Q45 95 55 95 Q65 95 75 102 L100 108 L125 102 Q135 95 145 95 Q155 95 162 104" stroke="#059669" strokeWidth="3" strokeLinecap="round" fill="none" />
      {/* Big checkmark */}
      <circle cx="100" cy="65" r="22" fill="#059669" opacity="0.15" />
      <circle cx="100" cy="65" r="16" fill="#059669" />
      <path d="M90 65 L97 72 L112 56" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Stars */}
      <circle cx="44" cy="62" r="4" fill="#FCD34D" />
      <circle cx="158" cy="60" r="4" fill="#FCD34D" />
      <circle cx="165" cy="86" r="3" fill="#34D399" />
      <circle cx="36" cy="86" r="3" fill="#34D399" />
    </svg>
  )
}

// ── Slide Data ────────────────────────────────────────────────────────────────

interface Slide {
  illustration: React.ReactNode
  title: string
  body: string
  speech: string
  accentColor: string
}

const TRANSPORTEUR_SLIDES: Slide[] = [
  {
    illustration: <IlluWelcome />,
    title: 'مرحبا، هنا دوتراك',
    body: 'التطبيق ديالك باش تلقا الشحنات وتخدم بسهولة',
    speech: 'مرحبا، هنا دوتراك. التطبيق ديالك باش تلقا الشحنات وتخدم بسهولة.',
    accentColor: '#1D4ED8',
  },
  {
    illustration: <IlluSeeCharges />,
    title: 'شوف الشحنات ديالك',
    body: 'في الصفحة الرئيسية كاينين عندك جميع الشحنات المتاحة. كليك عليها باش تشوف التفاصيل',
    speech: 'في الصفحة الرئيسية، شوف جميع الشحنات المتاحة. كليك عليها باش تشوف التفاصيل.',
    accentColor: '#1D4ED8',
  },
  {
    illustration: <IlluAccept />,
    title: 'قبل على الشحنة',
    body: 'لقيتي شحنة تعجبك؟ دوز على "قبل" وغادي يوصلك رد من المرسل',
    speech: 'لقيتي شحنة تعجبك؟ دوز على قبل وغادي يوصلك رد من المرسل.',
    accentColor: '#059669',
  },
  {
    illustration: <IlluPrice />,
    title: 'حدد الثمن ديالك',
    body: 'كتب غير الثمن ديالك فالخانة المخصصة. ما تكتبش حوايج خرى، الثمن غير',
    speech: 'كتب غير الثمن ديالك فالخانة المخصصة. ما تكتبش حوايج خرى، الثمن غير.',
    accentColor: '#D97706',
  },
  {
    illustration: <IlluComplete />,
    title: 'من بعد ما وصلت',
    body: 'كاملتي التوصيل؟ علّم على "مكمول" وغادي تجي العمولة ديالك',
    speech: 'كاملتي التوصيل؟ علّم على مكمول وغادي تجي العمولة ديالك. برابا ومرحبا بيك.',
    accentColor: '#7C3AED',
  },
]

const EXPEDITEUR_SLIDES: Slide[] = [
  {
    illustration: <IlluWelcome />,
    title: 'مرحبا، هنا دوتراك',
    body: 'التطبيق ديالك باش تبعت الشحنات ديالك بسهولة ومن غير مشاكل',
    speech: 'مرحبا، هنا دوتراك. التطبيق ديالك باش تبعت الشحنات ديالك بسهولة ومن غير مشاكل.',
    accentColor: '#1D4ED8',
  },
  {
    illustration: <IlluPublish />,
    title: 'نشر الشحنة ديالك',
    body: 'دوز على "شحنة جديدة"، عبّي المعلومات وانشر. الناقلين غادي يشوفوها على طول',
    speech: 'دوز على شحنة جديدة، عبّي المعلومات وانشر. الناقلين غادي يشوفوها على طول.',
    accentColor: '#1D4ED8',
  },
  {
    illustration: <IlluChoose />,
    title: 'خير الناقل ديالك',
    body: 'جاوك عروض من الناقلين؟ شوف التقييمات وخير اللي يعجبك',
    speech: 'جاوك عروض من الناقلين؟ شوف التقييمات وخير اللي يعجبك.',
    accentColor: '#059669',
  },
  {
    illustration: <IlluTrack />,
    title: 'تابع الرحلة',
    body: 'من بعد ما قبلتي، تقدر تتواصل مع الناقل من خلال الشات مباشرة',
    speech: 'من بعد ما قبلتي، تقدر تتواصل مع الناقل من خلال الشات مباشرة.',
    accentColor: '#1D4ED8',
  },
  {
    illustration: <IlluConfirmDelivery />,
    title: 'أكد الوصول',
    body: 'وصلت الشحنة ديالك؟ دوز على "تأكيد الوصول" وعطي تقييم للناقل',
    speech: 'وصلت الشحنة ديالك؟ دوز على تأكيد الوصول وعطي تقييم للناقل. شكراً على ثقتك.',
    accentColor: '#059669',
  },
]

// ── Audio Hook ────────────────────────────────────────────────────────────────

function speakDarija(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ar-MA'
  utterance.rate = 0.88
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  role: 'transporteur' | 'expéditeur'
  /** If true the tutorial is forced open (replay from settings) */
  forceOpen?: boolean
  onClose?: () => void
}

const STORAGE_KEY = 'onboarding_seen'

export default function OnboardingTutorial({ role, forceOpen = false, onClose }: Props) {
  // Don't show if already seen (unless forced via replay button)
  const alreadySeen = !forceOpen && typeof window !== 'undefined' && !!localStorage.getItem(STORAGE_KEY)
  const [visible, setVisible] = useState(!alreadySeen)
  const [current, setCurrent] = useState(0)
  const [exiting, setExiting] = useState(false)

  const slides = role === 'transporteur' ? TRANSPORTEUR_SLIDES : EXPEDITEUR_SLIDES
  const total = slides.length
  const slide = slides[current]
  const isLast = current === total - 1

  // Auto-play speech on each slide
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(() => speakDarija(slide.speech), 400)
    return () => clearTimeout(timer)
  }, [current, visible, slide.speech])

  const close = useCallback(async () => {
    window.speechSynthesis?.cancel()
    setExiting(true)
    if (!forceOpen) {
      // Set immediately so it never shows again even if DB call is slow/fails
      localStorage.setItem(STORAGE_KEY, '1')
    }
    setTimeout(() => {
      setVisible(false)
      onClose?.()
    }, 300)
    if (!forceOpen) {
      await markOnboardingComplete()
    }
  }, [forceOpen, onClose])

  const next = useCallback(async () => {
    if (isLast) {
      await close()
    } else {
      setCurrent(c => c + 1)
    }
  }, [isLast, close])

  if (!visible) return null

  const progress = ((current + 1) / total) * 100

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col bg-white transition-opacity duration-300 ${exiting ? 'opacity-0' : 'opacity-100'}`}
      dir="rtl"
    >
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-gray-100 shrink-0">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: slide.accentColor }}
        />
      </div>

      {/* Top row: dots + skip */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === current ? 20 : 6,
                backgroundColor: i <= current ? slide.accentColor : '#E5E7EB',
              }}
            />
          ))}
        </div>
        <button
          onClick={close}
          className="text-xs text-gray-400 font-medium px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
        >
          تجاوز
        </button>
      </div>

      {/* Illustration */}
      <div className="flex-1 flex items-center justify-center px-8">
        <div className="w-full max-w-xs" style={{ maxHeight: 220 }}>
          {slide.illustration}
        </div>
      </div>

      {/* Text content */}
      <div className="px-6 pb-4 shrink-0 text-center space-y-3">
        <h2 className="text-2xl font-extrabold text-gray-900 leading-tight">
          {slide.title}
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          {slide.body}
        </p>
      </div>

      {/* Audio replay button */}
      <div className="flex justify-center pb-2 shrink-0">
        <button
          onClick={() => speakDarija(slide.speech)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600 transition-colors cursor-pointer"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
          </svg>
          سمع مرة أخرى
        </button>
      </div>

      {/* Navigation */}
      <div className="px-5 pb-8 pt-2 shrink-0 space-y-2">
        <button
          onClick={next}
          className="w-full min-h-[52px] rounded-2xl text-white font-bold text-base transition-all active:scale-[0.98] cursor-pointer"
          style={{ backgroundColor: slide.accentColor }}
        >
          {isLast ? 'ابدأ الاستخدام ←' : 'التالي ←'}
        </button>
        {/* Slide counter */}
        <p className="text-center text-xs text-gray-400">
          {current + 1} / {total}
        </p>
      </div>
    </div>
  )
}
