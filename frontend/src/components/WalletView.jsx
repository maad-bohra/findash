import { useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import styles from './Dashboard.module.css'

const CAT_ICONS  = { Food: '🍜', Transport: '🚗', Entertainment: '🎬', Income: '💼', Bills: '📋' }
const CAT_COLORS = { Food: '#f97316', Transport: '#60a5fa', Entertainment: '#a78bfa', Income: '#6ee7b7', Bills: '#fbbf24' }

function fmt(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Math.abs(n))
}

export default function WalletView({ transactions, summary }) {
  const [wallets, setWallets] = useState([
    { id: 1, name: 'Primary Account', type: 'Savings',    icon: '🏦', color: '#6ee7b7' },
    { id: 2, name: 'Cash Wallet',     type: 'Cash',       icon: '💵', color: '#60a5fa' },
    { id: 3, name: 'Credit Card',     type: 'Credit',     icon: '💳', color: '#a78bfa' },
  ])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState('Savings')

  const catSpend = useMemo(() => {
    const map = {}
    transactions.filter(t => t.amount < 0).forEach(t => {
      map[t.category] = (map[t.category] || 0) + Math.abs(t.amount)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [transactions])

  function addWallet(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const colors = ['#f97316', '#fbbf24', '#34d399', '#f472b6']
    setWallets(w => [...w, {
      id: Date.now(), name: newName, type: newType,
      icon: '🏧', color: colors[w.length % colors.length],
    }])
    setNewName('')
    setShowAdd(false)
  }

  function removeWallet(id) {
    if (wallets.length <= 1) return alert('Keep at least one wallet.')
    setWallets(w => w.filter(x => x.id !== id))
  }

  const inputStyle = {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 12px', color: 'var(--text)',
    fontSize: 13, outline: 'none', fontFamily: 'var(--font)', width: '100%',
  }

  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--text)' }}>Wallet</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>Manage your accounts & spending breakdown</p>
        </div>
        <button className={styles.addBtn} onClick={() => setShowAdd(s => !s)}>+ Add Wallet</button>
      </div>

      {/* Add Wallet Form */}
      {showAdd && (
        <div className={styles.txSection} style={{ padding: '1.2rem 1.4rem' }}>
          <form onSubmit={addWallet} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Wallet Name</label>
              <input
                style={inputStyle}
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Emergency Fund"
                required
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Type</label>
              <select style={{ ...inputStyle, width: 'auto' }} value={newType} onChange={e => setNewType(e.target.value)}>
                {['Savings', 'Cash', 'Credit', 'Investment'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <button type="submit" className={styles.saveBtn} style={{ width: 'auto', padding: '9px 20px' }}>Add</button>
            <button type="button" onClick={() => setShowAdd(false)} className={styles.delBtn} style={{ padding: '9px 14px' }}>Cancel</button>
          </form>
        </div>
      )}

      {/* Wallet Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {wallets.map((w, i) => {
          const share = summary.balance / wallets.length
          return (
            <div
              key={w.id}
              className={`${styles.card} anim-fade-up anim-delay-${i + 1}`}
              style={{ '--card-accent': w.color }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: w.color + '22', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 20,
                  }}>
                    {w.icon}
                  </span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{w.name}</p>
                    <p style={{ fontSize: 11.5, color: 'var(--text-2)', marginTop: 1 }}>{w.type}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeWallet(w.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                >×</button>
              </div>
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Balance</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--mono)', letterSpacing: -1, marginTop: 2 }}>
                  {fmt(Math.max(0, share))}
                </p>
              </div>
              <div style={{ marginTop: 10, height: 3, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, Math.abs((share / (summary.income || 1)) * 100))}%`,
                  background: w.color, borderRadius: 3,
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Spending Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Pie Chart */}
        <div className={styles.chartBox}>
          <p className={styles.sectionTitle}>Spending by Category</p>
          {catSpend.length === 0 ? (
            <p style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 8 }}>No expense data yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={catSpend} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {catSpend.map(entry => (
                    <Cell key={entry.name} fill={CAT_COLORS[entry.name] || '#94a3b8'} />
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
              [...catSpend].sort((a, b) => b.value - a.value).map(c => {
                const total = catSpend.reduce((s, x) => s + x.value, 0)
                const pct   = ((c.value / total) * 100).toFixed(1)
                return (
                  <div key={c.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>
                        {CAT_ICONS[c.name] || '💳'} {c.name}
                      </span>
                      <span style={{ fontSize: 13, color: 'var(--text-2)', fontFamily: 'var(--mono)' }}>
                        {fmt(c.value)}
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--surface-2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: CAT_COLORS[c.name] || '#94a3b8',
                        borderRadius: 3, transition: 'width .4s',
                      }} />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Account Summary */}
      <div className={styles.txSection} style={{ padding: '1.2rem 1.4rem' }}>
        <p className={styles.sectionTitle} style={{ marginBottom: '1rem' }}>Account Summary</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          {[
            { label: 'Total Income', value: summary.income,   color: 'var(--accent)'   },
            { label: 'Total Spent',  value: summary.expenses, color: 'var(--danger)'   },
            { label: 'Net Balance',  value: summary.balance,  color: 'var(--accent-2)' },
          ].map(item => (
            <div key={item.label} style={{ textAlign: 'center', padding: '0.8rem', background: 'var(--surface-2)', borderRadius: 10 }}>
              <p style={{ fontSize: 11.5, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{item.label}</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 800, color: item.color, fontFamily: 'var(--mono)' }}>{fmt(item.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}