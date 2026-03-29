import { useState } from 'react'
import styles from './Auth.module.css'

export default function Login({ onLogin, onGoSignup }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res  = await fetch('/api/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (data.success) {
        onLogin({ email: data.user.email, username: data.user.username })
      } else {
        setError(data.message || 'Login failed')
      }
    } catch {
      setError('Cannot reach server. Is node server.js running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={`${styles.card} anim-fade-up`}>
        <div className={styles.logo}>💰 FinDash</div>
        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.sub}>Sign in to your finance dashboard</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="name@example.com" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        <p className={styles.foot}>
          No account?{' '}
          <button className={styles.link} onClick={onGoSignup}>Create one</button>
        </p>
      </div>
    </div>
  )
}

function Field({ label, type, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={{
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '11px 14px',
          color: 'var(--text)',
          fontSize: 14,
          outline: 'none',
          transition: 'border-color .2s',
        }}
        onFocus={e  => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e   => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}
