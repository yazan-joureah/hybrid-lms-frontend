// src/App.tsx
import { useState, useCallback, useEffect } from 'react'
import { NavContext, type Role, type Page } from './context/NavContext'
import { AuthApiProvider, useAuthApi, normalizeRole, computeFallbackPage, type BackendUser } from './context/AuthApiContext'
import Layout from './components/Layout'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'

import StudentDashboard from './pages/student/Dashboard'
import CourseCatalog from './pages/student/CourseCatalog'
import MyCourses from './pages/student/MyCourses'
import Assignments from './pages/student/Assignments'
import LiveClass from './pages/student/LiveClass'
import Exams from './pages/student/Exams'
import Certificates from './pages/student/Certificates'
import AIAssistant from './pages/student/AIAssistant'
import StudentProfile from './pages/student/Profile'

import InstructorDashboard from './pages/instructor/InstructorDashboard'
import InstructorSetup from './pages/instructor/InstructorSetup'
import CourseBuilder from './pages/instructor/CourseBuilder'
import AttendanceManager from './pages/instructor/AttendanceManager'
import GradingManager from './pages/instructor/GradingManager'
import LiveController from './pages/instructor/LiveController'
import QuizCreator from './pages/instructor/QuizCreator'
import InstructorAnalytics from './pages/instructor/InstructorAnalytics'

import AdminDashboard from './pages/admin/AdminDashboard'
// ملاحظة: KycReview.tsx لم يعد مستخدمًا كصفحة مستقلة — تم دمج منطقها
// كتبويب داخل AdminDashboard.tsx (راجع الرد السابق). يمكن حذف الملف
// أو إبقاؤه غير مستورد إذا كنت تفضل الاحتفاظ به كمرجع.

function getInitialPage(): Page {
  const params = new URLSearchParams(window.location.search)
  if (params.get('oauth_step') || params.get('oauth_error')) {
    return 'login'
  }
  return 'landing'
}

function PageContent({ page }: { page: Page }) {
  switch (page) {
    case 'student-dashboard': return <StudentDashboard />
    case 'course-catalog': return <CourseCatalog />
    case 'my-courses': return <MyCourses />
    case 'assignments': return <Assignments />
    case 'live-class': return <LiveClass />
    case 'exams': return <Exams />
    case 'certificates': return <Certificates />
    case 'ai-assistant': return <AIAssistant />
    case 'profile': return <StudentProfile />
    case 'instructor-dashboard': return <InstructorDashboard />
    case 'instructor-setup': return <InstructorSetup />
    case 'course-builder': return <CourseBuilder />
    case 'attendance-manager': return <AttendanceManager />
    case 'grading-manager': return <GradingManager />
    case 'live-controller': return <LiveController />
    case 'quiz-creator': return <QuizCreator />
    case 'instructor-analytics': return <InstructorAnalytics />
    case 'admin-dashboard': return <AdminDashboard />
    default: return <StudentDashboard />
  }
}

