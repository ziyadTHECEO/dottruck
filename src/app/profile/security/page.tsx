import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SecurityContent from '@/components/SecurityContent'

export default async function SecurityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  return <SecurityContent userEmail={user.email ?? ''} />
}
