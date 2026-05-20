import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { submitRating } from '../../actions'

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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Évaluer le transporteur</h1>
            {nom && <p className="text-gray-500 mt-1">{decodeURIComponent(nom)}</p>}
          </div>
        </div>

        <form action={submitRating} className="space-y-6">
          <input type="hidden" name="charge_id" value={chargeId} />
          <input type="hidden" name="to_user_id" value={userId} />

          <div>
            <p className="font-medium text-gray-700 mb-3">Note globale</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <label key={n} className="flex-1">
                  <input type="radio" name="note" value={n} required className="sr-only peer" />
                  <span className="flex flex-col items-center justify-center border-2 border-gray-200 rounded-xl p-3 cursor-pointer peer-checked:border-orange-500 peer-checked:bg-orange-50 hover:border-orange-300 transition">
                    <span className="text-xl">{'★'.repeat(n)}</span>
                    <span className="text-xs text-gray-500 mt-1">{n}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Commentaire <span className="text-gray-400 font-normal">(optionnel)</span>
            </label>
            <textarea
              name="commentaire"
              rows={3}
              placeholder="À l'heure ? Professionnel ? Recommandé ?"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition"
          >
            Envoyer l&apos;évaluation
          </button>
        </form>
      </div>
    </main>
  )
}
