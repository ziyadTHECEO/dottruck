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
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const commission = Math.round(prixTotal * 0.1)
  const netAPayer = prixTotal - commission

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('matching_id', matchingId)
        .order('created_at', { ascending: true })
      setMessages(data ?? [])
    }
    loadMessages()

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
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [matchingId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    const text = newMessage.trim()
    if (!text || sending) return
    setSending(true)
    setNewMessage('')
    await supabase.from('messages').insert({
      matching_id: matchingId,
      sender_id: currentUserId,
      contenu: text,
    })
    setSending(false)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Price summary */}
      <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
        <p className="text-sm font-medium text-gray-700">Répartition du paiement</p>
        <div className="flex gap-6 mt-1 text-sm text-gray-600">
          <span>Total : <strong className="text-gray-900">{prixTotal} MAD</strong></span>
          <span>Fleez 10% : <strong className="text-gray-900">{commission} MAD</strong></span>
          <span>Net à partager : <strong className="text-orange-600">{netAPayer} MAD</strong></span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
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
              className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                msg.sender_id === currentUserId
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}
            >
              {msg.contenu}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t p-4 flex gap-3">
        <input
          type="text"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
          placeholder="Votre message ou proposition de prix..."
          disabled={sending}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-5 py-2 rounded-xl font-medium transition"
        >
          Envoyer
        </button>
      </div>
    </div>
  )
}
