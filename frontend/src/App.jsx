import { useState, useEffect } from 'react'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'
import Dashboard from './components/Dashboard.jsx'

//banner temp
import NoticeBanner from './components/NoticeBanner';

function App() {
  return (
    <>
      <NoticeBanner />
      {/* rest of your app */}
    </>
  );
}

export default function App() {
  const [page,  setPage]  = useState('login')
  const [user,  setUser]  = useState(null)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')

  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    const token    = localStorage.getItem('authToken')
    const email    = localStorage.getItem('loggedInUser')
    const username = localStorage.getItem('loggedInUsername')
    const avatar   = localStorage.getItem('loggedInAvatar') || null
    const currency = localStorage.getItem('loggedInCurrency') || 'INR'
    const isAdmin  = localStorage.getItem('loggedInIsAdmin') === 'true'
    if (token && email) {
      setUser({ email, username: username && username !== 'undefined' ? username : email.split('@')[0], avatar, currency, isAdmin })
      setPage('dashboard')
    }
  }, [])

  function handleLogin(userData, token) {
    // Fix #2: store JWT token
    localStorage.setItem('authToken',        token)
    localStorage.setItem('loggedInUser',     userData.email)
    localStorage.setItem('loggedInUsername', userData.username || userData.email.split('@')[0])
    // Fix #10, #11: persist isAdmin correctly
    localStorage.setItem('loggedInIsAdmin',  userData.isAdmin ? 'true' : 'false')
    if (userData.avatar)   localStorage.setItem('loggedInAvatar', userData.avatar)
    if (userData.currency) localStorage.setItem('loggedInCurrency', userData.currency)
    setUser({ ...userData, currency: userData.currency || 'INR', isAdmin: userData.isAdmin || false })
    setPage('dashboard')
  }

  function handleLogout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('loggedInUser')
    localStorage.removeItem('loggedInUsername')
    localStorage.removeItem('loggedInAvatar')
    localStorage.removeItem('loggedInCurrency')
    localStorage.removeItem('loggedInIsAdmin')
    setUser(null)
    setPage('login')
  }

  function handleUpdateUser(updates) {
    const newUser = { ...user, ...updates }
    setUser(newUser)
    if (updates.username) localStorage.setItem('loggedInUsername', updates.username)
    if (updates.avatar !== undefined) {
      if (updates.avatar) localStorage.setItem('loggedInAvatar', updates.avatar)
      else localStorage.removeItem('loggedInAvatar')
    }
    if (updates.currency) localStorage.setItem('loggedInCurrency', updates.currency)
    // Fix #11: persist isAdmin changes (e.g. after admin promotes/demotes user)
    if (updates.isAdmin !== undefined) localStorage.setItem('loggedInIsAdmin', updates.isAdmin ? 'true' : 'false')
  }

  if (page === 'dashboard' && user)
    return (
      <Dashboard
        user={user}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        onLogout={handleLogout}
        onUpdateUser={handleUpdateUser}
      />
    )

  if (page === 'signup')
    return <Signup onGoLogin={() => setPage('login')} />

  return <Login onLogin={handleLogin} onGoSignup={() => setPage('signup')} />
}
