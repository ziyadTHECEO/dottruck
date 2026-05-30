'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { resetPassword } from '../actions'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const success = searchParams.get('success')

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-4" dir="rtl">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-nardo">نسيت كلمة السر؟</h1>
          <p className="text-sm text-muted mt-2">دخل الإيميل ديالك وغنرسلو ليك رابط لإعادة التعيين</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-error rounded-xl p-3 text-sm mb-4 text-center">
            {error}
          </div>
        )}

        {success ? (
          <div className="bg-green-50 border border-success/20 text-success rounded-xl p-4 text-sm text-center space-y-3">
            <p className="font-semibold">تم الإرسال بنجاح!</p>
            <p className="text-muted text-xs">شوف الإيميل ديالك وكليكي على الرابط باش تبدل كلمة السر</p>
            <Link href="/auth/login" className="inline-block mt-2 text-accent font-semibold text-sm underline">
              ارجع لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <form action={resetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-nardo mb-1.5">الإيميل</label>
              <input
                type="email"
                name="email"
                required
                placeholder="example@email.com"
                className="w-full h-12 px-4 border border-border rounded-xl text-nardo placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-sm cursor-pointer"
            >
              رسل رابط إعادة التعيين
            </button>
          </form>
        )}

        <div className="text-center mt-6">
          <Link href="/auth/login" className="text-sm text-muted hover:text-accent transition-colors">
            ارجع لتسجيل الدخول
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
