import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import PasskeyAuth from './components/PasskeyAuth'
import WalletsPage from './pages/WalletsPage'
import PairPage from './pages/PairPage'
import ApprovePage from './pages/ApprovePage'
import './App.css'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

const ToastContext = createContext(null)
export const useToast = () => useContext(ToastContext)

function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: '', visible: false })
  const show = useCallback((message, duration = 2000) => {
    setToast({ message, visible: true })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), duration)
  }, [])
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={`toast ${toast.visible ? 'show' : ''}`}>{toast.message}</div>
    </ToastContext.Provider>
  )
}

function BottomNav() {
  return (
    <nav className="bottom-nav">
      <NavLink to="/wallets" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav-icon">💳</span>Wallets
      </NavLink>
      <NavLink to="/pair" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav-icon">🔗</span>Pair
      </NavLink>
      <NavLink to="/approve" className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}>
        <span className="bottom-nav-icon">✅</span>Approve
      </NavLink>
    </nav>
  )
}

function AppHeader() {
  const { logout } = useAuth()
  return (
    <header className="app-header">
      <div className="app-header-logo">
        <div className="app-header-mark">A</div>
        <span className="app-header-title">Agent<span>Vault</span></span>
      </div>
      <button className="btn-ghost" onClick={logout}>Logout</button>
    </header>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const location = useLocation()

  useEffect(() => {
    const stored = localStorage.getItem('agentvault_user')
    if (stored) { try { setUser(JSON.parse(stored)) } catch { localStorage.removeItem('agentvault_user') } }
    setLoading(false)
  }, [])

  const login = useCallback((userData) => { setUser(userData); localStorage.setItem('agentvault_user', JSON.stringify(userData)) }, [])
  const logout = useCallback(() => { setUser(null); localStorage.removeItem('agentvault_user') }, [])

  if (loading) return <div className="app-loading">Loading...</div>
  const isAuthed = !!user
  const showChrome = isAuthed && location.pathname !== '/login'

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <ToastProvider>
        <div className="app">
          {showChrome && <AppHeader />}
          <Routes>
            <Route path="/login" element={isAuthed ? <Navigate to="/wallets" /> : <PasskeyAuth />} />
            <Route path="/wallets" element={isAuthed ? <WalletsPage /> : <Navigate to="/login" />} />
            <Route path="/pair" element={isAuthed ? <PairPage /> : <Navigate to="/login" />} />
            <Route path="/approve" element={isAuthed ? <ApprovePage /> : <Navigate to="/login" />} />
            <Route path="/" element={<Navigate to={isAuthed ? '/wallets' : '/login'} />} />
            <Route path="/dashboard" element={<Navigate to="/wallets" />} />
            <Route path="/bind" element={<Navigate to="/pair" />} />
          </Routes>
          {showChrome && <BottomNav />}
        </div>
      </ToastProvider>
    </AuthContext.Provider>
  )
}
