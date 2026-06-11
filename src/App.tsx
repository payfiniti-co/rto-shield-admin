import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
  Outlet,
} from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import Login from './pages/Login'
import Merchants from './pages/Merchants'
import Errors from './pages/Errors'

function RequireAuth() {
  const { authed, loading } = useAuth()
  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center text-slate-500">
        Loading…
      </div>
    )
  }
  return authed ? <Outlet /> : <Navigate to="/login" replace />
}

function Layout() {
  const { logout } = useAuth()
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded px-3 py-1.5 text-sm font-medium ${
      isActive ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
    }`

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="flex items-center gap-4 border-b border-slate-200 bg-white px-6 py-3">
        <span className="font-semibold">RTO Shield Admin</span>
        <nav className="flex gap-1">
          <NavLink to="/merchants" className={linkClass}>
            Merchants
          </NavLink>
          <NavLink to="/errors" className={linkClass}>
            Errors
          </NavLink>
        </nav>
        <button
          type="button"
          onClick={() => void logout()}
          className="ml-auto rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
        >
          Log out
        </button>
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/merchants" replace />} />
              <Route path="/merchants" element={<Merchants />} />
              <Route path="/errors" element={<Errors />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
