'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTranslation } from '@/lib/i18n/context'
import { VoiceRecorder } from '@/components/ui/VoiceRecorder'
import { AudioPlayer } from '@/components/ui/AudioPlayer'
import { PriceProposalCard } from '@/components/PriceProposalCard'
import { PriceInput } from '@/components/PriceInput'
import { AudioButton } from '@/components/ui/AudioButton'
import { sendMessage as sendMessageAction, sendProposal, revealPhone } from '@/app/chat/actions'

interface Message {
  id: string
  contenu: string
  sender_id: string
  created_at: string
  lu: boolean
  audio_url: string | null
}

interface Proposal {
  id: string
  matching_id: string
  sender_id: string
  amount_mad: number
  status: string
  created_at: string
}

interface ChatRoomProps {
  matchingId: string
  currentUserId: string
  prixTotal: number
  transporteurName?: string
  initialProposals: Proposal[]
  matchingStatut: string
}

type TimelineItem =
  | { type: 'message'; data: Message; timestamp: string }
  | { type: 'proposal'; data: Proposal; timestamp: string }

function formatTime(dateStr: string, lang: string): string {
  const locale = lang === 'ar' ? 'ar-MA' : 'fr-FR'
  return new Date(dateStr).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
}

function PhoneRevealBanner({ matchingId }: { matchingId: string }) {
  const { t } = useTranslation()
  const [phone, setPhone] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleReveal = async () => {
    setLoading(true)
    const result = await revealPhone(matchingId)
    if (result.success && result.phone) {
      setPhone(result.phone)
    }
    setLoading(false)
  }

  return (
    <div className="bg-green-50 border-b border-success/20 px-4 py-3 text-center">
      <p className="text-sm font-semibold text-success">{t('chat_deal_confirmed')}</p>
      {phone ? (
        <p className="text-base font-bold text-nardo mt-1" dir="ltr">{phone}</p>
      ) : (
        <button
          onClick={handleReveal}
          disabled={loading}
          className="mt-1 px-4 py-1.5 bg-success text-white text-sm font-semibold rounded-lg cursor-pointer disabled:opacity-50"
        >
          {loading ? '...' : t('chat_phone_revealed')}
        </button>
      )}
    </div>
  )
}

