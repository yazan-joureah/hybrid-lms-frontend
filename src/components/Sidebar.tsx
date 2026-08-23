import { useNav } from '../context/NavContext'
import EdujarLogo from './EdujarLogo'

const StudentNav = [
  { icon: '⊞', label: 'لوحة التحكم', page: 'student-dashboard' },
  { icon: '📚', label: 'كورساتي', page: 'my-courses' },
  { icon: '🔍', label: 'استعراض الكورسات', page: 'course-catalog' },
  { icon: '💳', label: 'الدفع والاشتراك', page: 'student-billing' },
  { icon: '🧾', label: 'معاملاتي', page: 'student-transactions' },
  { icon: '↩️', label: 'طلب استرداد', page: 'student-refund-request' },
  { icon: '📡', label: 'الحصص المباشرة', page: 'live-class' },
  { icon: '📝', label: 'الواجبات', page: 'assignments' },
  { icon: '📊', label: 'الاختبارات', page: 'exams' },
  { icon: '🏆', label: 'الشهادات', page: 'certificates' },
  { icon: '🤖', label: 'المساعد الذكي', page: 'ai-assistant' },
  { icon: '⚙️', label: 'الإعدادات', page: 'profile' },
] as const

const InstructorNav = [
  { icon: '⊞', label: 'لوحة التحكم', page: 'instructor-dashboard' },
  { icon: '🏗️', label: 'إنشاء كورس', page: 'course-builder' },
  { icon: '✅', label: 'رمز الحضور', page: 'attendance-manager' },
  { icon: '📝', label: 'التقييمات', page: 'grading-manager' },
  { icon: '📡', label: 'البث المباشر', page: 'live-controller' },
  { icon: '🧠', label: 'اختبار جديد', page: 'quiz-creator' },
  { icon: '📈', label: 'التقارير', page: 'instructor-analytics' },
  { icon: '⚙️', label: 'الإعدادات', page: 'profile' },
] as const

const AdminNav = [
  { icon: '⊞', label: 'لوحة التحكم', page: 'admin-dashboard' },
  { icon: '💳', label: 'المدفوعات', page: 'admin-payments' },
  { icon: '↩️', label: 'طلبات الاسترداد', page: 'admin-refund-requests' },
  { icon: '🪪', label: 'طلبات التحقق (KYC)', page: 'kyc-review' },
  { icon: '📚', label: 'مراجعة الكورسات', page: 'course-approval' },
] as const

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { page, navigate, logout, role, userName, userGender } = useNav()
  const navItems = role === 'instructor' ? InstructorNav : (role === 'admin' || role === 'superadmin') ? AdminNav : StudentNav

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 99, backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 'var(--sidebar-width)',
          height: '100vh',
          background: 'rgba(12,4,45,0.96)',
          backdropFilter: 'blur(30px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
          transform: mobileOpen ? 'translateX(0)' : undefined,
        }}
        className="max-[900px]:translate-x-full max-[900px]:hidden"
      >
        {/* Logo */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <EdujarLogo width={130} height={34} />
        </div>

        {/* User info */}
        <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 10,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{(userName || 'أ')[0]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName || 'مستخدم'}</div>
              <div style={{
                fontSize: 11, fontWeight: 600, marginTop: 2,
                color: '#a855f7',
              }}>
                ● {role === 'instructor' ? 'مدرّس' : (role === 'admin' || role === 'superadmin') ? 'مسؤول' : userGender === 'female' ? 'طالبة' : 'طالب'}
              </div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '10px 12px', overflowY: 'auto' }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '4px 6px 8px' }}>
            القائمة الرئيسية
          </div>
          {navItems.map((item) => (
            <button
              key={item.page}
              className={`nav-item${page === item.page ? ' active' : ''}`}
              style={{ width: '100%', textAlign: 'right', border: 'none', marginBottom: 2 }}
              onClick={() => { navigate(item.page as any); onClose() }}
            >
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13.5 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10, border: 'none',
              background: 'rgba(239,68,68,0.1)', color: '#f87171',
              cursor: 'pointer', fontSize: 13.5, fontWeight: 500,
              fontFamily: 'inherit', transition: 'background 0.15s',
            }}
          >
            <span style={{ fontSize: 16 }}>🚪</span>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  )
}