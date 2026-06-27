import { authFetch } from '../utils/api.js'
import { useState, useRef } from 'react'

const API = '/api'

const CURRENCIES = [
  { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
  { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', label: 'Australian Dollar' },
  { code: 'CHF', symbol: 'Fr', label: 'Swiss Franc' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar' },
  { code: 'AED', symbol: 'د.إ', label: 'UAE Dirham' },
]

export default function ProfileSettings({ user, onUpdateUser }) {
  const [username,      setUsername]      = useState(user.username || '')
  const [currency,      setCurrency]      = useState(user.currency || 'INR')
  const [avatar,        setAvatar]        = useState(user.avatar   || null)
  const [oldPassword,   setOldPassword]   = useState('')
  const [newPassword,   setNewPassword]   = useState('')
  const [confirmPass,   setConfirmPass]   = useState('')
  const [profileMsg,    setProfileMsg]    = useState({ text: '', ok: true })
  const [passwordMsg,   setPasswordMsg]   = useState({ text: '', ok: true })
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPass,    setSavingPass]    = useState(false)
  const [uploading,     setUploading]     = useState(false)
  const fileRef = useRef()

  const inputStyle = {
    background: 'var(--surface-2)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '10px 14px', color: 'var(--text)',
    fontSize: 14, outline: 'none', fontFamily: 'var(--font)', width: '100%',
    transition: 'border-color .2s',
  }

  // ── Upload avatar to ImageKit via backend auth ───────────────────────────
  /*async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ text: 'Image must be under 5 MB', ok: false })
      return
    }

    setUploading(true)
    setProfileMsg({ text: '', ok: true })

    try {
      // 1. Get ImageKit auth signature from backend
      const authRes  = await authFetch(`${API}/imagekit/auth`)
      const authData = await authRes.json()

      // 2. Upload file to ImageKit
      const formData = new FormData()
      formData.append('file',      file)
      formData.append('fileName',  `avatar_${user.email.replace('@', '_')}`)
      formData.append('folder',    '/avatars')
      formData.append('publicKey', import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY)
      formData.append('signature', authData.signature)
      formData.append('expire',    authData.expire)
      formData.append('token',     authData.token)

      const uploadRes  = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()

      if (uploadData.url) {
        setAvatar(uploadData.url)
        setProfileMsg({ text: '✓ Photo uploaded! Click Save Profile to apply.', ok: true })
      } else {
        setProfileMsg({ text: 'Upload failed. Try again.', ok: false })
      }
    } catch (err) {
      setProfileMsg({ text: 'Upload error: ' + err.message, ok: false })
    } finally {
      setUploading(false)
    }
  }

  function handleRemoveAvatar() {
    setAvatar(null)
    if (fileRef.current) fileRef.current.value = ''
    setProfileMsg({ text: 'Photo removed. Click Save Profile to apply.', ok: true })
  }
*/

async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setProfileMsg({ text: 'Image must be under 5 MB', ok: false })
      return
    }

    setUploading(true)
    setProfileMsg({ text: '', ok: true })

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileName', `avatar_${user.email.replace('@', '_')}`)

      const token = localStorage.getItem('authToken')
      const res = await fetch(`${API}/imagekit/upload`, {
        method:  'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body:    formData,
      })
      const data = await res.json()

      if (data.url) {
        setAvatar(data.url)
        setProfileMsg({ text: '✓ Photo uploaded! Click Save Profile to apply.', ok: true })
      } else {
        setProfileMsg({ text: 'Upload failed. Try again.', ok: false })
      }
    } catch (err) {
      setProfileMsg({ text: 'Upload error: ' + err.message, ok: false })
    } finally {
      setUploading(false)
    }
  }

  // ── Save profile to DB ───────────────────────────────────────────────────
  async function handleSaveProfile(e) {
    e.preventDefault()
    if (!username.trim()) {
      setProfileMsg({ text: 'Username cannot be empty', ok: false })
      return
    }
    setSavingProfile(true)
    setProfileMsg({ text: '', ok: true })
    try {
      const res  = await authFetch(`${API}/user/profile`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    user.email,
          username: username.trim(),
          avatar:   avatar,
          currency: currency,
        }),
      })
      const data = await res.json()
      if (data.success) {
        onUpdateUser({ username: data.user.username, avatar: data.user.avatar, currency: data.user.currency })
        setProfileMsg({ text: '✓ Profile saved!', ok: true })
        setTimeout(() => setProfileMsg({ text: '', ok: true }), 3000)
      } else {
        setProfileMsg({ text: data.message || 'Failed to save', ok: false })
      }
    } catch {
      setProfileMsg({ text: 'Cannot reach server.', ok: false })
    } finally {
      setSavingProfile(false)
    }
  }

  // ── Change password ──────────────────────────────────────────────────────
  async function handleChangePassword(e) {
    e.preventDefault()
    if (!oldPassword) {
      setPasswordMsg({ text: 'Enter your current password', ok: false })
      return
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'New password must be at least 6 characters', ok: false })
      return
    }
    if (newPassword !== confirmPass) {
      setPasswordMsg({ text: 'Passwords do not match', ok: false })
      return
    }
    setSavingPass(true)
    setPasswordMsg({ text: '', ok: true })
    try {
      const res  = await authFetch(`${API}/user/password`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, oldPassword, newPassword }),
      })
      const data = await res.json()
      if (data.success) {
        setPasswordMsg({ text: '✓ Password changed!', ok: true })
        setOldPassword(''); setNewPassword(''); setConfirmPass('')
        setTimeout(() => setPasswordMsg({ text: '', ok: true }), 3000)
      } else {
        setPasswordMsg({ text: data.message || 'Failed to change password', ok: false })
      }
    } catch {
      setPasswordMsg({ text: 'Cannot reach server.', ok: false })
    } finally {
      setSavingPass(false)
    }
  }

  const initials          = (username || 'U').slice(0, 2).toUpperCase()
  const selectedCurrency  = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>

      {/* ── Avatar + Profile Info ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-3)' }}>
          Profile
        </div>

        {/* Avatar row */}
        <div style={{ padding: '1.4rem', display: 'flex', alignItems: 'center', gap: '1.4rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatar ? (
              <img src={avatar} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent)' }} />
            ) : (
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#4f8ef7,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#fff', border: '3px solid var(--border)' }}>
                {initials}
              </div>
            )}
            <button onClick={() => fileRef.current?.click()} title="Upload photo" disabled={uploading} style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 13 }}>
              {uploading ? '…' : '📷'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          </div>

          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{username || user.email}</p>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 3 }}>{user.email}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', opacity: uploading ? 0.7 : 1 }}>
                {uploading ? 'Uploading…' : 'Upload Photo'}
              </button>
              {avatar && (
                <button onClick={handleRemoveAvatar} style={{ background: 'var(--red-soft)', color: 'var(--danger)', border: '1px solid rgba(247,111,111,.2)', borderRadius: 8, padding: '6px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Username + Currency form */}
        <form onSubmit={handleSaveProfile} style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Username</label>
            <input style={inputStyle} value={username} onChange={e => setUsername(e.target.value)} placeholder="Your display name" />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Currency</label>
            <div style={{ position: 'relative' }}>
              <select value={currency} onChange={e => setCurrency(e.target.value)} style={{ ...inputStyle, paddingLeft: 40, appearance: 'none', cursor: 'pointer' }}>
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol}  {c.label} ({c.code})</option>
                ))}
              </select>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: 15, color: 'var(--accent)', pointerEvents: 'none' }}>
                {selectedCurrency.symbol}
              </span>
            </div>
          </div>

          {profileMsg.text && (
            <p style={{ fontSize: 13, color: profileMsg.ok ? 'var(--green)' : 'var(--danger)' }}>{profileMsg.text}</p>
          )}

          <button type="submit" disabled={savingProfile || uploading} style={{ background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', alignSelf: 'flex-start', opacity: (savingProfile || uploading) ? 0.7 : 1, transition: 'opacity .2s' }}>
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* ── Change Password ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text-3)' }}>
          Security
        </div>

        <form onSubmit={handleChangePassword} style={{ padding: '1.4rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Current Password</label>
            <input type="password" style={inputStyle} value={oldPassword} onChange={e => setOldPassword(e.target.value)} placeholder="Enter current password" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>New Password</label>
            <input type="password" style={inputStyle} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', display: 'block', marginBottom: 6 }}>Confirm New Password</label>
            <input type="password" style={{ ...inputStyle, borderColor: confirmPass && confirmPass !== newPassword ? 'var(--danger)' : undefined }} value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Repeat new password" />
          </div>

          {passwordMsg.text && (
            <p style={{ fontSize: 13, color: passwordMsg.ok ? 'var(--green)' : 'var(--danger)' }}>{passwordMsg.text}</p>
          )}

          <button type="submit" disabled={savingPass} style={{ background: 'var(--surface-2)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)', alignSelf: 'flex-start', opacity: savingPass ? 0.7 : 1, transition: 'opacity .2s' }}>
            {savingPass ? 'Updating…' : '🔒 Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export { CURRENCIES }