function AppShell() {
  const { restoreSession, logout: apiLogout, getCurrentUser } = useAuthApi()

  const [page, setPageState] = useState<Page>(getInitialPage)
  const [role, setRoleState] = useState<Role>('student')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [restoring, setRestoring] = useState(true)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userDob, setUserDob] = useState('')
  const [userBio, setUserBio] = useState('')
  const [userGender, setUserGender] = useState<'male' | 'female'>('male')

  const [kycStatus, setKycStatus] = useState('not_submitted')
  const [mfaEnabled, setMfaEnabled] = useState(false)

  const instructorSetupIncomplete = role === 'instructor' && (!mfaEnabled || kycStatus !== 'verified')

  const instructorRestrictedPages: Page[] = [
    'instructor-dashboard', 'course-builder', 'attendance-manager',
    'grading-manager', 'live-controller', 'quiz-creator', 'instructor-analytics',
  ]

  // صفحات أدمن فقط — أي navigate() لهدف هون من دور غير admin/superadmin
  // بيرجّع المستخدم لداشبورده الطبيعي بدل ما يفتحلها.
  // ⚠️ دي حماية فرونت بس (تجربة استخدام)، مش أمان فعلي — الأمان الحقيقي
  // لازم middleware بالباك يتحقق من الدور على كل مسار /admin/*.
  const adminOnlyPages: Page[] = [
    'admin-dashboard', 'user-management', 'kyc-review', 'course-approval',
    'refunds', 'platform-analytics', 'security-dashboard', 'audit-log',
    'rbac', 'data-retention',
  ]

  const defaultPageForRole = useCallback((r: Role): Page => {
    if (r === 'instructor') return instructorSetupIncomplete ? 'instructor-setup' : 'instructor-dashboard'
    if (r === 'admin' || r === 'superadmin') return 'admin-dashboard'
    return 'student-dashboard'
  }, [instructorSetupIncomplete])

  const navigate = useCallback((target: Page) => {
    if (adminOnlyPages.includes(target) && role !== 'admin' && role !== 'superadmin') {
      setPageState(defaultPageForRole(role))
      return
    }
    if (instructorSetupIncomplete && instructorRestrictedPages.includes(target)) {
      setPageState('instructor-setup')
      return
    }
    setPageState(target)
  }, [instructorSetupIncomplete, role, defaultPageForRole])

  // لو الدور تغيّر ونحن واقفين أصلاً على صفحة أدمن (مثلاً بعد refreshUser)،
  // منطلع منها فورًا.
  useEffect(() => {
    if (adminOnlyPages.includes(page) && role !== 'admin' && role !== 'superadmin') {
      setPageState(defaultPageForRole(role))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, page])

  const applyUserSnapshot = (user: BackendUser) => {
    setUserName(user.full_name || '')
    setUserEmail(user.email || '')
    setKycStatus(user.kyc_status || 'not_submitted')
    setMfaEnabled(!!user.mfa_enabled)
  }

  const login = useCallback((r: Role) => {
    setRoleState(r)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setIsAuthenticated(false)
    setRoleState('student')
    setUserName('')
    setUserEmail('')
    setUserPhone('')
    setUserDob('')
    setUserBio('')
    setUserGender('male')
    setKycStatus('not_submitted')
    setMfaEnabled(false)
    setPageState('landing')
  }, [apiLogout])

  const setRole = useCallback((r: Role) => {
    setRoleState(r)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const user = await getCurrentUser()
      applyUserSnapshot(user)
      const newRole = normalizeRole(user.role)
      if (newRole !== role) setRoleState(newRole)
    } catch (err) {
      await logout()
    }
  }, [getCurrentUser, logout, role])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const googleSuccess = params.get('auth') === 'google_success'
    const midOAuthFlow = params.get('oauth_step') || params.get('oauth_error')
    const hasSession = localStorage.getItem('session_active') === 'true'

    if (midOAuthFlow || (!hasSession && !googleSuccess)) {
      setRestoring(false)
      return
    }

    restoreSession().then(async (res) => {
      if (res.success && res.user) {
        const restoredRole = normalizeRole(res.user.role)
        applyUserSnapshot(res.user)
        setRoleState(restoredRole)
        setIsAuthenticated(true)
        if (googleSuccess) {
          window.history.replaceState({}, '', window.location.pathname)
          setPageState(computeFallbackPage(res.user))
        }
      } else if (googleSuccess) {
        window.history.replaceState({}, '', window.location.pathname)
        setPageState('login')
      }
      setRestoring(false)
    })
  }, [restoreSession])

  const ctx = {
    page,
    navigate,
    role,
    setRole,
    isAuthenticated,
    login,
    logout,
    notifOpen,
    setNotifOpen,
    userName,
    setUserName,
    userEmail,
    setUserEmail,
    userPhone,
    setUserPhone,
    userDob,
    setUserDob,
    userBio,
    setUserBio,
    userGender,
    setUserGender,
    kycStatus,
    mfaEnabled,
    instructorSetupIncomplete,
    refreshUser,
  }

  if (restoring) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #080320 0%, #1a0550 40%, #0d0340 100%)' }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>...جارٍ التحميل</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <NavContext.Provider value={ctx}>
        {page === 'landing' && <Landing />}
        {page === 'login' && <Login />}
        {page === 'register' && <Register />}
        {page === 'forgot-password' && <ForgotPassword />}
      </NavContext.Provider>
    )
  }

  return (
    <NavContext.Provider value={ctx}>
      <Layout>
        <PageContent page={page} />
      </Layout>
    </NavContext.Provider>
  )
}

export default function App() {
  return (
    <AuthApiProvider>
      <AppShell />
    </AuthApiProvider>
  )
}