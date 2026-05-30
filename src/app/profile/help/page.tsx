import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HelpContent from '@/components/HelpContent'

export default async function HelpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const role = (userProfile?.role === 'transporteur' || userProfile?.role === 'expéditeur')
    ? userProfile.role
    : 'transporteur'

  return <HelpContent role={role} />
}
