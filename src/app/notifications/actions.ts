'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markNotificationRead(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const id = formData.get('id') as string
  await supabase
    .from('notifications')
    .update({ lue: true })
    .eq('id', id)
    .eq('user_id', user.id)

  revalidatePath('/notifications')
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ lue: true })
    .eq('user_id', user.id)
    .eq('lue', false)

  revalidatePath('/notifications')
}
