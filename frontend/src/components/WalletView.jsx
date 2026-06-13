import { authFetch } from '../utils/api.js'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './Dashboard.module.css'


const API = '/api'

// ── Account type metadata ─────────────────────────────────────────────────
const ACCOUNT_TYPES = [
  { type: 'Bank',        icon: '🏦', color: '#4f8ef7', label: 'Bank Account'  },
  { type: 'Cash',        icon: '💵', color: '#3dd68c', label: 'Cash'          },
  { type: 'UPI',         icon: '📲', color: '#a78bfa', label: 'UPI Wallet'    },
  { type: 'Credit Card', icon: '💳', color: '#f76f6f', label: 'Credit Card'   },
]

const TYPE_META = Object.fromEntries(ACCOUNT_TYPES.map(t => [t.type, t]))

function fmt(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Math.abs(n))
}

function fmtSigned(n) {
  const abs = new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Math.abs(n))
  return n < 0 ? `−${abs}` : `+${abs}`
}

// ── Small reusable input style ────────────────────────────────────────────
const inp = {
  background: 'var(--surface-2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '9px 12px', color: 'var(--text)',
  fontSize: 13, outline: 'none', fontFamily: 'var(--font)', width: '100%',
  boxSizing: 'border-box',
}

// ── Add / Edit Account Modal ──────────────────────────────────────────────
function AccountModal({ editing, onClose, onSaved }) {
  const defaults = editing || { type: 'Bank', icon: '🏦', color: '#4f8ef7' }
  const [form, setForm] = useState({
    name:        defaults.name        || '',
    type:        defaults.type        || 'Bank',
    balance:     defaults.balance     ?? '',
    icon:        defaults.icon        || '🏦',
    color:       defaults.color       || '#4f8ef7',
    creditLimit: defaults.creditLimit ?? '',
    bankName:    defaults.bankName    || '',
    upiId:       defaults.upiId       || '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const up = k => e => {
    const val = e.target.value
    setForm(f => {
      const next = { ...f, [k]: val }
      // Auto-fill icon/color when type changes
      if (k === 'type') {
        const meta = TYPE_META[val]
        if (meta) { next.icon = meta.icon; next.color = meta.color }
      }
      return next
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const body = {
      name:        form.name.trim(),
      type:        form.type,
      balance:     parseFloat(form.balance) || 0,
      icon:        form.icon,
      color:       form.color,
      creditLimit: form.creditLimit !== '' ? parseFloat(form.creditLimit) : null,
      bankName:    form.bankName,
      upiId:       form.upiId,
    }
    try {
      const url    = editing ? `${API}/accounts/${editing._id}` : `${API}/accounts`
      const method = editing ? 'PATCH' : 'POST'
      const res    = await authFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) { onSaved(); onClose() }
      else setError(data.error || 'Failed to save')
    } catch { setError('Cannot reach server.') }
    finally  { setLoading(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} anim-scale-in`} style={{ maxWidth: 440 }}>
        <div className={styles.modalHeader}>
          <h3>{editing ? 'Edit Account' : 'Add Account'}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>

          {/* Type selector */}
          <div>
            <label>Account Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
              {ACCOUNT_TYPES.map(t => (
                <button
                  key={t.type} type="button"
                  onClick={() => setForm(f => ({ ...f, type: t.type, icon: t.icon, color: t.color }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
                    border: form.type === t.type ? `2px solid ${t.color}` : '1px solid var(--border)',
                    background: form.type === t.type ? t.color + '18' : 'var(--surface-2)',
                    fontFamily: 'var(--font)', fontWeight: 600, fontSize: 13,
                    color: form.type === t.type ? t.color : 'var(--text-2)',
                    transition: 'all .15s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>Account Name</label>
            <input style={{ ...inp, marginTop: 5 }} value={form.name} onChange={up('name')}
              placeholder={form.type === 'Bank' ? 'e.g. SBI Savings' : form.type === 'UPI' ? 'e.g. PhonePe' : form.type === 'Credit Card' ? 'e.g. HDFC Regalia' : 'Cash in hand'} required />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>{form.type === 'Credit Card' ? 'Current Outstanding (₹)' : 'Current Balance (₹)'}</label>
            <input style={{ ...inp, marginTop: 5 }} type="number" value={form.balance} onChange={up('balance')}
              placeholder="0" step="0.01" required />
          </div>

          {form.type === 'Credit Card' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label>Credit Limit (₹)</label>
              <input style={{ ...inp, marginTop: 5 }} type="number" value={form.creditLimit} onChange={up('creditLimit')}
                placeholder="e.g. 100000" step="1" />
            </div>
          )}

          {form.type === 'Bank' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label>Bank Name</label>
              <input style={{ ...inp, marginTop: 5 }} value={form.bankName} onChange={up('bankName')}
                placeholder="e.g. State Bank of India" />
            </div>
          )}

          {form.type === 'UPI' && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label>UPI ID</label>
              <input style={{ ...inp, marginTop: 5 }} value={form.upiId} onChange={up('upiId')}
                placeholder="e.g. name@upi" />
            </div>
          )}

          {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
          <button type="submit" className={styles.saveBtn} disabled={loading}>
            {loading ? 'Saving…' : editing ? 'Save Changes' : 'Add Account'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Credit Card progress bar ──────────────────────────────────────────────
function CreditBar({ used, limit, color }) {
  if (!limit) return null
  const pct     = Math.min(100, (used / limit) * 100)
  const barColor = pct > 80 ? '#f76f6f' : pct > 50 ? '#fbbf24' : color
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: 'var(--text-2)', marginBottom: 4 }}>
        <span>Used: {fmt(used)}</span>
        <span>Limit: {fmt(limit)}</span>
      </div>
      <div style={{ height: 5, borderRadius: 4, background: 'var(--surface-2)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width .5s' }} />
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>
        {fmt(limit - used)} available · {pct.toFixed(0)}% utilisation
      </p>
    </div>
  )
}

// ── Balance Edit inline ───────────────────────────────────────────────────
function BalanceEdit({ account, onSaved }) {
  const [val,     setVal]     = useState(account.balance)
  const [loading, setLoading] = useState(false)

  async function save() {
    setLoading(true)
    try {
      const res  = await authFetch(`${API}/accounts/${account._id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: parseFloat(val) || 0 }),
      })
      const data = await res.json()
      if (data.success) onSaved()
    } catch {}
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
      <input
        type="number" value={val} onChange={e => setVal(e.target.value)}
        style={{ ...inp, padding: '6px 10px', fontSize: 13, flex: 1 }}
        step="0.01"
      />
      <button onClick={save} disabled={loading} style={{
        background: 'var(--accent)', color: '#fff', border: 'none',
        borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'var(--font)',
      }}>
        {loading ? '…' : '✓'}
      </button>
    </div>
  )
}

