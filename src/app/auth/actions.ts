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

  // Check if user is banned
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('banned, ban_reason')
      .eq('id', user.id)
      .single()

    if (profile?.banned) {
      await supabase.auth.signOut()
      return redirect(`/auth/login?error=${encodeURIComponent('حساب موقوف: ' + (profile.ban_reason ?? ''))}`)
    }
  }

  return redirect('/dashboard')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return redirect('/auth/reset-password?error=دخل الإيميل')
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/update-password`,
  })

  if (error) {
    return redirect(`/auth/reset-password?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/auth/reset-password?success=true')
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 6) {
    return redirect('/auth/update-password?error=كلمة السر خاص تكون 6 حروف على الأقل')
  }

  if (password !== confirmPassword) {
    return redirect('/auth/update-password?error=كلمات السر ما متطابقينش')
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return redirect(`/auth/update-password?error=${encodeURIComponent(error.message)}`)
  }

  return redirect('/auth/login?success=تم تغيير كلمة السر')
}
