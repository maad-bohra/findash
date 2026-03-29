import { useState, useEffect, useCallback } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import styles from './Dashboard.module.css'
import TransactionsView from './TransactionsView.jsx'
import WalletView from './WalletView.jsx'

const API = '/api'

const NAV = [
  { icon: '▦', label: 'Dashboard'    },
  { icon: '↕', label: 'Transactions' },
  { icon: '◈', label: 'Wallet'       },
  { icon: '∿', label: 'Analytics'    },
  { icon: '⚙', label: 'Settings'     },
]

const CAT_ICONS = {
  Food: '🍜', Transport: '🚗', Entertainment: '🎬', Income: '💼', Bills: '📋',
}

function fmt(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Math.abs(n))
}

function buildChartData(txns) {
  const map = {}
  txns.forEach(t => {
    const d   = new Date(t.date)
    const key = isNaN(d)
      ? t.date
      : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    if (!map[key]) map[key] = { month: key, Income: 0, Expenses: 0 }
    if (t.amount > 0) map[key].Income   += t.amount
    else              map[key].Expenses += Math.abs(t.amount)
  })
  return Object.values(map)
}

function trendInfo(current, previous, invertColor = false) {
  if (previous === 0) return { text: 'No prior data', good: null }
  const pct  = (((current - previous) / previous) * 100).toFixed(1)
  const up   = parseFloat(pct) >= 0
  const good = invertColor ? !up : up
  return { text: `${up ? '▲' : '▼'} ${Math.abs(pct)}% vs last month`, good }
}

function calcTrends(txns) {
  const now       = new Date()
  const thisMonth = now.getMonth()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const filter   = m   => txns.filter(t => new Date(t.date).getMonth() === m)
  const income   = arr => arr.filter(t => t.amount > 0).reduce((a, t) => a + t.amount, 0)
  const expenses = arr => arr.filter(t => t.amount < 0).reduce((a, t) => a + Math.abs(t.amount), 0)
  const thisM = filter(thisMonth), lastM = filter(lastMonth)
  const tI = income(thisM),   lI = income(lastM)
  const tE = expenses(thisM), lE = expenses(lastM)
  const tB = tI - tE,         lB = lI - lE
  return {
    balance:  trendInfo(tB, lB),
    income:   trendInfo(tI, lI),
    expenses: trendInfo(tE, lE, true),
  }
}

// Chart 
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--surface-2)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px', fontSize: 13,
    }}>
      <p style={{ color: 'var(--text-2)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.dataKey}: {fmt(p.value)}</p>
      ))}
    </div>
  )
}

