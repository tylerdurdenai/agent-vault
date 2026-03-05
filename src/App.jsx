import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PasskeyAuth from './components/PasskeyAuth'
import Dashboard from './pages/Dashboard'
import AgentBinding from './pages/AgentBinding'
import TransactionApproval from './pages/TransactionApproval'
import './App.css'

// Auth context
const AuthContext = createContext(null)

export const useAuth = () => useContext(AuthContext)

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const stored = localStorage.getItem('agentvault_user')
    if (stored) {
      setUser(JSON.parse(stored))
    }
    setLoading(false)
  }, [])

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('agentvault_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('agentvault_user')
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <div className="app">
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/dashboard" /> : <PasskeyAuth />
          } />
          <Route path="/dashboard" element={
            user ? <Dashboard /> : <Navigate to="/login" />
          } />
          <Route path="/bind" element={
            user ? <AgentBinding /> : <Navigate to="/login" />
          } />
          <Route path="/approve" element={
            user ? <TransactionApproval /> : <Navigate to="/login" />
          } />
          <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        </Routes>
      </div>
    </AuthContext.Provider>
  )
}
