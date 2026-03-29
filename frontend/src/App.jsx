import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  const [page,  setPage]  = useState('login')
  const [user,  setUser]  = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const email    = localStorage.getItem('loggedInUser')
    const username = localStorage.getItem('loggedInUsername')
    if (email) {
      setUser({ email, username: username && username !== 'undefined' ? username : email.split('@')[0] })
      setPage('dashboard')
    }
  }, [])

  function handleLogin(userData) {
    localStorage.setItem('loggedInUser',     userData.email)
    localStorage.setItem('loggedInUsername', userData.username || userData.email.split('@')[0])
    setUser(userData)
    setPage('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem('loggedInUsername')
    setUser(null)
    setPage('login')
  }

  if (page === 'dashboard' && user)
    return <Dashboard user={user} theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} onLogout={handleLogout} />

  if (page === 'signup')
    return <Signup onGoLogin={() => setPage('login')} />

  return <Login onLogin={handleLogin} onGoSignup={() => setPage('signup')} />
}