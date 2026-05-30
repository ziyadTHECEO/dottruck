'use client'

import { useState } from 'react'
import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'
import OnboardingTutorial from '@/components/OnboardingTutorial'

const FAQ_ITEMS = [
  {
    question: 'كيفاش نلقى شحنة؟',
    answer: 'من الصفحة الرئيسية، غادي تشوف الشحنات المتاحة حسب نوع الشاحنة ديالك. اضغط على أي شحنة باش تشوف التفاصيل وتقبلها.',
  },
  {
    question: 'شحال العمولة ديال دوتراك؟',
    answer: 'دوتراك كيأخذ 4% فقط من كل صفقة. يعني إلا كان الثمن 10,000 درهم، غادي تخلص 400 درهم عمولة.',
  },
  {
    question: 'كيفاش نتحقق من الحساب ديالي؟',
    answer: 'روح ل "معلومات الحساب" وارفع الوثائق: البطاقة الرمادية، إذن النقل، وصورة الشاحنة. الأدمين غادي يراجعها وتوصلك إشعار.',
  },
  {
    question: 'واش نقدر نتواصل مع صاحب الشحنة مباشرة؟',
    answer: 'أه، بعد ما تقبل الشحنة غادي يتفتح ليك الشات. ولكن ممنوع تعطي رقم التيليفون أو تتفاوض برا التطبيق.',
  },
  {
    question: 'شنو ندير إلا كان عندي مشكل؟',
    answer: 'تواصل معانا مباشرة عبر واتساب. كنجاوبو في أقرب وقت ممكن. الزر كاين لتحت.',
  },
]

interface Props {
  role: 'transporteur' | 'expéditeur'
}

export default function HelpContent({ role }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [showTutorial, setShowTutorial] = useState(false)

  return (
    <>
      {showTutorial && (
        <OnboardingTutorial
          role={role}
          forceOpen
          onClose={() => setShowTutorial(false)}
        />
      )}
      <div className="min-h-screen bg-surface flex flex-col" dir="rtl">
        <TopHeader title="المساعدة" backHref="/profile/settings" />

        <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
          {/* FAQ Section */}
          <div className="bg-white mt-2 border-b border-border">
            <p className="px-4 pt-4 pb-2 text-xs font-semibold text-muted uppercase tracking-wider">أسئلة متكررة</p>

            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-t border-border">
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-4 cursor-pointer"
                >
                  <span className="text-sm text-nardo font-medium text-right flex-1">{item.question}</span>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className={`text-muted/50 shrink-0 mr-2 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>
                {openIndex === i && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-muted leading-relaxed bg-surface rounded-xl p-3">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* WhatsApp Support */}
          <div className="px-4 mt-4">
            <a
              href="https://wa.me/212600000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-14 bg-[#25D366] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-3"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              تواصل معانا على واتساب
            </a>
          </div>

          {/* Replay Tutorial */}
          <div className="px-4 mt-3">
            <button
              onClick={() => setShowTutorial(true)}
              className="w-full h-12 bg-white border border-border text-nardo font-medium rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
              </svg>
              شو�� التوتوريال مرة أخرى
            </button>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  )
}