export function ChatRoom({ matchingId, currentUserId, prixTotal, transporteurName, initialProposals, matchingStatut }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [proposals, setProposals] = useState<Proposal[]>(initialProposals)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [counterAmount, setCounterAmount] = useState<number | undefined>(undefined)
  const [dealAccepted, setDealAccepted] = useState(matchingStatut === 'accepté')
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const { t, lang } = useTranslation()

  // Use agreed price if available, otherwise original charge price
  const acceptedProposal = proposals.find(p => p.status === 'accepted')
  const agreedPrice = acceptedProposal ? acceptedProposal.amount_mad : prixTotal
  const commission = Math.round(agreedPrice * 0.04)
  const netAPayer = agreedPrice - commission

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const days = Math.floor(diff / 86400000)

    if (days === 0) return t('chat_today')
    if (days === 1) return t('chat_yesterday')
    const locale = lang === 'ar' ? 'ar-MA' : 'fr-FR'
    return d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  }

  // Fetch messages + proposals
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('matching_id', matchingId)
        .order('created_at', { ascending: true })
      if (data) {
        setMessages(data)
        // Mark messages as read
        const unread = data.filter(m => m.sender_id !== currentUserId && !m.lu)
        if (unread.length > 0) {
          await supabase
            .from('messages')
            .update({ lu: true })
            .eq('matching_id', matchingId)
            .neq('sender_id', currentUserId)
            .eq('lu', false)
        }
      }
    }

    const fetchProposals = async () => {
      const { data } = await supabase
        .from('price_proposals')
        .select('*')
        .eq('matching_id', matchingId)
        .order('created_at', { ascending: true })
      if (data) {
        setProposals(data)
        // Check if any proposal was accepted
        if (data.some(p => p.status === 'accepted')) {
          setDealAccepted(true)
        }
      }
    }

    fetchMessages()
    fetchProposals()

    const channel = supabase
      .channel(`chat:${matchingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `matching_id=eq.${matchingId}`,
        },
        (payload) => {
          const incoming = payload.new as Message
          setMessages(prev =>
            prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming]
          )
          if (incoming.sender_id !== currentUserId) {
            supabase
              .from('messages')
              .update({ lu: true })
              .eq('id', incoming.id)
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'price_proposals',
          filter: `matching_id=eq.${matchingId}`,
        },
        () => {
          // Refetch proposals on any change
          fetchProposals()
        }
      )
      .subscribe()

    const poll = setInterval(() => {
      fetchMessages()
      fetchProposals()
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [matchingId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, proposals])

  const handleSendMessage = async () => {
    const text = newMessage.trim()
    if (!text || sending) return
    setSending(true)
    setSendError(null)
    setNewMessage('')

    const result = await sendMessageAction(matchingId, text)

    if (!result.success) {
      setSendError(result.error ?? 'خطأ')
      if (result.errorType !== 'blocked') {
        setNewMessage(text) // restore text only if not a content violation
      }
    } else if (result.message) {
      setMessages(prev => [...prev, result.message!])
    }
    setSending(false)
  }

  const sendVoiceMessage = async (blob: Blob) => {
    setSending(true)
    setSendError(null)
    const filename = `${matchingId}/${Date.now()}.webm`
    const { error: uploadError } = await supabase.storage
      .from('voice-messages')
      .upload(filename, blob, { contentType: 'audio/webm' })

    if (uploadError) {
      setSendError(uploadError.message)
      setSending(false)
      return
    }

    const publicUrl = supabase.storage
      .from('voice-messages')
      .getPublicUrl(filename).data.publicUrl

    const result = await sendMessageAction(matchingId, '🎤', publicUrl)
    if (!result.success) {
      setSendError(result.error ?? 'خطأ')
    } else if (result.message) {
      setMessages(prev => [...prev, result.message!])
    }
    setSending(false)
  }

  const handleSendProposal = async (amount: number) => {
    const result = await sendProposal(matchingId, amount)
    if (result.success && result.proposal) {
      setProposals(prev => [...prev, result.proposal!])
    }
    setCounterAmount(undefined)
  }

  const handleCounterPropose = (amount: number) => {
    setCounterAmount(amount)
  }

  const handleProposalStatusChange = async () => {
    // Refetch proposals to get updated statuses
    const { data } = await supabase
      .from('price_proposals')
      .select('*')
      .eq('matching_id', matchingId)
      .order('created_at', { ascending: true })
    if (data) {
      setProposals(data)
      if (data.some(p => p.status === 'accepted')) {
        setDealAccepted(true)
      }
    }
  }

  // Build timeline
  const timeline: TimelineItem[] = [
    ...messages.map(m => ({ type: 'message' as const, data: m, timestamp: m.created_at })),
    ...proposals.map(p => ({ type: 'proposal' as const, data: p, timestamp: p.created_at })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  let lastDate = ''

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Deal confirmed banner */}
      {dealAccepted && <PhoneRevealBanner matchingId={matchingId} />}

      {/* Price summary */}
      <div className="bg-accent/5 border-b border-accent/20 px-4 py-3">
        <p className="text-sm font-semibold text-nardo">{t('chat_payment_split')}</p>
        <div className="flex gap-4 mt-1 text-sm text-muted flex-wrap">
          <span>{t('chat_total')} : <strong className="text-nardo">{agreedPrice.toLocaleString()} MAD</strong></span>
          <span>{t('chat_commission')} : <strong className="text-nardo">{commission.toLocaleString()} MAD</strong></span>
          <span>{t('chat_net')} : <strong className="text-nardo">{netAPayer.toLocaleString()} MAD</strong></span>
        </div>
      </div>

      {/* Timeline (messages + proposals) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface">
        {timeline.length === 0 && (
          <p className="text-center text-muted text-sm mt-8">
            {t('chat_no_messages')}
          </p>
        )}
        {timeline.map(item => {
          const itemDate = formatDate(item.timestamp)
          const showDate = itemDate !== lastDate
          lastDate = itemDate

          if (item.type === 'proposal') {
            return (
              <div key={`proposal-${item.data.id}`}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="bg-border/60 text-muted text-xs px-3 py-1 rounded-full">
                      {itemDate}
                    </span>
                  </div>
                )}
                <PriceProposalCard
                  proposal={item.data}
                  currentUserId={currentUserId}
                  onCounterPropose={handleCounterPropose}
                  onStatusChange={handleProposalStatusChange}
                />
              </div>
            )
          }

          const msg = item.data
          const isMine = msg.sender_id === currentUserId

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="bg-border/60 text-muted text-xs px-3 py-1 rounded-full">
                    {itemDate}
                  </span>
                </div>
              )}
              {!isMine && transporteurName && (
                <p className="text-[10px] text-muted px-1 mb-0.5">{transporteurName}</p>
              )}
              <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`px-4 py-2.5 text-sm ${
                      isMine
                        ? 'bg-accent text-white rounded-2xl rounded-tr-sm'
                        : 'bg-white text-nardo rounded-2xl rounded-tl-sm border border-border'
                    }`}
                  >
                    {msg.audio_url ? (
                      <AudioPlayer src={msg.audio_url} isMine={isMine} />
                    ) : (
                      msg.contenu
                    )}
                  </div>
                  <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-muted">{formatTime(msg.created_at, lang)}</span>
                    {isMine && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={msg.lu ? '#1D4ED8' : '#94A3B8'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-sm text-error">
          {sendError}
        </div>
      )}

      {/* Price input — only before deal is accepted */}
      {!dealAccepted && (
        <div className="bg-white border-t border-border px-3 pt-2">
          <PriceInput
            onSubmit={handleSendProposal}
            disabled={sending}
            prefillAmount={counterAmount}
          />
        </div>
      )}

      {/* Text + voice input — only AFTER deal is accepted */}
      {dealAccepted ? (
        <div className="bg-white border-t border-border p-3 flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
            placeholder={t('chat_placeholder')}
            disabled={sending}
            className="border border-border rounded-xl px-4 py-3 flex-1 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-base bg-white text-nardo disabled:opacity-50 transition-colors min-h-[48px]"
          />
          <VoiceRecorder onRecordingComplete={sendVoiceMessage} disabled={sending} />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="bg-accent hover:bg-accent-hover text-white rounded-xl px-4 min-h-[48px] font-semibold transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
          >
            {sending ? (
              <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
                <path d="M12 2a10 10 0 019.95 9" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      ) : (
        <div className="bg-amber-50 border-t border-amber-200 px-4 py-3 flex items-center justify-center gap-2">
          <p className="text-xs text-amber-700 font-medium">{t('chat_agree_first')}</p>
          <AudioButton text={t('chat_agree_first_audio')} size="sm" />
        </div>
      )}
    </div>
  )
}
