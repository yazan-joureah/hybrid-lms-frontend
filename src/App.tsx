// src/App.tsx
import { useState, useCallback, useEffect, type ReactElement } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { NavContext, type Role, type Page } from './context/NavContext'
import { AuthApiProvider, useAuthApi, normalizeRole, computeFallbackPage, type BackendUser } from './context/AuthApiContext'
import Layout from './components/Layout'
import GuestLayout from './components/GuestLayout'
import VerifyCertificate from './pages/VerifyCertificate'
import { PAGE_TO_PATH, PATH_TO_PAGE } from './routes/pageRoutes'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'

import StudentDashboard from './pages/student/Dashboard'
import CourseCatalog from './pages/student/CourseCatalog'
import MyCourses from './pages/student/MyCourses'
import LiveClass from './pages/student/LiveClass'
import Certificates from './pages/student/Certificates'
import AIAssistant from './pages/student/AIAssistant'
import StudentProfile from './pages/student/Profile'

import Checkout from './pages/payments/student/Checkout'
import PaymentSuccess from './pages/payments/student/PaymentSuccess'
import PaymentCancelled from './pages/payments/student/PaymentCancelled'
import AdminPayments from './pages/payments/admin/AdminPayments'
import AdminPaymentDetail from './pages/payments/admin/AdminPaymentDetail'

import InstructorDashboard from './pages/instructor/InstructorDashboard'
import InstructorSetup from './pages/instructor/InstructorSetup'
import CourseBuilder from './pages/instructor/CourseBuilder'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminRefundReview from './pages/payments/admin/AdminRefundReview'

// ---------- Route wrappers لاستخراج params من الـ URL الحقيقي ----------
function VerifyCertificateRoute() {
  const { certificateId } = useParams<{ certificateId: string }>()
  if (!certificateId) return <Navigate to="/" replace />
  return <VerifyCertificate certificateId={decodeURIComponent(certificateId)} />
}

function PaymentSuccessRoute() {
  const [params] = useSearchParams()
  return <PaymentSuccess paymentId={params.get('payment_id')} />
}

function PaymentCancelledRoute() {
  const [params] = useSearchParams()
  return <PaymentCancelled paymentId={params.get('payment_id')} />
}

const instructorRestrictedPages: Page[] = [
  'instructor-dashboard', 'course-builder',
]

