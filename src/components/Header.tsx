import { useState } from 'react'
import { useNav } from '../context/NavContext'

const pageTitles: Record<string, string> = {
  'student-dashboard': 'لوحة التحكم',
  'my-courses': 'كورساتي',
  'course-catalog': 'استعراض الكورسات',
  'live-class': 'الحصص المباشرة',
  'certificates': 'الشهادات',
  'ai-assistant': 'المساعد الذكي',
  'profile': 'الإعدادات',
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { page, navigate, logout, userName, userEmail, role, kycStatus } = useNav()
  const [search, setSearch] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  return (
    <>
      <header
        style={{
          position: 'sticky', top: 0, zIndex: 50,
          height: 'var(--header-height)',
          background: 'rgba(8,3,32,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center',
        }}
        className="app-header"
      >
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="header-hamburger"
        >☰</button>

        {/* Page title */}
        <div className="header-page-title">
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>
            {pageTitles[page] || 'Hybrid LMS'}
          </h1>
        </div>

        {/* Search */}
        <div className="header-search">
          <span style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.35)', fontSize: 15, pointerEvents: 'none',
          }}>🔍</span>
          <input
            className="form-input"
            style={{ paddingRight: 40, paddingTop: 9, paddingBottom: 9, fontSize: 13 }}
            placeholder="ابحث عن كورسات، دروس..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              border: '2px solid rgba(168,85,247,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 15, fontWeight: 700, color: '#fff',
            }}
          >{(userName || 'أ')[0]}</button>
          {profileOpen && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 8,
              background: 'rgba(12,4,45,0.98)', backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
              padding: 8, minWidth: 200, zIndex: 200,
            }}>
              <div style={{ padding: '10px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{userName || 'مستخدم'}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>{userEmail || '—'}</div>
                {(role === 'student' || role === 'instructor') && (
                  kycStatus === 'verified'
                    ? <span className="badge badge-success" style={{ marginTop: 6 }}>✓ KYC موثّق</span>
                    : <span className="badge" style={{ marginTop: 6, background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>⚠ KYC غير مكتمل</span>
                )}
              </div>
              <button
                onClick={() => { navigate('profile'); setProfileOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 14px', border: 'none', background: 'transparent',
                  color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', borderRadius: 8, marginTop: 4,
                }}
              >⚙️ الإعدادات والملف الشخصي</button>
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '9px 14px', border: 'none', background: 'transparent',
                  color: '#f87171', fontSize: 13, cursor: 'pointer',
                  fontFamily: 'inherit', borderRadius: 8,
                }}
              >🚪 تسجيل الخروج</button>
            </div>
          )}
        </div>
      </header>
    </>
  )
}