// Add Transaction Modal 
function Modal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    type: 'expense', name: '', amount: '', category: 'Food',
    status: 'Pending', date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function update(k) { return e => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    let amount = parseFloat(form.amount)
    if (form.type === 'expense') amount = -Math.abs(amount)
    else                         amount =  Math.abs(amount)
    const formattedDate = new Date(form.date + 'T00:00:00').toLocaleDateString('en-IN', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
    try {
      const res  = await fetch(`${API}/transactions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, date: formattedDate, category: form.category, status: form.status, amount }),
      })
      const data = await res.json()
      if (data.success) { onSaved(); onClose() }
      else setError(data.error || 'Failed to save')
    } catch { setError('Cannot reach server.') }
    finally  { setLoading(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} anim-fade-up`}>
        <div className={styles.modalHeader}>
          <h3>Add Transaction</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>Type</label>
            <select value={form.type} onChange={update('type')}>
              <option value="expense">Expense (−)</option>
              <option value="income">Income (+)</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>Description</label>
            <input type="text" value={form.name} onChange={update('name')} placeholder="e.g. Grocery Store" required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>Amount</label>
            <input type="number" value={form.amount} onChange={update('amount')} step="0.01" placeholder="0.00" required />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>Category</label>
            <select value={form.category} onChange={update('category')}>
              {['Food', 'Transport', 'Entertainment', 'Income', 'Bills'].map(c => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>Status</label>
            <select value={form.status} onChange={update('status')}>
              <option>Pending</option>
              <option>Completed</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>Date</label>
            <input type="date" value={form.date} onChange={update('date')} required />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          <button type="submit" className={styles.saveBtn} disabled={loading}>
            {loading ? 'Saving…' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  )
}

//  Settings 
function SettingsSection({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-3)', paddingLeft: 2 }}>
        {label}
      </p>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  )
}

function SettingsRow({ title, sub, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.4rem', gap: '1rem' }}>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</p>
        <p style={{ fontSize: 12.5, color: 'var(--text-2)', marginTop: 2 }}>{sub}</p>
      </div>
      {children}
    </div>
  )
}

function SettingsView({ user, theme, onToggleTheme, onLogout }) {
  const isDark = theme === 'dark'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem', maxWidth: 600 }} className="anim-fade-up">
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--text)' }}>Settings</h2>

      <SettingsSection label="Account">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '1.2rem 1.4rem' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6ee7b7,#60a5fa)',
            color: '#0d0f14', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontWeight: 800, fontSize: 15, flexShrink: 0,
          }}>
            {(user.username || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{user.username}</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 2 }}>{user.email}</p>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection label="Appearance">
        <SettingsRow title="Theme" sub="Switch between dark and light mode">
          <button
            onClick={onToggleTheme}
            style={{
              display: 'flex', background: 'var(--surface-2)',
              border: '1px solid var(--border)', borderRadius: 30,
              padding: 3, gap: 2, cursor: 'pointer', flexShrink: 0,
            }}
          >
            {['🌙 Dark', '☀️ Light'].map((label, i) => {
              const isActive = (i === 0 && isDark) || (i === 1 && !isDark)
              return (
                <span key={label} style={{
                  padding: '6px 14px', borderRadius: 24, fontSize: 12.5,
                  fontWeight: 600, whiteSpace: 'nowrap', fontFamily: 'var(--font)',
                  background: isActive ? 'var(--accent)' : 'transparent',
                  color: isActive ? '#0d0f14' : 'var(--text-2)',
                  transition: 'background .2s, color .2s',
                }}>
                  {label}
                </span>
              )
            })}
          </button>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection label="Session">
        <SettingsRow title="Sign out" sub="You will be returned to the login screen">
          <button
            onClick={onLogout}
            style={{
              background: 'rgba(248,113,113,.1)', color: 'var(--danger)',
              border: '1px solid rgba(248,113,113,.2)', padding: '9px 20px',
              borderRadius: 9, fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font)', flexShrink: 0,
            }}
          >
            ⎋ Sign Out
          </button>
        </SettingsRow>
      </SettingsSection>
    </div>
  )
}

// Status Badge 
function StatusBadge({ status }) {
  return (
    <span className={`${styles.statusBadge} ${status === 'Completed' ? styles.completed : styles.pending}`}>
      {status}
    </span>
  )
}

