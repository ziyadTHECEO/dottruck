'use client'

import Link from 'next/link'

interface VerificationBlockerProps {
  blocked: boolean
  resendFields: string[]
  children: React.ReactNode
}

export function VerificationBlocker({ blocked, resendFields, children }: VerificationBlockerProps) {
  if (!blocked) return <>{children}</>

  const resendUrl = `/profile/setup?resend=true&fields=${resendFields.join(',')}`

  return (
    <div className="relative min-h-screen">
      {/* Blocking overlay */}
      <div className="fixed inset-0 z-50 bg-white/95 flex flex-col items-center justify-center p-6" dir="rtl">
        <div className="max-w-sm w-full text-center space-y-6">
          {/* Warning icon */}
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-nardo">يجب إعادة إرسال الوثائق</h1>

          {/* Description */}
          <p className="text-sm text-muted leading-relaxed">
            الأدمين طلب منك تعاود ترسل بعض الوثائق باش تكمل التحقق من حسابك. ما تقدرش تستعمل التطبيق حتى تصيفط الوثائق.
          </p>

          {/* CTA Button */}
          <Link
            href={resendUrl}
            className="block w-full py-3.5 bg-red-600 text-white font-semibold rounded-xl text-center animate-pulse"
          >
            إعادة إرسال الوثائق
          </Link>
        </div>
      </div>

      {/* Content behind (blurred, non-interactive) */}
      <div className="pointer-events-none blur-sm opacity-30">
        {children}
      </div>
    </div>
  )
}
