'use client'

import { useState } from 'react'
import { useTranslation } from '@/lib/i18n/context'
import { respondToProposal } from '@/app/chat/actions'
import { AudioButton } from '@/components/ui/AudioButton'

interface Proposal {
  id: string
  sender_id: string
  amount_mad: number
  status: string
  created_at: string
}

interface PriceProposalCardProps {
  proposal: Proposal
  currentUserId: string
  onCounterPropose: (amount: number) => void
  onStatusChange: () => void
}

export function PriceProposalCard({
  proposal,
  currentUserId,
  onCounterPropose,
  onStatusChange,
}: PriceProposalCardProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const isMine = proposal.sender_id === currentUserId
  const isPending = proposal.status === 'pending'

  const handleResponse = async (response: 'accepted' | 'refused') => {
    setLoading(true)
    const result = await respondToProposal(proposal.id, response)
    if (result.success) {
      onStatusChange()
    }
    setLoading(false)
  }

  const statusBadge = () => {
    switch (proposal.status) {
      case 'accepted': return <span className="text-xs font-semibold text-success">{t('chat_proposal_accepted')}</span>
      case 'refused': return <span className="text-xs font-semibold text-error">{t('chat_proposal_refused')}</span>
      case 'pending': return <span className="text-xs font-semibold text-warning">{t('chat_proposal_pending')}</span>
      case 'counter': return <span className="text-xs font-semibold text-muted">—</span>
      default: return null
    }
  }

  return (
    <div className={`mx-auto max-w-[85%] rounded-xl border-2 p-4 ${
      proposal.status === 'accepted'
        ? 'border-success/40 bg-green-50'
        : proposal.status === 'refused'
        ? 'border-error/20 bg-red-50/50'
        : 'border-accent/30 bg-accent/5'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted">{isMine ? 'عرضك' : 'عرض'}</span>
        {statusBadge()}
      </div>

      <div className="flex items-center justify-center gap-2">
        <p className="text-2xl font-bold text-nardo">
          {proposal.amount_mad.toLocaleString()} <span className="text-sm font-normal text-muted">{t('chat_price_mad')}</span>
        </p>
        <AudioButton
          text={
            isMine
              ? `${t('chat_proposal_audio_mine')} ${proposal.amount_mad} ${t('chat_price_mad')}`
              : isPending
              ? `${t('chat_proposal_audio_other')} ${proposal.amount_mad} ${t('chat_price_mad')}. ${t('chat_proposal_audio_actions')}`
              : `${t('chat_proposal_audio_other')} ${proposal.amount_mad} ${t('chat_price_mad')}`
          }
          size="sm"
        />
      </div>

      {proposal.status === 'accepted' && (
        <p className="text-xs text-success text-center mt-2 font-medium">
          {t('chat_commission_label')}: {Math.round(proposal.amount_mad * 0.04).toLocaleString()} {t('chat_price_mad')}
        </p>
      )}

      {/* Action buttons — only for the OTHER party, only if pending */}
      {!isMine && isPending && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleResponse('accepted')}
            disabled={loading}
            className="flex-1 min-h-[36px] bg-success text-white text-sm font-semibold rounded-lg transition-colors hover:bg-success/90 disabled:opacity-50 cursor-pointer"
          >
            {t('chat_accept')}
          </button>
          <button
            onClick={() => onCounterPropose(proposal.amount_mad)}
            disabled={loading}
            className="flex-1 min-h-[36px] bg-accent/10 text-accent text-sm font-semibold rounded-lg transition-colors hover:bg-accent/20 disabled:opacity-50 cursor-pointer"
          >
            {t('chat_counter')}
          </button>
          <button
            onClick={() => handleResponse('refused')}
            disabled={loading}
            className="flex-1 min-h-[36px] bg-red-50 text-error text-sm font-semibold rounded-lg transition-colors hover:bg-red-100 disabled:opacity-50 cursor-pointer"
          >
            {t('chat_refuse')}
          </button>
        </div>
      )}
    </div>
  )
}
