import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'

const ADMIN_AUTH_KEY = 'admin-authenticated'

function getAdminPassword(): string | undefined {
  // Support Vite and CRA-style env names
  const env = (import.meta as any).env || {}
  return env.VITE_ADMIN_PASSWORD || env.REACT_APP_ADMIN_PASSWORD
}

function useAdminAuth() {
  const [isAuthed, setIsAuthed] = useState<boolean>(false)

  useEffect(() => {
    const v = localStorage.getItem(ADMIN_AUTH_KEY)
    setIsAuthed(v === 'true')
  }, [])

  function login(password: string): { ok: boolean; error?: string } {
    const configured = getAdminPassword()
    if (!configured) {
      return { ok: false, error: 'Admin password not configured.' }
    }
    if (password !== configured) {
      return { ok: false, error: 'Invalid password.' }
    }
    localStorage.setItem(ADMIN_AUTH_KEY, 'true')
    setIsAuthed(true)
    return { ok: true }
  }

  function logout() {
    localStorage.removeItem(ADMIN_AUTH_KEY)
    setIsAuthed(false)
  }

  return { isAuthed, login, logout }
}

function AdminLoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { login } = useAdminAuth()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = login(password)
    if (!res.ok) {
      setError(res.error || 'Login failed')
    }
  }

  const configured = useMemo(() => Boolean(getAdminPassword()), [])

  return (
    <div className="mx-auto max-w-sm rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-xl font-semibold">Admin Login</h1>
      {!configured && (
        <p className="mb-3 text-sm text-amber-700">
          Admin password not set. Define <code>VITE_ADMIN_PASSWORD</code> or <code>REACT_APP_ADMIN_PASSWORD</code> in your env file.
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
          />
        </div>
        {error && <p className="text-sm text-red-600" aria-live="assertive">{error}</p>}
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Sign in
        </button>
      </form>
    </div>
  )
}

export default function AdminLayout() {
  const { isAuthed, logout } = useAdminAuth()
  const navigate = useNavigate()

  // If not authed, show login form in centered container
  if (!isAuthed) {
    return (
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4">
        <AdminLoginForm />
      </div>
    )
  }

  function handleLogout() {
    logout()
    navigate('/admin', { replace: true })
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded px-3 py-2 text-sm ${isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/admin" className="font-semibold">Admin Panel</Link>
          <button
            onClick={handleLogout}
            className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-12">
        <aside className="md:col-span-3">
          <nav className="rounded-lg border bg-white p-3 shadow-sm">
            <NavLink to="/admin" end className={navLinkClass}>Dashboard</NavLink>
            <NavLink to="/admin/services" className={navLinkClass}>Service Management</NavLink>
            <NavLink to="/admin/requests" className={navLinkClass}>All Requests</NavLink>
          </nav>
        </aside>

        <main className="md:col-span-9">
          <div className="rounded-lg border bg-white p-4 shadow-sm">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}


