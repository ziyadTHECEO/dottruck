import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { submitRating } from '../../actions'
import { TopHeader } from '@/components/ui/TopHeader'

export default async function RatePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ userId?: string; nom?: string }>
}) {
  const { id: chargeId } = await params
  const { userId, nom } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')
  if (!userId) return notFound()

  return (
    <div className="min-h-screen bg-surface flex flex-col" dir="rtl">
      <TopHeader title="التقييم" backHref="/dashboard" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-warning/10 flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-warning">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-nardo">قيم {nom ? decodeURIComponent(nom) : 'الناقل'}</h2>
          <p className="text-muted text-sm">رأيك كيساعد مجتمع Dottruck</p>
        </div>

        <form action={submitRating} className="w-full space-y-6">
          <input type="hidden" name="charge_id" value={chargeId} />
          <input type="hidden" name="to_user_id" value={userId} />

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted text-center">النقطة ديالك</p>
            <div className="flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star} className="cursor-pointer group">
                  <input type="radio" name="note" value={star} required className="sr-only peer" />
                  <svg width="36" height="36" viewBox="0 0 24 24" className="text-border peer-checked:text-warning group-hover:text-warning/60 transition-colors" fill="currentColor" stroke="currentColor" strokeWidth="1">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-muted">
              تعليق <span className="text-muted/60">— اختياري</span>
            </label>
            <textarea name="commentaire" rows={3} placeholder="مثال: في الوقت، محترف..."
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-muted/50 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white resize-none" />
          </div>

          <button type="submit"
            className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-semibold rounded-xl transition-colors text-base cursor-pointer">
            سيفط التقييم
          </button>
        </form>
      </main>
    </div>
  )
}
