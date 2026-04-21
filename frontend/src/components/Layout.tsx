import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
    isActive ? 'bg-secondary text-white' : 'text-blue-100 hover:bg-white/10'
  }`

export default function Layout() {
  const { supplier, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sidebar = (
    <aside className="flex flex-col h-full">
      <div className="px-6 py-5 border-b border-white/10">
        <div className="text-white font-bold text-lg leading-tight">Supplier PCF</div>
        <div className="text-blue-200 text-xs mt-0.5">Carbon Footprint Portal</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <NavLink to="/dashboard" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
          <span>📊</span> Dashboard
        </NavLink>
        {isAdmin && (
          <>
            <div className="px-4 pt-4 pb-1 text-xs font-semibold text-blue-300 uppercase tracking-wide">
              Administration
            </div>
            <NavLink to="/admin" end className={navLinkClass} onClick={() => setSidebarOpen(false)}>
              <span>🗂</span> Alle Submissions
            </NavLink>
            <NavLink to="/admin/export" className={navLinkClass} onClick={() => setSidebarOpen(false)}>
              <span>⬇</span> CSV Export
            </NavLink>
          </>
        )}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <div className="px-4 py-2 text-xs text-blue-200 truncate">
          {supplier?.company_name}
          <br />
          <span className="text-blue-300">{supplier?.contact_email}</span>
        </div>
        <button
          onClick={handleLogout}
          className="mt-2 w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-blue-100 hover:bg-white/10 transition-colors"
        >
          <span>↩</span> Abmelden
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-60 flex-shrink-0 flex-col bg-primary">
        {sidebar}
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-60 bg-primary flex flex-col z-50">
            {sidebar}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 flex items-center gap-4 px-4 bg-white border-b border-gray-200 flex-shrink-0">
          <button
            className="md:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="text-sm text-gray-600">
            Willkommen, <span className="font-semibold text-gray-800">{supplier?.contact_name}</span>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
