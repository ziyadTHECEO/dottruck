import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TermsContent from '@/components/TermsContent'

export default async function TermsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/auth/login')

  return <TermsContent />
}
