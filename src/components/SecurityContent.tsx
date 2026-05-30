'use client'

import { useState } from 'react'
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/auth/actions'

export default function SecurityContent({ userEmail }: { userEmail: string }) {
  const [activeForm, setActiveForm] = useState<'password' | 'phone' | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword.trim() || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'كلمة السر خاصها تكون 6 حروف على الأقل' })
      return
    }
    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setMessage({ type: 'error', text: 'ما قدرناش نبدلو كلمة السر. حاول مرة أخرى.' })
    } else {
      setMessage({ type: 'success', text: 'تبدلات كلمة السر بنجاح!' })
      setNewPassword('')
      setCurrentPassword('')
      setActiveForm(null)
    }
    setLoading(false)
  }

  const handleChangePhone = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPhone.trim()) {
      setMessage({ type: 'error', text: 'دخل رقم التيليفون الجديد' })
      return
    }
    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({
      data: { phone: newPhone }
    })

    // Also update the users table
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users').update({ phone: newPhone }).eq('id', user.id)
      }
    }

    if (error) {
      setMessage({ type: 'error', text: 'ما قدرناش نبدلو الرقم. حاول مرة أخرى.' })
    } else {
      setMessage({ type: 'success', text: 'تبدل الرقم بنجاح!' })
      setNewPhone('')
      setActiveForm(null)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col" dir="rtl">
      <TopHeader title="الأمان" backHref="/profile/settings" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        {/* Status message */}
        {message && (
          <div className={`mx-4 mt-4 p-3 rounded-xl text-sm font-medium ${
            message.type === 'success' ? 'bg-green-50 text-success border border-success/20' : 'bg-red-50 text-error border border-error/20'
          }`}>
            {message.text}
          </div>
        )}

        {/* Change Password */}
        <div className="bg-white mt-2 border-b border-border">
          <button
            onClick={() => { setActiveForm(activeForm === 'password' ? null : 'password'); setMessage(null) }}
            className="w-full flex items-center justify-between px-4 py-4 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-muted">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              </div>
              <span className="text-sm text-nardo font-medium">بدل كلمة السر</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-muted/50 transition-transform ${activeForm === 'password' ? 'rotate-90' : ''}`}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {activeForm === 'password' && (
            <form onSubmit={handleChangePassword} className="px-4 pb-4 space-y-3">
              <input
                type="password"
                placeholder="كلمة السر الجديدة"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full h-12 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                minLength={6}
              />
              <button
                type="submit"
                disabled={loading || !newPassword.trim()}
                className="w-full h-12 bg-accent text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {loading ? '...' : 'تأكيد'}
              </button>
            </form>
          )}
        </div>

        {/* Change Phone */}
        <div className="bg-white border-b border-border">
          <button
            onClick={() => { setActiveForm(activeForm === 'phone' ? null : 'phone'); setMessage(null) }}
            className="w-full flex items-center justify-between px-4 py-4 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center text-muted">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <span className="text-sm text-nardo font-medium">بدل رقم التيليفون</span>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`text-muted/50 transition-transform ${activeForm === 'phone' ? 'rotate-90' : ''}`}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {activeForm === 'phone' && (
            <form onSubmit={handleChangePhone} className="px-4 pb-4 space-y-3">
              <input
                type="tel"
                placeholder="الرقم الجديد (مثلا 0612345678)"
                value={newPhone}
                onChange={e => setNewPhone(e.target.value)}
                className="w-full h-12 border border-border rounded-xl px-4 text-sm focus:outline-none focus:border-accent"
                dir="ltr"
              />
              <button
                type="submit"
                disabled={loading || !newPhone.trim()}
                className="w-full h-12 bg-accent text-white font-semibold rounded-xl disabled:opacity-50"
              >
                {loading ? '...' : 'تأكيد'}
              </button>
            </form>
          )}
        </div>

        {/* Logout all devices */}
        <div className="bg-white border-b border-border">
          <div className="px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center text-error">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <span className="text-sm text-nardo font-medium">خرج من جميع الأجهزة</span>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="w-full h-12 bg-red-50 border border-error/20 text-error font-semibold rounded-xl text-sm"
              >
                تسجيل الخروج من كلشي
              </button>
            </form>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
