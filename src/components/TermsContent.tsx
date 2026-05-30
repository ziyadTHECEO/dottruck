'use client'

import { TopHeader } from '@/components/ui/TopHeader'
import { BottomNav } from '@/components/ui/BottomNav'

const SECTIONS = [
  {
    title: 'الحساب',
    icon: '1',
    items: [
      'خاص بيك نتا وحدك',
      'ممنوع تعطيه لحد آخر',
      'المعلومات ديالك خاصها تكون صحيحة',
    ],
  },
  {
    title: 'الوثائق',
    icon: '2',
    items: [
      'الكارت غريز خاصها تكون ديالك',
      'التصريح بالنقل خاص يكون صالح',
      'أي وثيقة مزورة = حساب محذوف نهائياً',
    ],
  },
  {
    title: 'العمولة',
    icon: '3',
    items: [
      'دوتراك كيأخذ 4% من كل صفقة',
      'الدفع خاصو يتم عبر التطبيق',
      'ممنوع تتفاوض برا التطبيق',
    ],
  },
  {
    title: 'التواصل',
    icon: '4',
    items: [
      'ممنوع تعطي رقم التيليفون في الشات',
      'الثمن خاصو يتكتب في الخانة المخصصة فقط',
      'أي محاولة للتحايل = حساب موقوف',
    ],
  },
  {
    title: 'الرحلات',
    icon: '5',
    items: [
      'خاص تكمل الرحلة اللي قبلتيها',
      'الإلغاء بعد القبول = نقطة سلبية',
      '3 نقاط سلبية = حساب موقوف مؤقتاً',
    ],
  },
  {
    title: 'الاحترام',
    icon: '6',
    items: [
      'ممنوع الكلام الفاشر في الشات',
      'أي مشكل = تواصل مع الدعم مباشرة',
    ],
  },
  {
    title: 'المسؤولية',
    icon: '7',
    items: [
      'دوتراك ما كيتحملش أي ضرر للبضاعة',
      'الاتفاق بين الطرفين هو المرجع',
    ],
  },
]

export default function TermsContent() {
  return (
    <div className="min-h-screen bg-surface flex flex-col" dir="rtl">
      <TopHeader title="شروط الاستخدام" backHref="/profile/settings" />

      <main className="flex-1 pb-24 max-w-lg mx-auto w-full">
        {/* Header */}
        <div className="bg-white px-4 py-6 border-b border-border text-center">
          <h2 className="text-lg font-bold text-nardo">شروط استخدام دوتراك</h2>
          <p className="text-xs text-muted mt-1">خدمة صادقة للناس الجادين</p>
        </div>

        {/* Sections */}
        <div className="mt-2 space-y-2">
          {SECTIONS.map((section) => (
            <div key={section.icon} className="bg-white px-4 py-4 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-accent">{section.icon}</span>
                </div>
                <h3 className="text-sm font-bold text-nardo">{section.title}</h3>
              </div>
              <div className="space-y-2 mr-11">
                {section.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted/40 shrink-0 mt-2" />
                    <p className="text-sm text-muted leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-6 text-center">
          <p className="text-xs text-muted">
            دوتراك — خدمة صادقة للناس الجادين
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  )
}
