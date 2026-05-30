'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { signUp } from '../actions'
import { useTranslation } from '@/lib/i18n/context'

const VILLES = ['Safi', 'Casablanca', 'Marrakech', 'Agadir', 'Rabat', 'Tanger', 'Fes', 'Meknes']

export default function SignUpContent() {
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'transporteur'
  const error = searchParams.get('error')
  const isTransporteur = role === 'transporteur'
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 p-6 max-w-md mx-auto w-full space-y-6">
        <div className="flex flex-col items-center pt-4 pb-2">
          <Link href="/" className="mb-4">
            <Image src="/logo-icon.png" alt="Dottruck" width={64} height={64} priority />
          </Link>
          <h2 className="text-xl font-bold text-nardo">{t('auth_role_question')}</h2>
        </div>

        <div className="flex gap-1 bg-surface border border-border rounded-xl p-1">
          <Link
            href="/auth/signup?role=transporteur"
            className={[
              'flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-colors',
              isTransporteur ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-nardo',
            ].join(' ')}
          >
            {t('auth_transporteur')}
          </Link>
          <Link
            href="/auth/signup?role=exp%C3%A9diteur"
            className={[
              'flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-colors',
              !isTransporteur ? 'bg-accent text-white shadow-sm' : 'text-muted hover:text-nardo',
            ].join(' ')}
          >
            {t('auth_expediteur')}
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-error rounded-xl p-4 text-sm">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={signUp} className="space-y-4">
          <input type="hidden" name="role" value={role} />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-nardo">{t('auth_fullname')}</label>
            <input name="nom" type="text" required placeholder="Hamza Ben Ali"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-nardo">{t('auth_city')}</label>
            <select name="ville" required
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors bg-white min-h-[48px]">
              <option value="">{t('auth_choose_city')}</option>
              {VILLES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-nardo">{t('auth_phone')}</label>
            <input name="phone" type="tel" required placeholder="+212 6XX XXX XXX"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-nardo">{t('auth_email')}</label>
            <input name="email" type="email" required placeholder="exemple@email.com"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors bg-white min-h-[48px]" />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-nardo">{t('auth_password')}</label>
            <input name="password" type="password" required minLength={6} placeholder="••••••••"
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors bg-white min-h-[48px]" />
          </div>

          <button type="submit"
            className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-base mt-2 cursor-pointer">
            {t('auth_create_account')}
          </button>
        </form>

        <p className="text-sm text-muted text-center pb-6">
          {t('auth_has_account')}{' '}
          <Link href="/auth/login" className="text-accent font-semibold hover:underline">
            {t('landing_login')}
          </Link>
        </p>
      </main>
    </div>
  )
}
