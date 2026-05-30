'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function adminSignIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(`/admin/login?error=${encodeURIComponent(error.message)}`)
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/admin/login?error=Auth%20failed')

  const { data: profile } = await supabase
    .from('users')
    .select('role, banned, ban_reason')
    .eq('id', user.id)
    .single()

  if (profile?.banned) {
    await supabase.auth.signOut()
    return redirect(`/admin/login?error=${encodeURIComponent('Compte suspendu: ' + (profile.ban_reason ?? ''))}`)
  }

  if (profile?.role !== 'admin') {
    await supabase.auth.signOut()
    return redirect('/admin/login?error=Acc%C3%A8s%20refus%C3%A9')
  }

  return redirect('/admin/stats')
}

export async function banUser(
  userId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (admin?.role !== 'admin') return { success: false, error: 'Not authorized' }

  const { error } = await supabase
    .from('users')
    .update({ banned: true, ban_reason: reason })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }

  await supabase.from('notifications').insert({
    user_id: userId,
    type: 'account_banned',
    title: 'حساب موقوف',
    body: `تم إيقاف حسابك. السبب: ${reason}`,
  })

  return { success: true }
}

export async function unbanUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (admin?.role !== 'admin') return { success: false, error: 'Not authorized' }

  const { error } = await supabase
    .from('users')
    .update({ banned: false, ban_reason: null })
    .eq('id', userId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function markAsPaid(
  matchingId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { data: admin } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  if (admin?.role !== 'admin') return { success: false, error: 'Not authorized' }

  const { error } = await supabase
    .from('matchings')
    .update({ paid: true })
    .eq('id', matchingId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
