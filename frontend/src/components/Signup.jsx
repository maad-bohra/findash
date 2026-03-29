import { useState } from 'react'
import styles from './Auth.module.css'

export default function Signup({ onGoLogin }) {
  const [form,    setForm]    = useState({ username: '', email: '', password: '', confirm: '' })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function update(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 4)       return setError('Password must be at least 4 characters')
    setLoading(true)
    try {
      const res  = await fetch('/api/signup', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (data.success) {
        alert('Account created! You can now log in.')
        onGoLogin()
      } else {
        setError(data.message || 'Sign-up failed')
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
        <h2 className={styles.title}>Create account</h2>
        <p className={styles.sub}>Start managing your finances today</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <Field label="Username"         type="text"     value={form.username} onChange={update('username')} placeholder="e.g. ali_christ" />
          <Field label="Email"            type="email"    value={form.email}    onChange={update('email')}    placeholder="name@example.com" />
          <Field label="Password"         type="password" value={form.password} onChange={update('password')} placeholder="Min 4 characters" />
          <Field label="Confirm Password" type="password" value={form.confirm}  onChange={update('confirm')}  placeholder="Repeat password" />
          {error && <p className={styles.error}>{error}</p>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <p className={styles.foot}>
          Already have an account?{' '}
          <button className={styles.link} onClick={onGoLogin}>Log in</button>
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
        onChange={onChange}
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
        onFocus={e => e.target.style.borderColor = 'var(--accent)'}
        onBlur={e  => e.target.style.borderColor = 'var(--border)'}
      />
    </div>
  )
}
