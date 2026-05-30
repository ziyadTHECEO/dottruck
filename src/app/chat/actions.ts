'use server'

import { createClient } from '@/lib/supabase/server'
import { filterMessage } from '@/lib/filters/content-filter'

export type SendMessageResult = {
  success: boolean
  error?: string
  errorType?: 'blocked' | 'auth' | 'db'
  message?: {
    id: string
    matching_id: string
    sender_id: string
    contenu: string
    audio_url: string | null
    lu: boolean
    created_at: string
  }
}

export async function sendMessage(
  matchingId: string,
  content: string,
  audioUrl?: string
): Promise<SendMessageResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated', errorType: 'auth' }

  // Block messages until price is agreed
  const { data: matching } = await supabase
    .from('matchings')
    .select('statut')
    .eq('id', matchingId)
    .single()

  if (!matching || matching.statut !== 'accepté') {
    return {
      success: false,
      error: 'خاص تتافقو على الثمن قبل ما تهضرو. استعمل زر "اقترح الثمن".',
      errorType: 'blocked',
    }
  }

  // Filter text content (skip for voice-only messages)
  if (content && content !== '🎤') {
    const filterResult = filterMessage(content)
    if (filterResult.blocked) {
      const errorMessages: Record<string, string> = {
        phone: 'ممنوع مشاركة أرقام الهاتف. تواصلو عبر التطبيق.',
        email: 'ممنوع مشاركة الإيميل.',
        social: 'ممنوع مشاركة حسابات التواصل الاجتماعي.',
        amount: 'استعمل زر "اقترح الثمن" للتفاوض على السعر.',
      }
      return {
        success: false,
        error: errorMessages[filterResult.reason!] ?? 'رسالة ممنوعة',
        errorType: 'blocked',
      }
    }
  }

  const { data: inserted, error } = await supabase
    .from('messages')
    .insert({
      matching_id: matchingId,
      sender_id: user.id,
      contenu: content || null,
      audio_url: audioUrl ?? null,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message, errorType: 'db' }

  return { success: true, message: inserted }
}

export type ProposalResult = {
  success: boolean
  error?: string
  proposal?: {
    id: string
    matching_id: string
    sender_id: string
    amount_mad: number
    status: string
    created_at: string
  }
}

export async function sendProposal(
  matchingId: string,
  amountMad: number
): Promise<ProposalResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }
  if (!amountMad || amountMad <= 0) return { success: false, error: 'المبلغ غير صحيح' }

  // Mark any previous pending proposals as 'counter'
  await supabase
    .from('price_proposals')
    .update({ status: 'counter' })
    .eq('matching_id', matchingId)
    .eq('status', 'pending')

  const { data: proposal, error } = await supabase
    .from('price_proposals')
    .insert({
      matching_id: matchingId,
      sender_id: user.id,
      amount_mad: amountMad,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  return { success: true, proposal }
}

export async function respondToProposal(
  proposalId: string,
  response: 'accepted' | 'refused'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  // Get the proposal
  const { data: proposal } = await supabase
    .from('price_proposals')
    .select('*, matchings(id, charge_id)')
    .eq('id', proposalId)
    .single()

  if (!proposal) return { success: false, error: 'Proposal not found' }
  if (proposal.sender_id === user.id) return { success: false, error: 'Cannot respond to own proposal' }
  if (proposal.status !== 'pending') return { success: false, error: 'Proposal already responded' }

  // Update proposal status
  await supabase
    .from('price_proposals')
    .update({ status: response })
    .eq('id', proposalId)

  // If accepted, update matching statut
  if (response === 'accepted') {
    await supabase
      .from('matchings')
      .update({ statut: 'accepté' })
      .eq('id', proposal.matching_id)
  }

  return { success: true }
}

export async function revealPhone(
  matchingId: string
): Promise<{ success: boolean; phone?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify matching is accepted
  const { data: matching } = await supabase
    .from('matchings')
    .select('*, charges(expediteur_id)')
    .eq('id', matchingId)
    .single()

  if (!matching) return { success: false, error: 'Matching not found' }
  if (matching.statut !== 'accepté') return { success: false, error: 'الثمن ما زال ما تّافقوش عليه' }

  // Determine other party
  const charge = matching.charges as { expediteur_id: string }
  const transporteurId = matching.transporteur_complet_id ?? matching.transporteur_camion_id ?? matching.transporteur_remorque_id

  let otherUserId: string
  if (user.id === charge.expediteur_id) {
    otherUserId = transporteurId
  } else {
    otherUserId = charge.expediteur_id
  }

  // Fetch phone
  const { data: otherUser } = await supabase
    .from('users')
    .select('phone')
    .eq('id', otherUserId)
    .single()

  if (!otherUser?.phone) return { success: false, error: 'رقم غير متوفر' }

  return { success: true, phone: otherUser.phone }
}
