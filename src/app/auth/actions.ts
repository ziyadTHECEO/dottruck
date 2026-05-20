'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const role = formData.get('role') as string
  const nom = formData.get('nom') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const phone = formData.get('phone') as string
  const ville = formData.get('ville') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, nom, phone, ville },
    },
  })

  if (error) {
    return redirect(`/auth/signup?error=${encodeURIComponent(error.message)}&role=${role}`)
  }

  if (role === 'transporteur') {
    return redirect('/profile/setup')
  }

  return redirect('/dashboard')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/')
}