//  Main Dashboard 
export default function Dashboard({ user, theme, onToggleTheme, onLogout }) {
  const [transactions, setTransactions] = useState([])
  const [summary,      setSummary]      = useState({ balance: 0, income: 0, expenses: 0 })
  const [trends,       setTrends]       = useState({})
  const [chartData,    setChartData]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [activeNav,    setActiveNav]    = useState('Dashboard')
  const [deleting,     setDeleting]     = useState(null)

  const loadAll = useCallback(async () => {
    try {
      const [txRes, sumRes] = await Promise.all([
        fetch(`${API}/transactions`),
        fetch(`${API}/summary`),
      ])
      const txns = await txRes.json()
      const sum  = await sumRes.json()
      setTransactions(txns)
      setSummary(sum)
      setChartData(buildChartData(txns))
      setTrends(calcTrends(txns))
    } catch (err) {
      console.error('Load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function handleDelete(id) {
    if (!confirm('Delete this transaction?')) return
    setDeleting(id)
    try {
      const res  = await fetch(`${API}/transactions/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) loadAll()
      else alert('Error: ' + data.message)
    } catch { alert('Server error.') }
    finally  { setDeleting(null) }
  }

  const initials = (user.username || 'U').slice(0, 2).toUpperCase()
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const CARDS = [
    { key: 'balance',  label: 'Total Balance', icon: '◈', value: summary.balance,  color: 'var(--accent)',   trend: trends.balance  },
    { key: 'income',   label: 'Income',        icon: '↑', value: summary.income,   color: 'var(--accent-2)', trend: trends.income   },
    { key: 'expenses', label: 'Expenses',      icon: '↓', value: summary.expenses, color: 'var(--danger)',   trend: trends.expenses },
  ]

  function renderMain() {
    switch (activeNav) {
      case 'Transactions':
        return (
          <TransactionsView
            transactions={transactions}
            onDelete={handleDelete}
            onAdd={() => setShowModal(true)}
            deleting={deleting}
          />
        )
      case 'Wallet':
        return (
          <WalletView
            transactions={transactions}
            summary={summary}
          />
        )
      case 'Settings':
        return (
          <SettingsView
            user={user}
            theme={theme}
            onToggleTheme={onToggleTheme}
            onLogout={onLogout}
          />
        )
      default:
        return (
          <>
            {/* Recent Transactions — last 5 */}
            <header className={`${styles.header} anim-fade-up`}>
              <div>
                <h1 className={styles.greeting}>{greeting}, {user.username} 👋</h1>
                <p className={styles.greetingSub}>Here is your financial overview.</p>
              </div>
              <div className={styles.userChip}>
                <span className={styles.userEmail}>{user.email}</span>
                <div className={styles.avatar}>{initials}</div>
              </div>
            </header>

            {/* 3 Summary Cards */}
            <div className={styles.cards}>
              {CARDS.map((c, i) => (
                <div
                  key={c.key}
                  className={`${styles.card} anim-fade-up anim-delay-${i + 1}`}
                  style={{ '--card-accent': c.color }}
                >
                  <div className={styles.cardTop}>
                    <span className={styles.cardLabel}>{c.label}</span>
                    <span className={styles.cardIcon} style={{ color: c.color }}>{c.icon}</span>
                  </div>
                  <div className={styles.cardAmount}>{loading ? '—' : fmt(c.value)}</div>
                  {c.trend && (
                    <span
                      className={styles.cardTrend}
                      style={{
                        color: c.trend.good === null
                          ? 'var(--text-3)'
                          : c.trend.good ? 'var(--accent)' : 'var(--danger)',
                      }}
                    >
                      {c.trend.text}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className={`${styles.chartBox} anim-fade-up anim-delay-4`}>
              <p className={styles.sectionTitle}>Income vs Expenses</p>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-2)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-2)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 13, color: 'var(--text-2)' }} />
                  <Line type="monotone" dataKey="Income"   stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--accent)' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Expenses" stroke="var(--danger)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--danger)' }} activeDot={{ r: 6 }} strokeDasharray="5 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Transactions — last 5 */}
            <section className={`${styles.txSection} anim-fade-up anim-delay-5`}>
              <div className={styles.txHeader}>
                <p className={styles.sectionTitle}>Recent Transactions</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className={styles.addBtn}
                    style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                    onClick={() => setActiveNav('Transactions')}
                  >
                    View All
                  </button>
                  <button className={styles.addBtn} onClick={() => setShowModal(true)}>+ Add New</button>
                </div>
              </div>

              {loading ? (
                <p style={{ color: 'var(--text-2)', padding: '2rem', textAlign: 'center' }}>Loading…</p>
              ) : transactions.length === 0 ? (
                <p style={{ color: 'var(--text-2)', padding: '2rem', textAlign: 'center' }}>No transactions yet.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        {['Transaction', 'Date', 'Category', 'Status', 'Amount', ''].map(h => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 5).map(t => {
                        const isIncome = t.amount > 0
                        return (
                          <tr key={t._id} className={styles.txRow}>
                            <td>
                              <div className={styles.txName}>
                                <span className={styles.catIcon}>{CAT_ICONS[t.category] || '💳'}</span>
                                {t.name}
                              </div>
                            </td>
                            <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{t.date}</td>
                            <td><span className={styles.catBadge}>{t.category}</span></td>
                            <td><StatusBadge status={t.status} /></td>
                            <td>
                              <span style={{
                                fontFamily: 'var(--mono)', fontWeight: 600, fontSize: 13.5,
                                color: isIncome ? 'var(--accent)' : 'var(--text)',
                              }}>
                                {isIncome ? '+' : '−'}{fmt(t.amount)}
                              </span>
                            </td>
                            <td>
                              <button
                                className={styles.delBtn}
                                onClick={() => handleDelete(t._id)}
                                disabled={deleting === t._id}
                              >
                                {deleting === t._id ? '…' : '🗑'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )
    }
  }

  return (
    <div className={styles.shell}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>💰 FinDash</div>
        <nav className={styles.nav}>
          {NAV.map(n => (
            <button
              key={n.label}
              className={`${styles.navItem} ${activeNav === n.label ? styles.navActive : ''}`}
              onClick={() => setActiveNav(n.label)}
            >
              <span className={styles.navIcon}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {renderMain()}
      </main>

      {showModal && <Modal onClose={() => setShowModal(false)} onSaved={loadAll} />}
    </div>
  )
}