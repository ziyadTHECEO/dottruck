import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVerificationState } from '@/lib/verification'
import { VerificationBlocker } from '@/components/VerificationBlocker'
import NewChargeContent from '@/components/NewChargeContent'

export default async function NewChargePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { blocked, resendFields } = await getVerificationState(user.id, userRole?.role)

  return (
    <VerificationBlocker blocked={blocked} resendFields={resendFields}>
      <Suspense>
        <NewChargeContent />
      </Suspense>
    </VerificationBlocker>
  )
}
