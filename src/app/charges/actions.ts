'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function publishCharge(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const type_requis = formData.get('type_requis') as string
  const ville_depart = formData.get('ville_depart') as string
  const ville_arrivee = formData.get('ville_arrivee') as string
  const description = formData.get('description') as string
  const poids_kg = formData.get('poids_kg') ? parseInt(formData.get('poids_kg') as string) : null
  const is_conteneur = formData.get('is_conteneur') === 'true'
  const largeur_cm = is_conteneur && formData.get('largeur_cm') ? parseInt(formData.get('largeur_cm') as string) : null
  const hauteur_cm = is_conteneur && formData.get('hauteur_cm') ? parseInt(formData.get('hauteur_cm') as string) : null
  const prix_total_mad = parseInt(formData.get('prix_total_mad') as string)
  const audio_url = formData.get('audio_url') as string | null

  const { error } = await supabase.from('charges').insert({
    expediteur_id: user.id,
    type_requis,
    ville_depart,
    ville_arrivee,
    description: description || null,
    poids_kg,
    is_conteneur,
    largeur_cm,
    hauteur_cm,
    prix_total_mad,
    audio_url: audio_url || null,
  })

  if (error) {
    return redirect(`/charges/new?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/dashboard')
}

export async function submitRating(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const to_user_id = formData.get('to_user_id') as string
  const charge_id = formData.get('charge_id') as string
  const note = parseInt(formData.get('note') as string)
  const commentaire = formData.get('commentaire') as string

  await supabase.from('ratings').insert({
    from_user_id: user.id,
    to_user_id,
    charge_id,
    note,
    commentaire: commentaire || null,
  })

  // Recalculate average score
  const { data: allRatings } = await supabase
    .from('ratings')
    .select('note')
    .eq('to_user_id', to_user_id)

  if (allRatings && allRatings.length > 0) {
    const avg = Math.round(allRatings.reduce((sum, r) => sum + r.note, 0) / allRatings.length)
    await supabase
      .from('transporteur_profiles')
      .update({ score: avg })
      .eq('user_id', to_user_id)
  }

  return redirect('/dashboard')
}
