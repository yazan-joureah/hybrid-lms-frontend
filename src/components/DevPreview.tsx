import { useEffect, useState } from 'react'

const PREVIEW_FLAG = 'dev_preview_enabled'
const PREVIEW_ROLE = 'dev_preview_role'
const SESSION_FLAG = 'session_active'

const roles = ['Student', 'Instructor', 'Admin'] as const

type RoleType = typeof roles[number]

function normalizePreviewRole(value: string | null): RoleType {
  return value === 'Student' || value === 'Instructor' || value === 'Admin' ? value : 'Admin'
}

export default function DevPreview() {
  const [open, setOpen] = useState(false)
  const [enabled, setEnabled] = useState<boolean>(() => localStorage.getItem(PREVIEW_FLAG) === 'true')
  const [role, setRole] = useState<RoleType>(() => normalizePreviewRole(localStorage.getItem(PREVIEW_ROLE)))

  useEffect(() => {
    setEnabled(localStorage.getItem(PREVIEW_FLAG) === 'true')
    setRole(normalizePreviewRole(localStorage.getItem(PREVIEW_ROLE)))
  }, [])

  function toggleEnabled() {
    const next = !enabled
    setEnabled(next)
    if (next) {
      localStorage.setItem(PREVIEW_FLAG, 'true')
      localStorage.setItem(PREVIEW_ROLE, role)
      // set session flag so AuthContext refresh will attempt to load user
      localStorage.setItem(SESSION_FLAG, 'true')
    } else {
      localStorage.removeItem(PREVIEW_FLAG)
      localStorage.removeItem(PREVIEW_ROLE)
      localStorage.removeItem(SESSION_FLAG)
    }
    // reload to let AuthContext pick up mock /auth/refresh and /users/me
    setTimeout(() => window.location.reload(), 120)
  }

  function changeRole(r: RoleType) {
    setRole(r)
    localStorage.setItem(PREVIEW_ROLE, r)
  }

  if (!import.meta.env.DEV) return null

  return (
    <div style={{ position: 'fixed', left: 16, bottom: 16, zIndex: 9999, direction: 'ltr' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => setOpen((v) => !v)}
          title="DEV Preview"
          className="btn-ghost"
          style={{ padding: '10px 12px', borderRadius: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>DEV Preview</span>
          <span style={{ opacity: 0.8 }}>{enabled ? role : 'OFF'}</span>
        </button>
        <button
          onClick={toggleEnabled}
          className={enabled ? 'btn-primary' : 'btn-outline'}
          style={{ padding: '10px 12px', borderRadius: 12 }}>
          {enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {open && (
        <div style={{ marginTop: 8, minWidth: 260 }} className="metric-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontWeight: 700 }}>Frontend Preview Mode</div>
            <div style={{ color: 'rgba(255,255,255,0.55)' }}>{enabled ? 'Active' : 'Inactive'}</div>
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>Role</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => changeRole(r)}
                  className={r === role ? 'btn-primary' : 'btn-ghost'}
                  style={{ padding: '8px 10px', borderRadius: 10 }}
                >
                  {r}
                </button>
              ))}
            </div>

            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
              Enabling preview will set a mock session and reload the app so pages render without a backend. Toggle off to return to normal behavior.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setOpen(false)} className="btn-ghost">Close</button>
              <button onClick={toggleEnabled} className={enabled ? 'btn-outline' : 'btn-primary'}>{enabled ? 'Disable Preview' : 'Enable Preview'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
