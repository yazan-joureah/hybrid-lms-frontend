// src/App.tsx
import { useState, useCallback, useEffect, type ReactElement } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { NavContext, type Role, type Page, GUARDIAN_MANAGE_TOKEN_KEY } from './context/NavContext'
import { AuthApiProvider, useAuthApi, normalizeRole, computeFallbackPage, type BackendUser } from './context/AuthApiContext'
import Layout from './components/Layout'
import GuestLayout from './components/GuestLayout'
import VerifyCertificate from './pages/VerifyCertificate'
import AdminActivateAccount from './pages/admin/AdminActivateAccount'
import { PAGE_TO_PATH, PATH_TO_PAGE } from './routes/pageRoutes'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import GuardianManage from './pages/GuardianManage'
import GuardianApprove from './pages/GuardianApprove'

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
import AdminAccounts from './pages/admin/AdminAccounts'
import AdminSetup from './pages/admin/AdminSetup'
import AdminRefundReview from './pages/payments/admin/AdminRefundReview'
import PrivacyPolicy from './pages/PrivacyPolicy'
import InstructorAIAssistant from './pages/instructor/AIAssistant'

// --------- Route wrappers لاستخراج params من الـ URL الحقيقي ----------
function VerifyCertificateRoute() {
  const { certificateId } = useParams<{ certificateId: string }>()
  if (!certificateId) return <Navigate to="/" replace />
  return <VerifyCertificate certificateId={decodeURIComponent(certificateId)} />
}

function AdminActivateRoute() {
  const [params] = useSearchParams()
  return <AdminActivateAccount emailFromQuery={params.get('email') || ''} />
}

function GuardianManageRoute() {
  const [params] = useSearchParams()
  // التوكن ممكن يجي من رابط الإيميل مباشرة (?token=...) عند فتح الصفحة أول
  // مرة، أو يكون محفوظ بـ sessionStorage لو المستخدم وصلها بعد محاولة
  // تسجيل دخول فاشلة (GUARDIAN_PENDING) داخل التطبيق نفسه.
  const token = params.get('token') || sessionStorage.getItem(GUARDIAN_MANAGE_TOKEN_KEY) || ''
  return <GuardianManage token={token} />
}

