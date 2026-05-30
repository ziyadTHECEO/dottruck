'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { AudioButton } from '@/components/ui/AudioButton'

interface PriceInputProps {
  onSubmit: (amount: number) => Promise<void>
  disabled?: boolean
  prefillAmount?: number
}

export function PriceInput({ onSubmit, disabled, prefillAmount }: PriceInputProps) {
  const { t } = useTranslation()
  const [amount, setAmount] = useState(prefillAmount?.toString() ?? '')
  const [sending, setSending] = useState(false)
  const [expanded, setExpanded] = useState(!!prefillAmount)

  const handleSubmit = async () => {
    const num = parseInt(amount)
    if (!num || num <= 0) return
    setSending(true)
    await onSubmit(num)
    setAmount('')
    setExpanded(false)
    setSending(false)
  }

  if (!expanded) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setExpanded(true)}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2 bg-accent/10 text-accent text-xs font-semibold rounded-lg hover:bg-accent/20 transition-colors cursor-pointer disabled:opacity-50"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
          {t('chat_propose_price')}
        </button>
        <AudioButton text={t('chat_propose_price_audio')} size="sm" />
      </div>
    )
  }

  return (
    <div className="bg-accent/5 border border-accent/20 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-accent">{t('chat_propose_price')}</p>
        <AudioButton text={t('chat_propose_price_audio')} size="sm" />
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSubmit() }}
          placeholder={t('chat_price_placeholder')}
          disabled={sending || disabled}
          className="flex-1 border border-border rounded-lg px-3 py-2 text-base text-nardo focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 bg-white min-h-[40px] disabled:opacity-50"
        />
        <button
          onClick={handleSubmit}
          disabled={sending || disabled || !amount || parseInt(amount) <= 0}
          className="px-4 min-h-[40px] bg-accent text-white text-sm font-semibold rounded-lg transition-colors hover:bg-accent-hover disabled:opacity-50 cursor-pointer"
        >
          {sending ? '...' : t('chat_send_proposal')}
        </button>
      </div>
      <button
        onClick={() => { setExpanded(false); setAmount('') }}
        className="text-xs text-muted hover:text-nardo cursor-pointer"
      >
        ✕
      </button>
    </div>
  )
}