function AppShell() {
  const { restoreSession, logout: apiLogout, getCurrentUser } = useAuthApi()
  const routerNavigate = useNavigate()
  const location = useLocation()

  const [role, setRoleState] = useState<Role>('student')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [restoring, setRestoring] = useState(true)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userDob, setUserDob] = useState('')
  const [userBio, setUserBio] = useState('')
  const [userGender, setUserGender] = useState<'male' | 'female'>('male')

  const [kycStatus, setKycStatus] = useState('not_submitted')
  const [mfaEnabled, setMfaEnabled] = useState(false)

  const instructorSetupIncomplete = role === 'instructor' && (!mfaEnabled || kycStatus !== 'verified')

  // ✅ الصفحة الحالية مشتقة من الـ URL الحقيقي، مش من state محلي
  const page: Page =
    location.pathname.startsWith('/verify/')
      ? 'verify-certificate'
      : (PATH_TO_PAGE[location.pathname] as Page) || 'landing'

  const fallbackPathForRole = useCallback((r: Role) => {
    if (r === 'instructor') {
      return instructorSetupIncomplete ? PAGE_TO_PATH['instructor-setup'] : PAGE_TO_PATH['instructor-dashboard']
    }
    if (r === 'admin' || r === 'superadmin') return PAGE_TO_PATH['admin-dashboard']
    return PAGE_TO_PATH['student-dashboard']
  }, [instructorSetupIncomplete])

  // ✅ نفس توقيع navigate(page) القديم تمامًا — كل الصفحات (~50 ملف) بتضل شغالة بدون أي تعديل
  const navigate = useCallback((target: Page) => {
    if (instructorSetupIncomplete && instructorRestrictedPages.includes(target)) {
      routerNavigate(PAGE_TO_PATH['instructor-setup'])
      return
    }
    const path = PAGE_TO_PATH[target as Exclude<Page, 'verify-certificate'>]
    if (path) routerNavigate(path)
  }, [instructorSetupIncomplete, routerNavigate])

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
    routerNavigate('/', { replace: true })
  }, [apiLogout, routerNavigate])

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
    const isPaymentSuccessPath = window.location.pathname === '/payment/success'
    const isPaymentCancelledPath = window.location.pathname === '/payment/cancelled'
    const isPaymentRedirect = isPaymentSuccessPath || isPaymentCancelledPath
    const midOAuthFlow = params.get('oauth_step') || params.get('oauth_error')
    const hasSession = localStorage.getItem('session_active') === 'true'
    const isVerifyPage = window.location.pathname.startsWith('/verify/')

    if (isVerifyPage || midOAuthFlow || (!hasSession && !googleSuccess && !isPaymentRedirect)) {
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
          const fallbackPage = computeFallbackPage(res.user) as Exclude<Page, 'verify-certificate'>
          routerNavigate(PAGE_TO_PATH[fallbackPage], { replace: true })
        } else if (isPaymentRedirect) {
          // المسار صحيح أصلًا (/payment/success أو /payment/cancelled) — بس منضل بنفس مكاننا
        }
      } else if (googleSuccess) {
        routerNavigate('/login', { replace: true })
      } else if (isPaymentRedirect) {
        routerNavigate('/login', { replace: true })
      }
      setRestoring(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restoreSession])

  const ctx = {
    page, navigate, role, setRole, isAuthenticated, login, logout,
    userName, setUserName, userEmail, setUserEmail, userPhone, setUserPhone,
    userDob, setUserDob, userBio, setUserBio, userGender, setUserGender,
    kycStatus, mfaEnabled, instructorSetupIncomplete, refreshUser,
  }

  if (restoring) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #080320 0%, #1a0550 40%, #0d0340 100%)' }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>...جارٍ التحميل</div>
      </div>
    )
  }

  const instructorRoute = (element: ReactElement) =>
    instructorSetupIncomplete ? <Navigate to="/instructor/setup" replace /> : <Layout>{element}</Layout>

  return (
    <NavContext.Provider value={ctx}>
      <Routes>
        <Route path="/verify/:certificateId" element={<VerifyCertificateRoute />} />

        {!isAuthenticated && (
          <>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/courses" element={<GuestLayout><CourseCatalog /></GuestLayout>} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {isAuthenticated && (
          <>
            <Route path="/payment/success" element={<Layout><PaymentSuccessRoute /></Layout>} />
            <Route path="/payment/cancelled" element={<Layout><PaymentCancelledRoute /></Layout>} />

            <Route path="/dashboard" element={<Layout><StudentDashboard /></Layout>} />
            <Route path="/courses" element={<Layout><CourseCatalog /></Layout>} />
            <Route path="/my-courses" element={<Layout><MyCourses /></Layout>} />
            <Route path="/my-courses/:enrollmentId" element={<Layout><MyCourses /></Layout>} />
            <Route path="/live" element={<Layout><LiveClass /></Layout>} />
            <Route path="/certificates" element={<Layout><Certificates /></Layout>} />
            <Route path="/ai-assistant" element={<Layout><AIAssistant /></Layout>} />
            <Route path="/profile" element={<Layout><StudentProfile /></Layout>} />
            <Route path="/checkout/:enrollmentId" element={<Layout><Checkout /></Layout>} />

            <Route path="/admin" element={<Layout><AdminDashboard /></Layout>} />
            <Route path="/admin/payments" element={<Layout><AdminPayments /></Layout>} />
            <Route path="/admin/payments/:paymentId" element={<Layout><AdminPaymentDetail /></Layout>} />
            <Route path="/admin/refunds" element={<Layout><AdminRefundReview /></Layout>} />

            <Route path="/instructor" element={instructorRoute(<InstructorDashboard />)} />
            <Route path="/instructor/setup" element={<Layout><InstructorSetup /></Layout>} />
            <Route path="/instructor/courses" element={instructorRoute(<CourseBuilder />)} />

            <Route path="*" element={<Navigate to={fallbackPathForRole(role)} replace />} />
          </>
        )}
      </Routes>
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