function GuardianApproveRoute() {
  const [params] = useSearchParams()
  // بعكس GuardianManage: لا نلجأ لـ sessionStorage هنا — رابط الموافقة
  // يصل حصراً عبر بريد ولي الأمر (?token=...)، ولا سيناريو يستدعي تمريره
  // عبر التطبيق داخلياً كما يحصل مع GUARDIAN_PENDING عند الطالب.
  const token = params.get('token') || ''
  return <GuardianApprove token={token} />
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

const adminRestrictedPages: Page[] = [
  'admin-dashboard', 'admin-accounts', 'admin-payments', 'admin-payment-detail', 'refunds',
]

// نفس فكرة instructorRestrictedPages تماماً — لكن للطالب المُعلَّق بـ
// age_flagged: يُسمح له فقط بالوصول لصفحة البروفايل (لإرسال طلب تصحيح
// العمر)، وأي محاولة وصول لأي محتوى تعليمي أو دفع تُعاد لصفحة البروفايل.
const studentRestrictedPages: Page[] = [
  'student-dashboard', 'course-catalog', 'my-courses', 'live-class',
  'certificates', 'ai-assistant', 'checkout',
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
  // ← جديد: نفس الشكل تماماً — طالب بحالة age_flagged يُعامَل كحساب
  // "مقفول جزئياً" بنفس أسلوب المدرّس غير المكتمل الإعداد، فرق واحد فقط:
  // الوجهة المسموحة هنا هي /profile بدل /instructor/setup.
  const studentAgeFlagged = role === 'student' && kycStatus === 'age_flagged'
  const adminSetupIncomplete = (role === 'admin' || role === 'superadmin') && !mfaEnabled

  // ✅ الصفحة الحالية مشتقة من الـ URL الحقيقي، مش من state محلي
  const page: Page =
    location.pathname.startsWith('/verify/')
      ? 'verify-certificate'
      : (PATH_TO_PAGE[location.pathname] as Page) || 'landing'

  const fallbackPathForRole = useCallback((r: Role) => {
    if (r === 'instructor') {
      return instructorSetupIncomplete ? PAGE_TO_PATH['instructor-setup'] : PAGE_TO_PATH['instructor-dashboard']
    }
    if (r === 'admin' || r === 'superadmin') {
      return adminSetupIncomplete ? PAGE_TO_PATH['admin-setup'] : PAGE_TO_PATH['admin-dashboard']
    }
    if (r === 'student' && studentAgeFlagged) {
      return PAGE_TO_PATH['profile']
    }
    return PAGE_TO_PATH['student-dashboard']
  }, [instructorSetupIncomplete, adminSetupIncomplete, studentAgeFlagged])

  // ✅ نفس توقيع navigate(page) القديم تمامًا — كل الصفحات (~50 ملف) بتضل شغالة بدون أي تعديل
  const navigate = useCallback((target: Page) => {
    if (instructorSetupIncomplete && instructorRestrictedPages.includes(target)) {
      routerNavigate(PAGE_TO_PATH['instructor-setup'])
      return
    }
    if (adminSetupIncomplete && adminRestrictedPages.includes(target)) {
      routerNavigate(PAGE_TO_PATH['admin-setup'])
      return
    }
    if (studentAgeFlagged && studentRestrictedPages.includes(target)) {
      routerNavigate(PAGE_TO_PATH['profile'])
      return
    }
    const path = PAGE_TO_PATH[target as Exclude<Page, 'verify-certificate'>]
    if (path) routerNavigate(path)
  }, [instructorSetupIncomplete, adminSetupIncomplete, studentAgeFlagged, routerNavigate])

  const applyUserSnapshot = (user: BackendUser) => {
    setUserName(user.full_name || '')
    setUserEmail(user.email || '')
    setKycStatus(user.kyc_status || 'not_submitted')
    setMfaEnabled(!!user.mfa_enabled)
  }

  const login = useCallback((r: Role, kyc?: string, mfa?: boolean) => {
    setRoleState(r)
    setIsAuthenticated(true)
    // نطبّق القيم الحقيقية القادمة مباشرة من استجابة تسجيل الدخول (بدل
    // الانتظار لدورة refreshUser لاحقة من Layout مثلاً) — هذا يمنع state
    // قديمة (mfaEnabled الافتراضية false) من التسبب بتوجيه خاطئ مؤقت
    // لصفحة setup ثم تصحيحه تلقائياً بعد ثانية (الفليكر).
    if (kyc !== undefined) setKycStatus(kyc)
    if (mfa !== undefined) setMfaEnabled(mfa)
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
    kycStatus, mfaEnabled, instructorSetupIncomplete, adminSetupIncomplete, refreshUser,
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

  // نفس فكرة instructorRoute تماماً — يُطبَّق على كل مسارات محتوى الطالب
  const studentRoute = (element: ReactElement) =>
    studentAgeFlagged ? <Navigate to="/profile" replace /> : <Layout>{element}</Layout>

  const adminRoute = (element: ReactElement) =>
    adminSetupIncomplete ? <Navigate to="/admin/setup" replace /> : <Layout>{element}</Layout>

  return (
    <NavContext.Provider value={ctx}>
      <Routes>
        <Route path="/verify/:certificateId" element={<VerifyCertificateRoute />} />
        <Route path="/admin/activate" element={<AdminActivateRoute />} />
        <Route path="/auth/guardian/manage" element={<GuardianManageRoute />} />
        <Route path="/auth/guardian/approve" element={<GuardianApproveRoute />} />
        {!isAuthenticated && (
          <>
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/courses" element={<GuestLayout><CourseCatalog /></GuestLayout>} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        )}

        {isAuthenticated && (
          <>
            <Route path="/payment/success" element={<Layout><PaymentSuccessRoute /></Layout>} />
            <Route path="/payment/cancelled" element={<Layout><PaymentCancelledRoute /></Layout>} />

            <Route path="/dashboard" element={studentRoute(<StudentDashboard />)} />
            <Route path="/courses" element={studentRoute(<CourseCatalog />)} />
            <Route path="/my-courses" element={studentRoute(<MyCourses />)} />
            <Route path="/my-courses/:enrollmentId" element={studentRoute(<MyCourses />)} />
            <Route path="/live" element={studentRoute(<LiveClass />)} />
            <Route path="/certificates" element={studentRoute(<Certificates />)} />
            <Route path="/ai-assistant" element={studentRoute(<AIAssistant />)} />
            <Route path="/profile" element={<Layout><StudentProfile /></Layout>} />
            <Route path="/checkout/:enrollmentId" element={studentRoute(<Checkout />)} />

            <Route path="/admin/setup" element={<Layout><AdminSetup /></Layout>} />
            <Route path="/admin" element={adminRoute(<AdminDashboard />)} />
            <Route path="/admin/accounts" element={adminRoute(<AdminAccounts />)} />
            <Route path="/admin/payments" element={adminRoute(<AdminPayments />)} />
            <Route path="/admin/payments/:paymentId" element={adminRoute(<AdminPaymentDetail />)} />
            <Route path="/admin/refunds" element={adminRoute(<AdminRefundReview />)} />

            <Route path="/instructor" element={instructorRoute(<InstructorDashboard />)} />
            <Route path="/instructor/setup" element={<Layout><InstructorSetup /></Layout>} />
            <Route path="/instructor/courses" element={instructorRoute(<CourseBuilder />)} />
            <Route path="/instructor/ai-assistant'" element={instructorRoute(<InstructorAIAssistant />)} />

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