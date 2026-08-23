import { useState } from 'react'
import { useNav } from '../context/NavContext'

const notifications = [
  { id: 1, type: 'grade', icon: '📊', title: 'تم نشر درجاتك', body: 'حصلت على 92% في اختبار React المتقدم', time: 'منذ 5 دقائق', unread: true },
  { id: 2, type: 'live', icon: '📡', title: 'الحصة المباشرة تبدأ قريباً', body: 'دورة Python — الحصة #8 تبدأ بعد 30 دقيقة', time: 'منذ 20 دقيقة', unread: true },
  { id: 3, type: 'cert', icon: '🏆', title: 'شهادتك جاهزة!', body: 'اكتملت شهادة إتمام دورة JavaScript الأساسية', time: 'منذ 2 ساعة', unread: false },
  { id: 4, type: 'guardian', icon: '✅', title: 'تمت الموافقة من ولي الأمر', body: 'وافق ولي أمرك على انضمامك للمنصة', time: 'أمس', unread: false },
]

const pageTitles: Record<string, string> = {
  'student-dashboard': 'لوحة التحكم',
  'my-courses': 'كورساتي',
  'course-catalog': 'استعراض الكورسات',
  'live-class': 'الحصص المباشرة',
  'assignments': 'الواجبات',
  'exams': 'الاختبارات',
  'certificates': 'الشهادات',
  'ai-assistant': 'المساعد الذكي',
  'profile': 'الإعدادات',
  'instructor-dashboard': 'لوحة التحكم',
  'course-builder': 'إنشاء كورس',
  'attendance-manager': 'رمز الحضور',
  'grading-manager': 'التقييمات',
  'live-controller': 'البث المباشر',
  'quiz-creator': 'اختبار جديد',
  'instructor-analytics': 'التقارير',
  'admin-dashboard': 'لوحة تحكم الإدارة',
  'kyc-review': 'طلبات التحقق',
  'course-approval': 'مراجعة الكورسات',
  'blog': 'المدونة',
}

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { page, navigate, notifOpen, setNotifOpen, logout, userName, userEmail } = useNav()
  const [search, setSearch] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)
  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        height: 'var(--header-height)',
        background: 'rgba(8,3,32,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16,
      }}>
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          style={{
            display: 'none', background: 'none', border: 'none',
            color: '#fff', cursor: 'pointer', fontSize: 22, padding: 4,
          }}
          className="max-[900px]:block"
        >☰</button>

        {/* Page title */}
        <div style={{ flex: '0 0 auto' }}>
          <h1 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>
            {pageTitles[page] || 'Edujar'}
          </h1>
        </div>

        {/* Search */}
        <div style={{ flex: 1, maxWidth: 380, position: 'relative' }}>
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

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
            style={{
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%', width: 38, height: 38,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontSize: 17, position: 'relative', flexShrink: 0,
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 3, left: 3,
                width: 16, height: 16, borderRadius: '50%',
                background: '#ef4444', fontSize: 9, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', border: '1.5px solid #080320',
              }}>{unreadCount}</span>
            )}
          </button>
        </div>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
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
                <span className="badge badge-success" style={{ marginTop: 6 }}>✓ KYC موثّق</span>
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

      {/* Notification Drawer */}
      {notifOpen && (
        <>
          <div onClick={() => setNotifOpen(false)} style={{
            position: 'fixed', inset: 0, zIndex: 149,
          }} />
          <div style={{
            position: 'fixed', top: 72, right: 24, width: 360, zIndex: 150,
            background: 'rgba(12,4,45,0.98)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
          }}>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>الإشعارات</span>
              <span className="badge badge-danger">{unreadCount} جديد</span>
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifications.map(n => (
                <div key={n.id} style={{
                  padding: '13px 18px', display: 'flex', gap: 12,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: n.unread ? 'rgba(124,58,237,0.07)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.15s',
                }}>
                  <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{n.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                      <span>{n.title}</span>
                      {n.unread && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', flexShrink: 0, marginTop: 5 }} />}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>{n.body}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{n.time}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 18px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
              <button style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, width: '100%', textAlign: 'center' }}>
                تحديد الكل كمقروء
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}