// ── Account Card ──────────────────────────────────────────────────────────
function AccountCard({ account, onEdit, onDelete, onRefresh, animDelay }) {
  const [editBalance, setEditBalance] = useState(false)
  const meta = TYPE_META[account.type] || TYPE_META.Bank

  return (
    <div
      className={`anim-fade-up anim-delay-${animDelay}`}
      style={{
        background: 'var(--surface)', border: `1px solid var(--border)`,
        borderRadius: 'var(--radius)', padding: '1.3rem 1.4rem',
        display: 'flex', flexDirection: 'column', gap: 0,
        borderTop: `3px solid ${account.color || meta.color}`,
        transition: 'transform .2s',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      {/* Card header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 11,
            background: (account.color || meta.color) + '22',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
          }}>{account.icon || meta.icon}</div>
          <div>
            <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{account.name}</p>
            <p style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 1 }}>
              {account.type}
              {account.bankName && ` · ${account.bankName}`}
              {account.upiId    && ` · ${account.upiId}`}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onEdit(account)} style={{
            background: 'none', border: 'none', color: 'var(--text-3)',
            cursor: 'pointer', fontSize: 15, padding: 4,
          }} title="Edit">✏️</button>
          <button onClick={() => onDelete(account)} style={{
            background: 'none', border: 'none', color: 'var(--text-3)',
            cursor: 'pointer', fontSize: 15, padding: 4,
          }} title="Delete">🗑</button>
        </div>
      </div>

      {/* Balance */}
      <div style={{ marginTop: '1rem' }}>
        <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {account.type === 'Credit Card' ? 'Outstanding' : 'Balance'}
        </p>
        <p style={{
          fontSize: '1.65rem', fontWeight: 800, fontFamily: 'var(--mono)',
          letterSpacing: -1, marginTop: 3,
          color: account.type === 'Credit Card'
            ? (account.balance > 0 ? 'var(--red)' : 'var(--green)')
            : 'var(--text)',
        }}>
          {account.type === 'Credit Card' && account.balance > 0 ? '−' : ''}{fmt(account.balance)}
        </p>
      </div>

      {/* Credit card bar */}
      {account.type === 'Credit Card' && (
        <CreditBar used={account.balance} limit={account.creditLimit} color={account.color || meta.color} />
      )}

      {/* Inline balance edit */}
      {editBalance ? (
        <BalanceEdit account={account} onSaved={() => { setEditBalance(false); onRefresh() }} />
      ) : (
        <button
          onClick={() => setEditBalance(true)}
          style={{
            marginTop: 12, background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600,
            color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font)',
            alignSelf: 'flex-start',
          }}
        >
          ✎ Update Balance
        </button>
      )}
    </div>
  )
}

// ── Main WalletView ───────────────────────────────────────────────────────
export default function WalletView({ transactions, summary, categories = [] }) {
  const [accounts,   setAccounts]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [showModal,  setShowModal]  = useState(false)
  const [editing,    setEditing]    = useState(null)

  const fetchAccounts = useCallback(async () => {
    try {
      const res  = await authFetch(`${API}/accounts`)
      const data = await res.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  async function handleDelete(account) {
    if (!confirm(`Delete "${account.name}"?`)) return
    try {
      await authFetch(`${API}/accounts/${account._id}`, { method: 'DELETE' })
      fetchAccounts()
    } catch {}
  }

  // Derived totals
  const totals = useMemo(() => {
    const byType = {}
    ACCOUNT_TYPES.forEach(t => { byType[t.type] = 0 })
    accounts.forEach(a => {
      if (a.type === 'Credit Card') return  // exclude CC outstanding from net
      byType[a.type] = (byType[a.type] || 0) + a.balance
    })
    const netAssets = accounts
      .filter(a => a.type !== 'Credit Card')
      .reduce((s, a) => s + a.balance, 0)
    const ccDebt = accounts
      .filter(a => a.type === 'Credit Card')
      .reduce((s, a) => s + a.balance, 0)
    return { byType, netAssets, ccDebt }
  }, [accounts])

  // Spending pie from transactions
  const catMap = {}
  categories.forEach(c => { catMap[c.name] = c })

  const catSpend = useMemo(() => {
    const map = {}
    transactions.filter(t => t.amount < 0).forEach(t => {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [transactions])

  const pieColors = catSpend.map((c, i) => {
    const cat = catMap[c.name]
    return cat?.color || ['#4f8ef7','#f76f6f','#3dd68c','#fbbf24','#a78bfa','#fb7185','#34d399'][i % 7]
  })

  // Group accounts by type for the summary strip
  const grouped = ACCOUNT_TYPES.map(t => ({
    ...t,
    accounts: accounts.filter(a => a.type === t.type),
    total:    accounts.filter(a => a.type === t.type).reduce((s, a) => s + a.balance, 0),
  })).filter(g => g.accounts.length > 0)

  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--text)' }}>Wallet</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} · Net assets {fmt(totals.netAssets)}
          </p>
        </div>
        <button className={styles.addBtn} onClick={() => { setEditing(null); setShowModal(true) }}>
          + Add Account
        </button>
      </div>

      {/* ── Summary Strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        {/* Net Assets */}
        <div style={{
          background: 'linear-gradient(135deg,#1b2a5e,#152244)',
          border: '1px solid rgba(79,142,247,.25)',
          borderRadius: 'var(--radius)', padding: '1.2rem 1.4rem',
        }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Net Assets</p>
          <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--mono)', marginTop: 6 }}>
            {fmt(totals.netAssets)}
          </p>
          {totals.ccDebt > 0 && (
            <p style={{ fontSize: 11.5, color: '#f76f6f', marginTop: 4 }}>
              CC outstanding: {fmt(totals.ccDebt)}
            </p>
          )}
        </div>

        {/* Per-type totals */}
        {grouped.map(g => (
          <div key={g.type} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '1.2rem 1.4rem',
            borderTop: `3px solid ${g.color}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{
                width: 30, height: 30, borderRadius: 8, fontSize: 16,
                background: g.color + '22',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{g.icon}</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>{g.label}</p>
            </div>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: g.type === 'Credit Card' && g.total > 0 ? 'var(--red)' : 'var(--text)', fontFamily: 'var(--mono)' }}>
              {g.type === 'Credit Card' && g.total > 0 ? '−' : ''}{fmt(g.total)}
            </p>
            <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 3 }}>
              {g.accounts.length} account{g.accounts.length !== 1 ? 's' : ''}
            </p>
          </div>
        ))}

        {/* Empty state strip */}
        {accounts.length === 0 && !loading && (
          <div style={{
            gridColumn: '1/-1', textAlign: 'center', padding: '2rem',
            color: 'var(--text-2)', background: 'var(--surface)',
            borderRadius: 'var(--radius)', border: '1px dashed var(--border)',
          }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>💳</p>
            <p style={{ fontWeight: 600 }}>No accounts yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Click "Add Account" to track your cash, bank, UPI, and credit cards.</p>
          </div>
        )}
      </div>

      {/* ── Account Cards Grid ── */}
      {accounts.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '1rem' }}>
          {loading
            ? [1,2,3].map(i => (
                <div key={i} style={{ height: 160, background: 'var(--surface)', borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)', opacity: 0.5 }} />
              ))
            : accounts.map((a, i) => (
                <AccountCard
                  key={a._id}
                  account={a}
                  animDelay={Math.min(i + 1, 4)}
                  onEdit={acc => { setEditing(acc); setShowModal(true) }}
                  onDelete={handleDelete}
                  onRefresh={fetchAccounts}
                />
              ))
          }
        </div>
      )}

      {/* ── Spending Breakdown (from transactions) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Pie */}
        <div className={styles.chartBox}>
          <p className={styles.sectionTitle}>Spending by Category</p>
          {catSpend.length === 0 ? (
            <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 8, padding: '1rem 0' }}>No expense data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={catSpend} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} innerRadius={40}
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {catSpend.map((entry, i) => (
                    <Cell key={entry.name} fill={pieColors[i]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={v => fmt(v)}
                  contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Category Bars */}
        <div className={styles.chartBox}>
          <p className={styles.sectionTitle}>Category Breakdown</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {catSpend.length === 0 ? (
              <p style={{ color: 'var(--text-2)', fontSize: 13 }}>No expense data yet.</p>
            ) : (
              [...catSpend].sort((a, b) => b.value - a.value).map((c, i) => {
                const total = catSpend.reduce((s, x) => s + x.value, 0)
                const pct   = ((c.value / total) * 100).toFixed(1)
                const cat   = catMap[c.name]
                const color = cat?.color || pieColors[catSpend.findIndex(x => x.name === c.name)] || '#94a3b8'
                return (
                  <div key={c.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{cat?.icon || '💳'}</span> {c.name}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>
                        {fmt(c.value)}
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width .4s' }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Account Summary (transaction-based) ── */}
      <div className={styles.txSection} style={{ padding: '1.2rem 1.4rem' }}>
        <p className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>Transaction Summary</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { label: 'Total Income',  value: summary.income,   color: 'var(--accent)'  },
            { label: 'Total Spent',   value: summary.expenses, color: 'var(--danger)'  },
            { label: 'Net Balance',   value: summary.balance,  color: summary.balance >= 0 ? 'var(--green)' : 'var(--red)' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center', padding: '0.8rem', background: 'var(--surface-2)', borderRadius: 10 }}>
              <p style={{ fontSize: 11.5, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{item.label}</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: item.color, fontFamily: 'var(--mono)' }}>{fmt(item.value)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <AccountModal
          editing={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={fetchAccounts}
        />
      )}
    </div>
  )
}