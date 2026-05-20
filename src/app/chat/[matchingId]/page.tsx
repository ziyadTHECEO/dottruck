import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChatRoom } from '@/components/ChatRoom'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ matchingId: string }>
}) {
  const { matchingId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: matching } = await supabase
    .from('matchings')
    .select('*, charges(*)')
    .eq('id', matchingId)
    .single()

  if (!matching) return notFound()

  const charge = matching.charges as {
    id: string
    ville_depart: string
    ville_arrivee: string
    prix_total_mad: number
  }

  return (
    <div className="h-screen flex flex-col">
      <header className="h-16 bg-white border-b px-4 flex items-center gap-3 shrink-0">
        <Link href="/dashboard" className="text-gray-500 hover:text-gray-800">←</Link>
        <div>
          <p className="font-semibold text-gray-900">
            {charge.ville_depart} → {charge.ville_arrivee}
          </p>
          <p className="text-xs text-gray-500">Négociation en cours</p>
        </div>
      </header>

      <ChatRoom
        matchingId={matchingId}
        currentUserId={user.id}
        prixTotal={charge.prix_total_mad}
      />
    </div>
  )
}
