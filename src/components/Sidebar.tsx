import { useNav } from '../context/NavContext'
import EdujarLogo from './EdujarLogo'

const StudentNav = [
  { icon: '⊞', label: 'لوحة التحكم', page: 'student-dashboard' },
  { icon: '📚', label: 'كورساتي', page: 'my-courses' },
  { icon: '🔍', label: 'استعراض الكورسات', page: 'course-catalog' },
  { icon: '📡', label: 'الحصص المباشرة', page: 'live-class' },
  { icon: '🏆', label: 'الشهادات', page: 'certificates' },
  { icon: '🤖', label: 'المساعد الذكي', page: 'ai-assistant' },
  { icon: '⚙️', label: 'الإعدادات', page: 'profile' },
] as const

const InstructorNav = [
  { icon: '⊞', label: 'لوحة التحكم', page: 'instructor-dashboard' },
  { icon: '🏗️', label: 'إنشاء كورس', page: 'course-builder' },
  { icon: '⚙️', label: 'الإعدادات', page: 'profile' },
] as const

const AdminSetupNav = [
  { icon: '🚀', label: 'إكمال الإعداد (2FA)', page: 'admin-setup' },
  { icon: '🤖', label: 'المساعد الذكي', page: 'instructor-ai-assistant' },
  { icon: '⚙️', label: 'الإعدادات', page: 'profile' },
] as const


// عناصر محدودة تُعرض للمدرّس لحد ما يكمّل KYC/MFA — بس صفحة الإعداد والملف الشخصي
const InstructorSetupNav = [
  { icon: '🚀', label: 'إكمال الإعداد', page: 'instructor-setup' },
  { icon: '⚙️', label: 'الإعدادات', page: 'profile' },
] as const

// قائمة الأدمن — KYC ومراجعة الكورسات صاروا تبويبات داخل AdminDashboard نفسها
// (وليسوا صفحات/Routes منفصلة)، فما بنحطهم كروابط Sidebar مستقلة
const AdminNav = [
  { icon: '⊞', label: 'لوحة التحكم', page: 'admin-dashboard' },
  { icon: '👥', label: 'إدارة الحسابات', page: 'admin-accounts' },
  { icon: '💳', label: 'المدفوعات', page: 'admin-payments' },
  { icon: '↩️', label: 'طلبات الاسترداد', page: 'refunds' },
  { icon: '⚙️', label: 'الإعدادات', page: 'profile' },
] as const

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const { page, navigate, logout, role, userName, userGender, instructorSetupIncomplete, adminSetupIncomplete } = useNav()

  const navItems =
    role === 'instructor'
      ? (instructorSetupIncomplete ? InstructorSetupNav : InstructorNav)
      : role === 'admin' || role === 'superadmin'
        ? (adminSetupIncomplete ? AdminSetupNav : AdminNav)
        : StudentNav

  const roleLabel =
    role === 'instructor' ? 'مدرّس'
      : role === 'admin' ? 'مشرف'
        : role === 'superadmin' ? 'مشرف عام'
          : userGender === 'female' ? 'طالبة' : 'طالب'

  return (
    <>
      {mobileOpen && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99, backdropFilter: 'blur(2px)' }} />
      )}

      <aside

        className={`sidebar-panel${mobileOpen ? ' mobile-open' : ''}`}      >
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <EdujarLogo width={130} height={34} />
        </div>

        <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {(userName || 'أ')[0]}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userName || 'مستخدم'}</div>
              <div style={{ fontSize: 11, fontWeight: 600, marginTop: 2, color: '#a855f7' }}>
                ● {roleLabel}
              </div>
            </div>
          </div>
          {(instructorSetupIncomplete || adminSetupIncomplete) && (
            <div style={{ marginTop: 8, fontSize: 11.5, color: '#fbbf24', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '6px 10px' }}>
              ⚠️ أكمل التحقق الثنائي والتوثيق لفتح كل الميزات
            </div>
          )}
        </div>

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