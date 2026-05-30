import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { LanguageProvider } from '@/lib/i18n/context'
import { type Language } from '@/lib/i18n/constants'

const inter = Inter({ subsets: ['latin', 'latin-ext'] })

export const metadata: Metadata = {
  title: 'Dottruck — Transport intelligent au Maroc',
  description: 'Trouve ta charge en 2 clics. Plateforme de fret pour transporteurs marocains.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const langCookie = cookieStore.get('lang')?.value
  const initialLang: Language = (langCookie === 'ar' || langCookie === 'fr') ? langCookie : 'ar'

  return (
    <html lang={initialLang} dir={initialLang === 'ar' ? 'rtl' : 'ltr'}>
      <body className={inter.className}>
        <LanguageProvider initialLang={initialLang}>{children}</LanguageProvider>
      </body>
    </html>
  )
}
