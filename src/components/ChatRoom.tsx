'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Message {
  id: string
  contenu: string
  sender_id: string
  created_at: string
}

interface ChatRoomProps {
  matchingId: string
  currentUserId: string
  prixTotal: number
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
      }
    }

    fetchMessages()

    // Realtime subscription (works if Realtime enabled on messages table)
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
        }
      )
      .subscribe()

    // Polling fallback every 3s — ensures messages appear even without Realtime
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
      // Optimistic update — don't wait for Realtime
      setMessages(prev => [...prev, inserted as Message])
    }
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Price summary */}
      <div className="bg-accent/5 border border-accent/20 px-4 py-3">
        <p className="text-sm font-semibold text-nardo">Répartition du paiement</p>
        <div className="flex gap-6 mt-1 text-sm text-gray-600">
          <span>Total : <strong className="text-gray-900">{prixTotal} MAD</strong></span>
          <span>Fleez 10% : <strong className="text-gray-900">{commission} MAD</strong></span>
          <span>Net à partager : <strong className="text-nardo">{netAPayer} MAD</strong></span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-surface">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            Pas encore de messages. Proposez un split de prix !
          </p>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 text-sm ${
                msg.sender_id === currentUserId
                  ? 'bg-accent text-white rounded-2xl rounded-tr-sm'
                  : 'bg-gray-100 text-nardo rounded-2xl rounded-tl-sm'
              }`}
            >
              {msg.contenu}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Send error */}
      {sendError && (
        <div className="bg-red-50 border-t border-red-200 px-4 py-2 text-sm text-red-600">
          Erreur : {sendError}
        </div>
      )}

      {/* Input */}
      <div className="bg-white border-t p-4 flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Votre message ou proposition de prix..."
          disabled={sending}
          className="border border-border rounded-xl px-4 py-3 flex-1 focus:outline-none focus:border-accent text-base bg-white text-nardo disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="bg-accent hover:bg-accent-hover text-white rounded-xl px-4 min-h-[48px] font-semibold transition-all disabled:opacity-50"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}
