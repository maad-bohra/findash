import { authFetch } from '../utils/api.js'
import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import styles from './Dashboard.module.css'
import TransactionsView from './TransactionsView.jsx'
import WalletView from './WalletView.jsx'
import logo from '../assets/logo.png'
import ProfileSettings from './ProfileSettings.jsx'
import AdminView from './AdminView.jsx'

const API = '/api'

const EMOJI_OPTIONS = [
  '💳','🍜','🚗','🎬','💼','📋','🏠','✈️','🛒','💊',
  '🎓','💪','🐾','🎮','📱','☕','🎁','🔧','🌿','💰',
]

const COLOR_OPTIONS = [
  '#4f8ef7','#f76f6f','#3dd68c','#f5a623','#a78bfa',
  '#fb7185','#34d399','#60a5fa','#fbbf24','#e879f9',
]

function fmt(n, currency = true) {
  return new Intl.NumberFormat('en-IN', {
    style: currency ? 'currency' : 'decimal',
    currency: 'INR', maximumFractionDigits: 0,
  }).format(Math.abs(n))
}

function buildChartData(txns) {
  const map = {}
  txns.forEach(t => {
    const d   = new Date(t.date)
    const key = isNaN(d)
      ? t.date
      : d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
    if (!map[key]) map[key] = { month: key, Income: 0, Expenses: 0, Net: 0 }
    if (t.amount > 0) { map[key].Income += t.amount; map[key].Net += t.amount }
    else              { map[key].Expenses += Math.abs(t.amount); map[key].Net -= Math.abs(t.amount) }
  })
  return Object.values(map)
}

function trendInfo(current, previous, invertColor = false) {
  if (previous === 0) return { text: 'No prior data', good: null }
  const pct  = (((current - previous) / previous) * 100).toFixed(1)
  const up   = parseFloat(pct) >= 0
  const good = invertColor ? !up : up
  return { text: `${up ? '▲' : '▼'} ${Math.abs(pct)}%`, good }
}

function calcTrends(txns) {
  const now       = new Date()
  const thisMonth = now.getMonth()
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const filter    = m => txns.filter(t => new Date(t.date).getMonth() === m)
  const income    = arr => arr.filter(t => t.amount > 0).reduce((a,t) => a + t.amount, 0)
  const expenses  = arr => arr.filter(t => t.amount < 0).reduce((a,t) => a + Math.abs(t.amount), 0)
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

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background:'var(--surface-2)', border:'1px solid var(--border)',
      borderRadius:12, padding:'10px 14px', fontSize:13,
      boxShadow:'0 8px 24px rgba(0,0,0,.3)',
    }}>
      <p style={{ color:'var(--text-2)', marginBottom:6, fontWeight:600 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color:p.color, fontWeight:600 }}>
          {p.dataKey}: {fmt(p.value)}
        </p>
      ))}
    </div>
  )
}

function StatusBadge({ status }) {
  const cls = status === 'Completed' ? styles.completed
            : status === 'Failed'    ? styles.failed
            :                          styles.pending
  return <span className={`${styles.statusBadge} ${cls}`}>{status}</span>
}

