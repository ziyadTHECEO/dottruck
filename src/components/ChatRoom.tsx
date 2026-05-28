'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  contenu: string
  sender_id: string
  created_at: string
  lu: boolean
}

interface ChatRoomProps {
  matchingId: string
  currentUserId: string
  prixTotal: number
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)

  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

export function ChatRoom({ matchingId, currentUserId, prixTotal }: ChatRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const commission = Math.round(prixTotal * 0.1)
  const netAPayer = prixTotal - commission

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

    fetchMessages()

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
          // Mark as read if not from current user
          if (incoming.sender_id !== currentUserId) {
            supabase
              .from('messages')
              .update({ lu: true })
              .eq('id', incoming.id)
          }
        }
      )
      .subscribe()

    const poll = setInterval(fetchMessages, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [matchingId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = newMessage.trim()
    if (!text || sending) return
    setSending(true)
    setSendError(null)
    setNewMessage('')
    const { data: inserted, error } = await supabase.from('messages').insert({
      matching_id: matchingId,
      sender_id: currentUserId,
      contenu: text,
    }).select().single()

    if (error) {
      setSendError(error.message)
      setNewMessage(text)
    } else if (inserted) {
      setMessages(prev => [...prev, inserted as Message])
    }
    setSending(false)
  }

  // Group messages by date
  let lastDate = ''

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Price summary */}
      <div className="bg-accent/5 border-b border-accent/20 px-4 py-3">
        <p className="text-sm font-semibold text-nardo">Repartition du paiement</p>
        <div className="flex gap-4 mt-1 text-sm text-muted flex-wrap">
          <span>Total : <strong className="text-nardo">{prixTotal.toLocaleString()} MAD</strong></span>
          <span>Dottruck 10% : <strong className="text-nardo">{commission.toLocaleString()} MAD</strong></span>
          <span>Net : <strong className="text-nardo">{netAPayer.toLocaleString()} MAD</strong></span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-surface">
        {messages.length === 0 && (
          <p className="text-center text-muted text-sm mt-8">
            Pas encore de messages. Proposez un split de prix !
          </p>
        )}
        {messages.map(msg => {
          const msgDate = formatDate(msg.created_at)
          const showDate = msgDate !== lastDate
          lastDate = msgDate

          const isMine = msg.sender_id === currentUserId

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-3">
                  <span className="bg-border/60 text-muted text-xs px-3 py-1 rounded-full">
                    {msgDate}
                  </span>
                </div>
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
                    {msg.contenu}
                  </div>
                  <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-muted">{formatTime(msg.created_at)}</span>
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
          Erreur : {sendError}
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t border-border p-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Votre message..."
          disabled={sending}
          className="border border-border rounded-xl px-4 py-3 flex-1 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-base bg-white text-nardo disabled:opacity-50 transition-colors min-h-[48px]"
        />
        <button
          onClick={sendMessage}
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
    </div>
  )
}
