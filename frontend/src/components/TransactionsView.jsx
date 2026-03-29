import { useState, useMemo } from 'react'
import styles from './Dashboard.module.css'

const CAT_ICONS = {
  Food: '🍜', Transport: '🚗', Entertainment: '🎬', Income: '💼', Bills: '📋',
}

function fmt(n) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(Math.abs(n))
}

function StatusBadge({ status }) {
  return (
    <span className={`${styles.statusBadge} ${status === 'Completed' ? styles.completed : styles.pending}`}>
      {status}
    </span>
  )
}

export default function TransactionsView({ transactions, onDelete, onAdd, deleting }) {
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const [status,   setStatus]   = useState('All')
  const [sort,     setSort]     = useState('date-desc')

  const filtered = useMemo(() => {
    let list = [...transactions]
    if (search)             list = list.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    if (category !== 'All') list = list.filter(t => t.category === category)
    if (status   !== 'All') list = list.filter(t => t.status   === status)
    switch (sort) {
      case 'date-desc':   list.sort((a, b) => new Date(b.date) - new Date(a.date)); break
      case 'date-asc':    list.sort((a, b) => new Date(a.date) - new Date(b.date)); break
      case 'amount-desc': list.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)); break
      case 'amount-asc':  list.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount)); break
    }
    return list
  }, [transactions, search, category, status, sort])

  const inputStyle = {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '8px 12px', color: 'var(--text)',
    fontSize: 13, outline: 'none', fontFamily: 'var(--font)',
  }

  return (
    <div className="anim-fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.6px', color: 'var(--text)' }}>Transactions</h2>
          <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>{filtered.length} of {transactions.length} records</p>
        </div>
        <button className={styles.addBtn} onClick={onAdd}>+ Add New</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          placeholder="🔍  Search transactions…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
          <option value="All">All Categories</option>
          {['Food', 'Transport', 'Entertainment', 'Income', 'Bills'].map(c => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <select style={inputStyle} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="All">All Statuses</option>
          <option>Completed</option>
          <option>Pending</option>
        </select>
        <select style={inputStyle} value={sort} onChange={e => setSort(e.target.value)}>
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="amount-desc">Highest amount</option>
          <option value="amount-asc">Lowest amount</option>
        </select>
      </div>

      {/* Table */}
      <div className={styles.txSection}>
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-2)', padding: '2rem', textAlign: 'center' }}>
            No transactions match your filters.
          </p>
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
                {filtered.map(t => {
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
                          onClick={() => onDelete(t._id)}
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
      </div>
    </div>
  )
}