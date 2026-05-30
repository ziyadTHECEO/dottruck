import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminTabs from '@/components/admin/AdminTabs'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return redirect('/admin/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return redirect('/admin/login')

  return (
    <div className="min-h-screen bg-surface flex flex-col" dir="ltr">
      <header className="bg-white border-b border-border px-4 h-14 flex items-center justify-center sticky top-0 z-20">
        <h1 className="text-base font-bold text-nardo">Dottruck Admin</h1>
      </header>
      <AdminTabs />
      <main className="flex-1 pb-8 max-w-4xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
