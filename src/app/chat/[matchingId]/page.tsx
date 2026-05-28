import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ChatRoom } from '@/components/ChatRoom'
import { TopHeader } from '@/components/ui/TopHeader'

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
      <TopHeader title="Negociation" backHref="/messages" />

      <ChatRoom
        matchingId={matchingId}
        currentUserId={user.id}
        prixTotal={charge.prix_total_mad}
      />
    </div>
  )
}
