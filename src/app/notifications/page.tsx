import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getVerificationState } from '@/lib/verification'
import { VerificationBlocker } from '@/components/VerificationBlocker'
import NotificationsContent from '@/components/NotificationsContent'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const notifs = notifications ?? []
  const unreadCount = notifs.filter(n => !n.lue).length

  const { data: userRole } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { blocked, resendFields } = await getVerificationState(user.id, userRole?.role)

  return (
    <VerificationBlocker blocked={blocked} resendFields={resendFields}>
      <NotificationsContent notifs={notifs} unreadCount={unreadCount} />
    </VerificationBlocker>
  )
}
