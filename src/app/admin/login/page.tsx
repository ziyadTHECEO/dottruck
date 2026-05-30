import { adminSignIn } from '@/app/admin/actions'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-border p-6 w-full max-w-sm">
        <h1 className="text-xl font-bold text-nardo text-center mb-1">Dottruck Admin</h1>
        <p className="text-sm text-muted text-center mb-6">Tableau de bord</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-error rounded-xl p-3 text-sm mb-4 text-center">
            {decodeURIComponent(error)}
          </div>
        )}

        <form action={adminSignIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-nardo mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
              placeholder="admin@dottruck.ma"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-nardo mb-1">Mot de passe</label>
            <input
              name="password"
              type="password"
              required
              className="w-full border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="w-full min-h-[48px] bg-accent text-white font-semibold rounded-xl hover:bg-accent-hover transition-colors text-sm cursor-pointer"
          >
            Connexion
          </button>
        </form>
      </div>
    </div>
  )
}