// ── Add Transaction Modal ─────────────────────────────────────────────────
function Modal({ onClose, onSaved, categories }) {
  const defaultCategory = categories.length > 0 ? categories[0].name : ''
  const [form, setForm] = useState({
    type:'expense', name:'', amount:'', category: defaultCategory,
    status:'Pending', date: new Date().toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const update = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    let amount = parseFloat(form.amount)
    if (form.type === 'expense') amount = -Math.abs(amount)
    else                         amount =  Math.abs(amount)
    try {
      const res  = await authFetch(`${API}/transactions`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        // Fix #4: send raw ISO date (YYYY-MM-DD) — backend's new Date() parses this reliably
        body: JSON.stringify({ name:form.name, date:form.date, category:form.category, status:form.status, amount }),
      })
      const data = await res.json()
      if (data.success) { onSaved(); onClose() }
      else setError(data.error || 'Failed to save')
    } catch { setError('Cannot reach server.') }
    finally  { setLoading(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} anim-scale-in`}>
        <div className={styles.modalHeader}>
          <h3>Add Transaction</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
            <label>Type</label>
            <div className={styles.typeToggle}>
              <button
                type="button"
                className={`${styles.typeBtn} ${form.type==='expense' ? styles.typeBtnActive : ''}`}
                onClick={() => setForm(f => ({...f, type:'expense'}))}
              >− Expense</button>
              <button
                type="button"
                className={`${styles.typeBtn} ${styles.typeBtnIncome} ${form.type==='income' ? styles.typeBtnActive : ''}`}
                onClick={() => setForm(f => ({...f, type:'income'}))}
              >+ Income</button>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column' }}>
            <label>Description</label>
            <input type="text" value={form.name} onChange={update('name')} placeholder="e.g. Grocery Store" required />
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <label>Amount (₹)</label>
            <input type="number" value={form.amount} onChange={update('amount')} step="0.01" placeholder="0.00" required />
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <label>Category</label>
            {categories.length === 0 ? (
              <p style={{ fontSize:13, color:'var(--danger)' }}>
                No categories yet. Create one in Settings → Categories.
              </p>
            ) : (
              <select value={form.category} onChange={update('category')}>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <label>Status</label>
            <select value={form.status} onChange={update('status')}>
              <option>Pending</option>
              <option>Completed</option>
              <option>Failed</option>
            </select>
          </div>
          <div style={{ display:'flex', flexDirection:'column' }}>
            <label>Date</label>
            <input type="date" value={form.date} onChange={update('date')} required />
          </div>
          {error && <p style={{ color:'var(--danger)', fontSize:13 }}>{error}</p>}
          <button type="submit" className={styles.saveBtn} disabled={loading || categories.length === 0}>
            {loading ? 'Saving…' : 'Save Transaction'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Category Manager ───────────────────────────────────────────────────────
function CategoryManager({ categories, onRefresh }) {
  const [name,    setName]    = useState('')
  const [icon,    setIcon]    = useState('💳')
  const [color,   setColor]   = useState('#4f8ef7')
  const [loading, setLoading] = useState(false)
  const [deleting,setDeleting]= useState(null)
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  async function handleCreate(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    if (!name.trim()) return setError('Name is required')
    setLoading(true)
    try {
      const res  = await authFetch(`${API}/categories`, {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ name: name.trim(), icon, color }),
      })
      const data = await res.json()
      if (data.success) {
        setName(''); setIcon('💳'); setColor('#4f8ef7')
        setSuccess('Category created!')
        onRefresh()
        setTimeout(() => setSuccess(''), 2500)
      } else {
        setError(data.error || 'Failed to create')
      }
    } catch { setError('Cannot reach server.') }
    finally  { setLoading(false) }
  }

  async function handleDelete(id, catName) {
    if (!confirm(`Delete category "${catName}"?`)) return
    setDeleting(id); setError('')
    try {
      const res  = await authFetch(`${API}/categories/${id}`, { method:'DELETE' })
      const data = await res.json()
      if (data.success) onRefresh()
      else setError(data.error || 'Failed to delete')
    } catch { setError('Cannot reach server.') }
    finally  { setDeleting(null) }
  }

  const inputStyle = {
    background:'var(--surface-2)', border:'1px solid var(--border)',
    borderRadius:8, padding:'8px 12px', color:'var(--text)',
    fontSize:13, outline:'none', fontFamily:'var(--font)', width:'100%',
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.4rem' }}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:'var(--radius)', padding:'1.2rem 1.4rem' }}>
        <p style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:'1rem' }}>New Category</p>
        <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <div>
            <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:4 }}>Name</label>
            <input style={inputStyle} placeholder="e.g. Healthcare" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Icon</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {EMOJI_OPTIONS.map(em => (
                <button key={em} type="button" onClick={() => setIcon(em)} style={{
                  width:36, height:36, borderRadius:8, fontSize:18, cursor:'pointer',
                  border: icon === em ? '2px solid var(--accent)' : '1px solid var(--border)',
                  background: icon === em ? 'rgba(79,142,247,.15)' : 'var(--surface-2)',
                }}>{em}</button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize:12, color:'var(--text-2)', display:'block', marginBottom:6 }}>Color</label>
            <div style={{ display:'flex', gap:8 }}>
              {COLOR_OPTIONS.map(col => (
                <button key={col} type="button" onClick={() => setColor(col)} style={{
                  width:28, height:28, borderRadius:'50%', background:col, cursor:'pointer',
                  border: color === col ? '3px solid var(--text)' : '2px solid transparent',
                  flexShrink:0,
                }} />
              ))}
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, fontSize:18, background: color + '26',
              display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</div>
            <span style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{name || 'Preview'}</span>
          </div>
          {error   && <p style={{ fontSize:13, color:'var(--danger)' }}>{error}</p>}
          {success && <p style={{ fontSize:13, color:'var(--green)'  }}>{success}</p>}
          <button type="submit" disabled={loading} style={{
            background:'var(--accent)', color:'#fff', border:'none',
            borderRadius:9, padding:'9px 20px', fontSize:13, fontWeight:700,
            cursor:'pointer', fontFamily:'var(--font)', alignSelf:'flex-start',
          }}>{loading ? 'Creating…' : '+ Create Category'}</button>
        </form>
      </div>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:'var(--radius)', overflow:'hidden' }}>
        <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:1,
          color:'var(--text-3)', padding:'0.9rem 1.4rem', borderBottom:'1px solid var(--border)' }}>
          Existing Categories ({categories.length})
        </p>
        {categories.length === 0 ? (
          <p style={{ color:'var(--text-2)', padding:'1.5rem', textAlign:'center', fontSize:13 }}>No categories yet.</p>
        ) : categories.map(c => (
          <div key={c._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
            padding:'0.85rem 1.4rem', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:34, height:34, borderRadius:8, fontSize:16, background: (c.color||'#94a3b8')+'26',
                display:'flex', alignItems:'center', justifyContent:'center' }}>{c.icon||'💳'}</div>
              <div>
                <p style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{c.name}</p>
                <p style={{ fontSize:11.5, color:'var(--text-3)', marginTop:1 }}>{c.color}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(c._id, c.name)} disabled={deleting===c._id} style={{
              background:'var(--red-soft)', color:'var(--danger)', border:'1px solid rgba(247,111,111,.2)',
              padding:'6px 14px', borderRadius:8, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)',
            }}>{deleting===c._id ? '…' : '🗑 Delete'}</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Settings ──────────────────────────────────────────────────────────────
function SettingsView({ user, theme, onToggleTheme, onLogout, categories, onRefreshCategories, onUpdateUser }) {
  const isDark = theme === 'dark'
  const [settingsTab, setSettingsTab] = useState('profile')

  const Row = ({ title, sub, children }) => (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'1.1rem 1.4rem', gap:'1rem', borderBottom:'1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize:14, fontWeight:600, color:'var(--text)' }}>{title}</p>
        <p style={{ fontSize:12.5, color:'var(--text-2)', marginTop:2 }}>{sub}</p>
      </div>
      {children}
    </div>
  )
  const Section = ({ label, children }) => (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:1,
        color:'var(--text-3)', paddingLeft:2 }}>{label}</p>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:'var(--radius)', overflow:'hidden' }}>{children}</div>
    </div>
  )

  const tabStyle = active => ({
    padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer',
    fontFamily:'var(--font)', fontSize:13, fontWeight:600,
    background: active ? 'var(--accent)' : 'var(--surface-2)',
    color: active ? '#fff' : 'var(--text-2)',
  })

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.8rem', maxWidth:600 }} className="anim-fade-up">
      <h2 style={{ fontSize:'1.4rem', fontWeight:800, letterSpacing:'-0.6px' }}>Settings</h2>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <button style={tabStyle(settingsTab==='profile')}    onClick={() => setSettingsTab('profile')}>👤 Profile</button>
        <button style={tabStyle(settingsTab==='account')}    onClick={() => setSettingsTab('account')}>⚙ Account</button>
        <button style={tabStyle(settingsTab==='categories')} onClick={() => setSettingsTab('categories')}>
          🏷 Categories {categories.length > 0 && `(${categories.length})`}
        </button>
      </div>

      {settingsTab === 'profile' && <ProfileSettings user={user} onUpdateUser={onUpdateUser} />}

      {settingsTab === 'account' && (
        <>
          <Section label="Account">
            <div style={{ display:'flex', alignItems:'center', gap:14, padding:'1.2rem 1.4rem' }}>
              {user.avatar ? (
                <img src={user.avatar} alt="avatar" style={{ width:48, height:48, borderRadius:'50%',
                  objectFit:'cover', border:'2px solid var(--accent)', flexShrink:0 }} />
              ) : (
                <div style={{ width:48, height:48, borderRadius:'50%',
                  background:'linear-gradient(135deg,#4f8ef7,#a78bfa)', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:800, fontSize:15, flexShrink:0 }}>
                  {(user.username||'U').slice(0,2).toUpperCase()}
                </div>
              )}
              <div>
                <p style={{ fontWeight:700, fontSize:15 }}>{user.username}</p>
                <p style={{ fontSize:13, color:'var(--text-2)', marginTop:2 }}>{user.email}</p>
              </div>
            </div>
          </Section>
          <Section label="Appearance">
            <Row title="Theme" sub="Switch between dark and light mode">
              <button onClick={onToggleTheme} style={{ display:'flex', background:'var(--surface-2)',
                border:'1px solid var(--border)', borderRadius:30, padding:3, gap:2, cursor:'pointer', flexShrink:0 }}>
                {['🌙 Dark','☀️ Light'].map((label,i) => {
                  const active = (i===0 && isDark)||(i===1 && !isDark)
                  return (
                    <span key={label} style={{ padding:'6px 14px', borderRadius:24, fontSize:12.5,
                      fontWeight:600, whiteSpace:'nowrap', fontFamily:'var(--font)',
                      background: active ? 'var(--accent)' : 'transparent',
                      color: active ? '#fff' : 'var(--text-2)',
                      transition:'background .2s, color .2s' }}>{label}</span>
                  )
                })}
              </button>
            </Row>
          </Section>
          <Section label="Session">
            <Row title="Sign out" sub="You will be returned to the login screen">
              <button onClick={onLogout} style={{ background:'var(--red-soft)', color:'var(--danger)',
                border:'1px solid rgba(247,111,111,.2)', padding:'9px 20px', borderRadius:9,
                fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'var(--font)', flexShrink:0 }}>
                ⎋ Sign Out
              </button>
            </Row>
          </Section>
        </>
      )}
      {settingsTab === 'categories' && <CategoryManager categories={categories} onRefresh={onRefreshCategories} />}
    </div>
  )
}

// ── Analytics View ────────────────────────────────────────────────────────
function AnalyticsView({ transactions, categories }) {
  const catMap = {}
  categories.forEach(c => { catMap[c.name] = c })

  const cats = {}
  transactions.forEach(t => {
    if (!cats[t.category]) cats[t.category] = 0
    cats[t.category] += Math.abs(t.amount)
  })
  const total  = Object.values(cats).reduce((a,v) => a+v, 0) || 1
  const sorted = Object.entries(cats).sort((a,b) => b[1]-a[1])

  // Monthly net savings data
  const chartData = buildChartData(transactions)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1.6rem' }} className="anim-fade-up">
      <h2 style={{ fontSize:'1.4rem', fontWeight:800, letterSpacing:'-0.6px' }}>Analytics</h2>

      {/* Monthly Net Savings */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:'var(--radius)', padding:'1.5rem' }}>
        <p className={styles.sectionTitle} style={{ marginBottom:'1rem' }}>Monthly Net Savings</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData} margin={{ top:5, right:10, left:0, bottom:5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill:'var(--text-2)', fontSize:12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} tick={{ fill:'var(--text-2)', fontSize:12 }} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="Net" fill="#4f8ef7" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Spending by Category */}
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)',
        borderRadius:'var(--radius)', padding:'1.5rem' }}>
        <p className={styles.sectionTitle}>Spending by Category</p>
        <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:8 }}>
          {sorted.map(([cat, val]) => {
            const pct = ((val/total)*100).toFixed(1)
            const catData = catMap[cat]
            const color   = catData?.color  || '#94a3b8'
            const icon    = catData?.icon   || '💳'
            return (
              <div key={cat}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:13.5, fontWeight:600, color:'var(--text)', display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ width:28, height:28, borderRadius:8, background:color+'26',
                      display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{icon}</span>
                    {cat}
                  </span>
                  <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>
                    {fmt(val)} <span style={{ color:'var(--text-2)', fontWeight:500 }}>({pct}%)</span>
                  </span>
                </div>
                <div style={{ height:6, borderRadius:4, background:'var(--surface-2)', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${pct}%`, borderRadius:4, background:color, transition:'width .6s ease' }} />
                </div>
              </div>
            )
          })}
          {sorted.length === 0 && (
            <p style={{ color:'var(--text-2)', textAlign:'center', padding:'2rem' }}>No data yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Budget Overview ───────────────────────────────────────────────────────
function BudgetOverview({ transactions, categories }) {
  // Simple budget estimates (20% of income per category or flat)
  const income = transactions.filter(t => t.amount > 0).reduce((a,t) => a + t.amount, 0)
  const budget = income * 0.8 || 50000 // 80% of income as total budget

  const catMap = {}
  categories.forEach(c => { catMap[c.name] = c })

  // Get spending per category (expenses only)
  const spending = {}
  transactions.filter(t => t.amount < 0).forEach(t => {
    if (!spending[t.category]) spending[t.category] = 0
    spending[t.category] += Math.abs(t.amount)
  })

  const totalSpent = Object.values(spending).reduce((a,v) => a+v, 0)
  const overallPct = Math.min((totalSpent / budget) * 100, 100)
  const overallColor = overallPct > 90 ? '#f76f6f' : overallPct > 70 ? '#f5a623' : '#3dd68c'

  return (
    <div className={styles.budgetSection}>
      <div className={styles.sectionHeader}>
        <p className={styles.sectionTitle}>Budget Overview</p>
        <span style={{ fontSize:12.5, color:'var(--text-2)', fontWeight:600 }}>
          {fmt(totalSpent)} / {fmt(budget)} spent
        </span>
      </div>
      {/* Overall progress */}
      <div style={{ marginBottom:'1.2rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>Overall Budget</span>
          <span style={{ fontSize:13, fontWeight:700, color: overallColor }}>{overallPct.toFixed(0)}%</span>
        </div>
        <div className={styles.budgetBar}>
          <div className={styles.budgetBarFill} style={{ width:`${overallPct}%`, background: overallColor }} />
        </div>
      </div>
      {/* Per category */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {Object.entries(spending).slice(0,5).map(([cat, spent]) => {
          const catBudget = budget / Math.max(Object.keys(spending).length, 1)
          const pct = Math.min((spent / catBudget) * 100, 100)
          const col = catMap[cat]?.color || '#94a3b8'
          const icon = catMap[cat]?.icon || '💳'
          const barColor = pct > 90 ? '#f76f6f' : pct > 70 ? '#f5a623' : col
          return (
            <div key={cat}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontSize:12.5, color:'var(--text-2)', display:'flex', alignItems:'center', gap:6 }}>
                  <span style={{ fontSize:13 }}>{icon}</span> {cat}
                </span>
                <span style={{ fontSize:12, color:'var(--text-3)' }}>{fmt(spent)}</span>
              </div>
              <div className={styles.budgetBar}>
                <div className={styles.budgetBarFill} style={{ width:`${pct}%`, background: barColor }} />
              </div>
            </div>
          )
        })}
        {Object.keys(spending).length === 0 && (
          <p style={{ color:'var(--text-3)', fontSize:13, textAlign:'center', padding:'0.5rem' }}>No expenses recorded yet.</p>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard({ user, theme, onToggleTheme, onLogout, onUpdateUser }) {
  const [transactions, setTransactions] = useState([])
  const [summary,      setSummary]      = useState({ balance:0, income:0, expenses:0 })
  const [trends,       setTrends]       = useState({})
  const [chartData,    setChartData]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [activeNav,    setActiveNav]    = useState('Dashboard')
  const [deleting,     setDeleting]     = useState(null)
  const [categories,   setCategories]   = useState([])
  const [sidebarOpen,  setSidebarOpen]  = useState(true)
  const [chartMode,    setChartMode]    = useState('area') // 'area' | 'bar'
  const [searchQuery,  setSearchQuery]  = useState('')

  const NAV = [
    { icon: '⊞',  label: 'Dashboard'    },
    { icon: '↕',  label: 'Transactions' },
    { icon: '◈',  label: 'Wallet'       },
    { icon: '∿',  label: 'Analytics'    },
    { icon: '⚙',  label: 'Settings'     },
    ...(user.isAdmin ? [{ icon: '🛡', label: 'Admin' }] : []),
  ]

  const fetchCategories = useCallback(async () => {
    try {
      const res  = await authFetch(`${API}/categories`)
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
    }
  }, [])

  const loadAll = useCallback(async () => {
    try {
      const [txRes, sumRes] = await Promise.all([
        authFetch(`${API}/transactions`),
        authFetch(`${API}/summary`),
      ])
      const txns = await txRes.json()
      const sum  = await sumRes.json()
      const safeTxns = Array.isArray(txns) ? txns : []
      setTransactions(safeTxns)
      setSummary(sum?.balance !== undefined ? sum : { balance:0, income:0, expenses:0 })
      setChartData(buildChartData(safeTxns))
      setTrends(calcTrends(safeTxns))
    } catch (err) {
      console.error('Load failed:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
    loadAll()
  }, [fetchCategories, loadAll])

  async function handleDelete(id) {
    if (!confirm('Delete this transaction?')) return
    setDeleting(id)
    try {
      const res  = await authFetch(`${API}/transactions/${id}`, { method:'DELETE' })
      const data = await res.json()
      if (data.success) loadAll()
      else alert('Error: ' + data.message)
    } catch { alert('Server error.') }
    finally  { setDeleting(null) }
  }

  const initials = (user.username||'U').slice(0,2).toUpperCase()
  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const catMap = {}
  categories.forEach(c => { catMap[c.name] = c })

  // Savings rate
  const savingsRate = summary.income > 0
    ? (((summary.income - summary.expenses) / summary.income) * 100).toFixed(1)
    : '0.0'

  // Filtered recent transactions
  const filteredTxns = searchQuery.trim()
    ? transactions.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : transactions

  // Fix #1 & #2: Sub-view header with hamburger so user can always reopen the sidebar
  function SubViewHeader({ title }) {
    return (
      <header className={`${styles.topBar} anim-fade-up`} style={{ marginBottom: '1.2rem' }}>
        <div className={styles.topBarLeft}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(true)}
            title="Open menu"
          >
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
            <span className={styles.hamburgerLine} />
          </button>
          <h1 className={styles.greeting}>{title}</h1>
        </div>
        <div className={styles.topBarRight}>
          <div className={styles.userChip} onClick={() => setActiveNav('Settings')} style={{ cursor:'pointer' }} title="Go to Profile Settings">
            {user.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width:34, height:34, borderRadius:'50%',
                objectFit:'cover', border:'2px solid var(--accent)', flexShrink:0 }} />
            ) : (
              <div className={styles.avatar}>{(user.username||'U').slice(0,2).toUpperCase()}</div>
            )}
            <span className={styles.userEmail}>{user.username || user.email.split('@')[0]}</span>
          </div>
        </div>
      </header>
    )
  }

  function renderMain() {
    switch (activeNav) {
      case 'Transactions':
        return (
          <>
            <SubViewHeader title="Transactions" />
            <TransactionsView
              transactions={transactions}
              onDelete={handleDelete}
              onAdd={() => setShowModal(true)}
              deleting={deleting}
              categories={categories}
            />
          </>
        )
      case 'Wallet':
        return (
          <>
            <SubViewHeader title="Wallet" />
            <WalletView transactions={transactions} summary={summary} categories={categories} />
          </>
        )
      case 'Analytics':
        return (
          <>
            <SubViewHeader title="Analytics" />
            <AnalyticsView transactions={transactions} categories={categories} />
          </>
        )
      case 'Settings':
        return (
          <>
            <SubViewHeader title="Settings" />
            <SettingsView
              user={user}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onLogout={onLogout}
              categories={categories}
              onRefreshCategories={fetchCategories}
              onUpdateUser={onUpdateUser}
            />
          </>
        )
      case 'Admin':
        return (
          <>
            <SubViewHeader title="Admin Panel" />
            <AdminView user={user} />
          </>
        )
      default:
        return (
          <>
            {/* Top bar */}
            <header className={`${styles.topBar} anim-fade-up`}>
              <div className={styles.topBarLeft}>
                <button
                  className={styles.hamburger}
                  onClick={() => setSidebarOpen(true)}
                  title="Open menu"
                >
                  <span className={styles.hamburgerLine} />
                  <span className={styles.hamburgerLine} />
                  <span className={styles.hamburgerLine} />
                </button>
                <div>
                  <h1 className={styles.greeting}>{greeting}, {user.username} 👋</h1>
                  <p className={styles.greetingSub}>Here's your financial overview</p>
                </div>
              </div>
              <div className={styles.topBarRight}>
                {/* Search */}
                <div className={styles.searchWrap}>
                  <span className={styles.searchIcon}>🔍</span>
                  <input
                    className={styles.searchInput}
                    placeholder="Search transactions…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
                {/* User chip */}
                <div className={styles.userChip} onClick={() => setActiveNav('Settings')} style={{ cursor:'pointer' }} title="Go to Profile Settings">
                  {user.avatar ? (
                    <img src={user.avatar} alt="avatar" style={{ width:34, height:34, borderRadius:'50%',
                      objectFit:'cover', border:'2px solid var(--accent)', flexShrink:0 }} />
                  ) : (
                    <div className={styles.avatar}>{initials}</div>
                  )}
                  <span className={styles.userEmail}>{user.username || user.email.split('@')[0]}</span>
                </div>
              </div>
            </header>

            {/* Balance hero card */}
            <div className={`${styles.balanceCard} anim-fade-up anim-delay-1`}>
              <p className={styles.balanceLabel}>Total Balance</p>
              <p className={styles.balanceAmount}>{loading ? '—' : fmt(summary.balance)}</p>
              {trends.balance && (
                <span className={styles.balanceTrend}
                  style={{ color: trends.balance.good === null ? 'rgba(255,255,255,.5)'
                    : trends.balance.good ? '#3dd68c' : '#f76f6f' }}>
                  {trends.balance.text} vs last month
                </span>
              )}
              <div className={styles.balanceActions}>
                <button className={styles.balanceBtn} onClick={() => setShowModal(true)}>
                  <span className={styles.balanceBtnIcon}>↑</span>Send
                </button>
                <button className={styles.balanceBtn} onClick={() => setShowModal(true)}>
                  <span className={styles.balanceBtnIcon}>↓</span>Receive
                </button>
                <button className={styles.balanceBtn} onClick={() => setShowModal(true)}>
                  <span className={styles.balanceBtnIcon}>+</span>Add
                </button>
              </div>
            </div>

            {/* 3 mini cards: Income, Expenses, Savings Rate */}
            <div className={`${styles.miniCards} anim-fade-up anim-delay-2`}>
              {[
                { label:'Income',      value:summary.income,   trend:trends.income,
                  bg:'var(--green-soft)', color:'var(--green)', icon:'↑' },
                { label:'Expenses',    value:summary.expenses, trend:trends.expenses,
                  bg:'var(--red-soft)',   color:'var(--red)',   icon:'↓' },
                { label:'Savings Rate', value: null, trend: null,
                  bg:'rgba(167,139,250,.12)', color:'#a78bfa', icon:'%',
                  extra: savingsRate + '%' },
              ].map(c => (
                <div key={c.label} className={styles.miniCard}>
                  <div className={styles.miniCardTop}>
                    <span className={styles.miniCardLabel}>{c.label}</span>
                    <span className={styles.miniCardIconWrap} style={{ background:c.bg, color:c.color, fontSize:17 }}>{c.icon}</span>
                  </div>
                  <p className={styles.miniCardAmount}>
                    {loading ? '—' : c.extra ? c.extra : fmt(c.value)}
                  </p>
                  {c.trend && (
                    <span className={styles.miniCardTrend}
                      style={{ color: c.trend.good === null ? 'var(--text-3)'
                        : c.trend.good ? 'var(--green)' : 'var(--red)' }}>
                      {c.trend.text} vs last month
                    </span>
                  )}
                  {!c.trend && !loading && (
                    <span className={styles.miniCardTrend} style={{ color:'var(--text-3)' }}>
                      {parseFloat(savingsRate) >= 20 ? '✓ On track' : '⚠ Below target'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Chart with toggle */}
            <div className={`${styles.chartBox} anim-fade-up anim-delay-3`}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionTitle}>Income vs Expenses</p>
                <div className={styles.chartTabs}>
                  <button className={`${styles.chartTab} ${chartMode==='area' ? styles.chartTabActive : ''}`}
                    onClick={() => setChartMode('area')}>Area</button>
                  <button className={`${styles.chartTab} ${chartMode==='bar' ? styles.chartTabActive : ''}`}
                    onClick={() => setChartMode('bar')}>Bar</button>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                {chartMode === 'area' ? (
                  <AreaChart data={chartData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4f8ef7" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#4f8ef7" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f76f6f" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f76f6f" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill:'var(--text-2)', fontSize:12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} tick={{ fill:'var(--text-2)', fontSize:12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="Income"   stroke="#4f8ef7" strokeWidth={2.5}
                      fill="url(#colorIncome)"   dot={{ r:4, fill:'#4f8ef7', strokeWidth:0 }} activeDot={{ r:6 }} />
                    <Area type="monotone" dataKey="Expenses" stroke="#f76f6f" strokeWidth={2.5}
                      fill="url(#colorExpenses)" dot={{ r:4, fill:'#f76f6f', strokeWidth:0 }} activeDot={{ r:6 }} />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top:5, right:10, left:0, bottom:5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fill:'var(--text-2)', fontSize:12 }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} tick={{ fill:'var(--text-2)', fontSize:12 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="Income"   fill="#4f8ef7" radius={[4,4,0,0]} />
                    <Bar dataKey="Expenses" fill="#f76f6f" radius={[4,4,0,0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Budget Overview */}
            <BudgetOverview transactions={transactions} categories={categories} />

            {/* Recent Transactions */}
            <section className={`${styles.txSection} anim-fade-up anim-delay-4`}>
              <div className={styles.sectionHeader}>
                <p className={styles.sectionTitle}>Recent Transactions</p>
                <div style={{ display:'flex', gap:8 }}>
                  <button
                    style={{ background:'var(--surface-2)', color:'var(--text-2)',
                      border:'1px solid var(--border)', padding:'7px 14px',
                      borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer',
                      fontFamily:'var(--font)' }}
                    onClick={() => setActiveNav('Transactions')}
                  >View All</button>
                  <button className={styles.addBtn} onClick={() => setShowModal(true)}>+ Add New</button>
                </div>
              </div>

              {loading ? (
                <p style={{ color:'var(--text-2)', padding:'2rem', textAlign:'center' }}>Loading…</p>
              ) : filteredTxns.length === 0 ? (
                <p style={{ color:'var(--text-2)', padding:'2rem', textAlign:'center' }}>
                  {searchQuery ? 'No transactions match your search.' : 'No transactions yet.'}
                </p>
              ) : (
                <div className={styles.txList}>
                  {filteredTxns.slice(0,6).map(t => {
                    const isIncome = t.amount > 0
                    const cat = catMap[t.category]
                    return (
                      <div key={t._id} className={styles.txRow}>
                        <div className={styles.txIconWrap}
                          style={{ background: cat ? (cat.color + '26') : 'rgba(100,116,139,.15)' }}>
                          {cat?.icon || '💳'}
                        </div>
                        <div className={styles.txInfo}>
                          <p className={styles.txName}>{t.name}</p>
                          <p className={styles.txMeta}>
                            <span className={styles.catBadge}>{t.category}</span>
                            &nbsp;·&nbsp;
                            <StatusBadge status={t.status} />
                          </p>
                        </div>
                        <div className={styles.txRight}>
                          <p className={styles.txAmount} style={{ color: isIncome ? 'var(--green)' : 'var(--red)' }}>
                            {isIncome ? '+' : '−'}{fmt(t.amount)}
                          </p>
                          <p className={styles.txDate}>{new Date(t.date).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}</p>
                        </div>
                        <button
                          className={styles.delBtn}
                          onClick={() => handleDelete(t._id)}
                          disabled={deleting === t._id}
                        >{deleting === t._id ? '…' : '🗑'}</button>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          </>
        )
    }
  }

  return (
    <div className={styles.shell}>
      {/* Sidebar overlay (mobile / closed state backdrop) */}
      {sidebarOpen && (
        <div className={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar — completely hidden when closed */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        {/* Close button inside sidebar */}
        <div className={styles.sidebarHeader}>
          <img src={logo} alt="FinDash Logo" className={styles.logoImage} />
          <button
            className={styles.sidebarCloseBtn}
            onClick={() => setSidebarOpen(false)}
            title="Close menu"
          >
            ✕
          </button>
        </div>

        <nav className={styles.nav}>
          {NAV.map(n => (
            <button
              key={n.label}
              className={`${styles.navItem} ${activeNav === n.label ? styles.navActive : ''}`}
              onClick={() => { setActiveNav(n.label); setSidebarOpen(false) }}
            >
              {activeNav === n.label && <span className={styles.navActiveBar} />}
              <span className={styles.navIconWrap}>{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button
            className={`${styles.navItem} ${activeNav === 'Settings' ? styles.navActive : ''}`}
            onClick={() => { setActiveNav('Settings'); setSidebarOpen(false) }}
            style={{ width:'100%' }}
          >
            <span className={styles.navIconWrap}>⚙</span>
            Settings
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {renderMain()}
      </main>

      {showModal && (
        <Modal
          onClose={() => setShowModal(false)}
          onSaved={loadAll}
          categories={categories}
        />
      )}
    </div>
  )
}