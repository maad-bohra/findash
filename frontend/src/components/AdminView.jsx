import { authFetch } from '../utils/api.js'
import { useState, useEffect, useCallback } from 'react'
import styles from './AdminView.module.css'

const API = '/api'

// authFetch now handles Authorization header automatically


// ── Confirmation Modal ────────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onCancel()}>
      <div className={styles.confirmBox}>
        <p className={styles.confirmMsg}>{message}</p>
        <div className={styles.confirmBtns}>
          <button className={styles.btnDanger} onClick={onConfirm}>Confirm</button>
          <button className={styles.btnGhost} onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Reset Password Modal ───────────────────────────────────────────────────
function ResetPasswordModal({ user, adminEmail, onClose, onSuccess }) {
  const [pw,      setPw]      = useState('')
  const [confirm, setConfirm] = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setError('')
    if (pw.length < 6)    return setError('Password must be at least 6 characters')
    if (pw !== confirm)   return setError('Passwords do not match')
    setLoading(true)
    try {
      const res  = await authFetch(`${API}/admin/users/${user._id}/password`, {
        method:  'PUT',
        body:    JSON.stringify({ newPassword: pw }),
      })
      const data = await res.json()
      if (data.success) { onSuccess(`Password reset for ${user.email}`); onClose() }
      else setError(data.message || 'Failed')
    } catch { setError('Server error') }
    finally  { setLoading(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Reset Password</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p className={styles.modalSub}>Setting new password for <strong>{user.email}</strong></p>
        <div className={styles.fieldGroup}>
          <Input label="New Password"     type="password" value={pw}      onChange={setPw}      placeholder="Min 6 characters" />
          <Input label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" />
        </div>
        {error && <p className={styles.errMsg}>{error}</p>}
        <div className={styles.modalFooter}>
          <button className={styles.btnPrimary} onClick={handleReset} disabled={loading}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Edit User Modal ────────────────────────────────────────────────────────
function EditUserModal({ user, adminEmail, onClose, onSaved }) {
  const [username, setUsername] = useState(user.username)
  const [email,    setEmail]    = useState(user.email)
  const [currency, setCurrency] = useState(user.currency || 'INR')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSave() {
    setError('')
    setLoading(true)
    try {
      const res  = await authFetch(`${API}/admin/users/${user._id}`, {
        method:  'PUT',
        body:    JSON.stringify({ username, email, currency }),
      })
      const data = await res.json()
      if (data.success) { onSaved(data.user); onClose() }
      else setError(data.message || 'Update failed')
    } catch { setError('Server error') }
    finally  { setLoading(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Edit User</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <div className={styles.fieldGroup}>
          <Input label="Username" value={username} onChange={setUsername} placeholder="username" />
          <Input label="Email"    value={email}    onChange={setEmail}    placeholder="email@example.com" />
          <div className={styles.field}>
            <label className={styles.fieldLabel}>Currency</label>
            <select className={styles.select} value={currency} onChange={e => setCurrency(e.target.value)}>
              {['INR','USD','EUR','GBP','JPY','AUD','CAD','SGD','AED'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        {error && <p className={styles.errMsg}>{error}</p>}
        <div className={styles.modalFooter}>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Save Changes'}
          </button>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Change Admin Password Modal ────────────────────────────────────────────
function ChangeAdminPasswordModal({ adminEmail, onClose, onSuccess }) {
  const [pw,      setPw]      = useState('')
  const [confirm, setConfirm] = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleChange() {
    setError('')
    if (pw.length < 6)  return setError('Password must be at least 6 characters')
    if (pw !== confirm) return setError('Passwords do not match')
    setLoading(true)
    try {
      const res  = await authFetch(`${API}/admin/password`, {
        method:  'PUT',
        body:    JSON.stringify({ newPassword: pw }),
      })
      const data = await res.json()
      if (data.success) { onSuccess('Admin password changed successfully'); onClose() }
      else setError(data.message || 'Failed')
    } catch { setError('Server error') }
    finally  { setLoading(false) }
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>Change Your Password</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <p className={styles.modalSub}>Admin accounts can change password without verifying the old one.</p>
        <div className={styles.fieldGroup}>
          <Input label="New Password"     type="password" value={pw}      onChange={setPw}      placeholder="Min 6 characters" />
          <Input label="Confirm Password" type="password" value={confirm} onChange={setConfirm} placeholder="Re-enter password" />
        </div>
        {error && <p className={styles.errMsg}>{error}</p>}
        <div className={styles.modalFooter}>
          <button className={styles.btnPrimary} onClick={handleChange} disabled={loading}>
            {loading ? 'Changing…' : 'Change Password'}
          </button>
          <button className={styles.btnGhost} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Input helper ──────────────────────────────────────────────────────────
function Input({ label, type = 'text', value, onChange, placeholder }) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      <input
        className={styles.input}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

// ── User Row ──────────────────────────────────────────────────────────────
function UserRow({ user, isSelf, adminEmail, onRefresh, onToast }) {
  const [showEdit,  setShowEdit]  = useState(false)
  const [showReset, setShowReset] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [busy, setBusy] = useState(false)

  const initials = (user.username || user.email).slice(0, 2).toUpperCase()

  async function toggleAdmin() {
    setBusy(true)
    try {
      const res  = await authFetch(`${API}/admin/users/${user._id}`, {
        method:  'PUT',
        body:    JSON.stringify({ isAdmin: !user.isAdmin }),
      })
      const data = await res.json()
      if (data.success) { onRefresh(); onToast(data.user.isAdmin ? `${user.username} is now admin` : `${user.username} admin removed`) }
      else onToast(data.message || 'Error', true)
    } catch { onToast('Server error', true) }
    finally  { setBusy(false) }
  }

  async function toggleActive() {
    setBusy(true)
    try {
      const res  = await authFetch(`${API}/admin/users/${user._id}`, {
        method:  'PUT',
        body:    JSON.stringify({ isActive: !user.isActive }),
      })
      const data = await res.json()
      if (data.success) { onRefresh(); onToast(data.user.isActive ? `${user.username} activated` : `${user.username} deactivated`) }
      else onToast(data.message || 'Error', true)
    } catch { onToast('Server error', true) }
    finally  { setBusy(false) }
  }

  async function deleteUser() {
    setBusy(true)
    try {
      const res  = await authFetch(`${API}/admin/users/${user._id}`, {
        method:  'DELETE',
      })
      const data = await res.json()
      if (data.success) { onRefresh(); onToast(`Deleted ${user.email}`) }
      else onToast(data.message || 'Error', true)
    } catch { onToast('Server error', true) }
    finally  { setBusy(false); setConfirmDel(false) }
  }

  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'2-digit' }) : '—'

  return (
    <>
      <div className={`${styles.userRow} ${!user.isActive ? styles.inactive : ''}`}>
        {/* Avatar */}
        <div className={styles.userAvatar} style={{ background: user.isAdmin ? 'linear-gradient(135deg,#f76f6f,#a78bfa)' : 'linear-gradient(135deg,#4f8ef7,#3dd68c)' }}>
          {user.avatar ? <img src={user.avatar} alt="" style={{ width:'100%', height:'100%', borderRadius:'50%', objectFit:'cover' }} /> : initials}
        </div>

        {/* Info */}
        <div className={styles.userInfo}>
          <div className={styles.userNameRow}>
            <span className={styles.userName}>{user.username}</span>
            {user.isAdmin && <span className={styles.badge}>Admin</span>}
            {isSelf && <span className={`${styles.badge} ${styles.selfBadge}`}>You</span>}
            {!user.isActive && <span className={`${styles.badge} ${styles.inactiveBadge}`}>Inactive</span>}
          </div>
          <span className={styles.userEmail}>{user.email}</span>
          <span className={styles.userMeta}>{user.currency || 'INR'} · Joined {joined}</span>
        </div>

        {/* Actions */}
        <div className={styles.userActions}>
          <button className={styles.actionBtn} title="Edit user" onClick={() => setShowEdit(true)}>✏️</button>
          <button className={styles.actionBtn} title="Reset password" onClick={() => setShowReset(true)}>🔑</button>
          {!isSelf && (
            <>
              <button
                className={`${styles.actionBtn} ${user.isAdmin ? styles.activeAction : ''}`}
                title={user.isAdmin ? 'Remove admin' : 'Make admin'}
                onClick={toggleAdmin}
                disabled={busy}
              >👑</button>
              <button
                className={`${styles.actionBtn} ${!user.isActive ? styles.activeAction : ''}`}
                title={user.isActive ? 'Deactivate account' : 'Activate account'}
                onClick={toggleActive}
                disabled={busy}
              >{user.isActive ? '🔒' : '🔓'}</button>
              <button
                className={`${styles.actionBtn} ${styles.deleteBtn}`}
                title="Delete user"
                onClick={() => setConfirmDel(true)}
                disabled={busy}
              >🗑</button>
            </>
          )}
        </div>
      </div>

      {showEdit  && <EditUserModal  user={user} adminEmail={adminEmail} onClose={() => setShowEdit(false)}  onSaved={() => { onRefresh(); onToast('User updated') }} />}
      {showReset && <ResetPasswordModal user={user} adminEmail={adminEmail} onClose={() => setShowReset(false)} onSuccess={msg => onToast(msg)} />}
      {confirmDel && (
        <ConfirmModal
          message={`Delete user "${user.email}"? This cannot be undone.`}
          onConfirm={deleteUser}
          onCancel={() => setConfirmDel(false)}
        />
      )}
    </>
  )
}

// ── Main AdminView ─────────────────────────────────────────────────────────
export default function AdminView({ user: adminUser }) {
  const [users,      setUsers]      = useState([])
  const [stats,      setStats]      = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [filter,     setFilter]     = useState('all')   // all | admin | active | inactive
  const [toast,      setToast]      = useState(null)
  const [showPwModal,setShowPwModal]= useState(false)

  function showToast(msg, isError = false) {
    setToast({ msg, isError })
    setTimeout(() => setToast(null), 3000)
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [uRes, sRes] = await Promise.all([
        authFetch(`${API}/admin/users`),
        authFetch(`${API}/admin/stats`),
      ])
      const uData = await uRes.json()
      const sData = await sRes.json()
      if (uData.success) setUsers(uData.users)
      if (sData.success) setStats(sData.stats)
    } catch { showToast('Failed to load admin data', true) }
    finally  { setLoading(false) }
  // Fix #3: loadData has no real deps on adminUser.email — remove the stale dep
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    const matchSearch = !q || u.username.includes(q) || u.email.includes(q)
    const matchFilter =
      filter === 'all'      ? true :
      filter === 'admin'    ? u.isAdmin :
      filter === 'active'   ? u.isActive :
      filter === 'inactive' ? !u.isActive : true
    return matchSearch && matchFilter
  })

  return (
    <div className={styles.adminView}>
      {/* Header */}
      <div className={styles.adminHeader}>
        <div>
          <h1 className={styles.adminTitle}>Admin Panel</h1>
          <p className={styles.adminSub}>Manage users, roles, and account access</p>
        </div>
        <button className={styles.btnPrimary} onClick={() => setShowPwModal(true)}>
          🔐 Change My Password
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className={styles.statsRow}>
          {[
            { label: 'Total Users',    value: stats.total,    icon: '👥', color: '#4f8ef7' },
            { label: 'Active',         value: stats.active,   icon: '✅', color: '#3dd68c' },
            { label: 'Inactive',       value: stats.inactive, icon: '🚫', color: '#f76f6f' },
            { label: 'Admins',         value: stats.admins,   icon: '👑', color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} className={styles.statCard}>
              <span className={styles.statIcon} style={{ background: s.color + '22', color: s.color }}>{s.icon}</span>
              <div>
                <p className={styles.statValue}>{s.value}</p>
                <p className={styles.statLabel}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            className={styles.searchInput}
            placeholder="Search by username or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          {['all','admin','active','inactive'].map(f => (
            <button
              key={f}
              className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* User List */}
      <div className={styles.userList}>
        {loading ? (
          <div className={styles.empty}>Loading users…</div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>No users found</div>
        ) : (
          filtered.map(u => (
            <UserRow
              key={u._id}
              user={u}
              isSelf={u.email === adminUser.email}
              adminEmail={adminUser.email}
              onRefresh={loadData}
              onToast={showToast}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showPwModal && (
        <ChangeAdminPasswordModal
          adminEmail={adminUser.email}
          onClose={() => setShowPwModal(false)}
          onSuccess={msg => showToast(msg)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.isError ? styles.toastError : styles.toastSuccess}`}>
          {toast.isError ? '❌' : '✅'} {toast.msg}
        </div>
      )}
    </div>
  )
}