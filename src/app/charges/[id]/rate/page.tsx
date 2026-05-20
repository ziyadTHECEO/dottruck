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
    <div className="min-h-screen bg-surface flex flex-col">
      <TopHeader title="Évaluation" backHref="/dashboard" />

      <main className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">⭐</span>
          </div>
          <h2 className="text-xl font-bold text-nardo">Évaluez {nom ? decodeURIComponent(nom) : 'le transporteur'}</h2>
          <p className="text-gray-500 text-sm">Votre avis aide la communauté Dottruck</p>
        </div>

        <form action={submitRating} className="w-full space-y-6">
          <input type="hidden" name="charge_id" value={chargeId} />
          <input type="hidden" name="to_user_id" value={userId} />

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600 text-center">Note</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star} className="cursor-pointer">
                  <input type="radio" name="note" value={star} required className="sr-only" />
                  <span className="text-4xl text-gray-300 hover:text-yellow-400 transition-colors">★</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-600">
              Commentaire <span className="text-gray-400">— optionnel</span>
            </label>
            <textarea name="commentaire" rows={3} placeholder="Ex: Ponctuel, professionnel..."
              className="w-full border border-border rounded-xl px-4 py-3 text-base text-nardo placeholder-gray-400 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all bg-white resize-none" />
          </div>

          <button type="submit"
            className="w-full min-h-[52px] bg-accent hover:bg-accent-hover text-white font-bold rounded-xl transition-all duration-200 text-base">
            Envoyer l&apos;évaluation
          </button>
        </form>
      </main>
    </div>
  )
}
