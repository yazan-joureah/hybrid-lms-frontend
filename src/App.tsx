import type { ReactNode } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { PAGE_TO_PATH, defaultPages, roleFromApiRole, type Role } from './context/NavContext'
import Layout from './components/Layout'
import DevPreview from './components/DevPreview'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Blog from './pages/Blog'
import KycSubmit from './pages/KycSubmit'

// Student pages
import StudentDashboard from './pages/student/Dashboard'
import CourseCatalog from './pages/student/CourseCatalog'
import MyCourses from './pages/student/MyCourses'
import Assignments from './pages/student/Assignments'
import LiveClass from './pages/student/LiveClass'
import Exams from './pages/student/Exams'
import Certificates from './pages/student/Certificates'
import AIAssistant from './pages/student/AIAssistant'
import StudentProfile from './pages/student/Profile'
import CheckoutPage from './pages/student/Checkout'
import CheckoutSuccess from './pages/student/CheckoutSuccess'
import CheckoutFailed from './pages/student/CheckoutFailed'
import TransactionsPage from './pages/student/Transactions'
import BillingPage from './pages/student/Billing'
import RefundRequestPage from './pages/student/RefundRequest'

// Instructor pages
import InstructorDashboard from './pages/instructor/InstructorDashboard'
import CourseBuilder from './pages/instructor/CourseBuilder'
import AttendanceManager from './pages/instructor/AttendanceManager'
import GradingManager from './pages/instructor/GradingManager'
import LiveController from './pages/instructor/LiveController'
import QuizCreator from './pages/instructor/QuizCreator'
import InstructorAnalytics from './pages/instructor/InstructorAnalytics'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPaymentsPage from './pages/admin/Payments'
import PaymentDetailPage from './pages/admin/PaymentDetail'
import RefundRequestsPage from './pages/admin/RefundRequests'

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--gradient-bg)', color: 'rgba(255,255,255,0.6)', fontSize: 14,
    }}>
      ...جارِ التحميل
    </div>
  )
}

/** Redirects an already-authenticated user away from public-only pages (login, register...). */
function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (user) {
    const role = roleFromApiRole(user.role)
    return <Navigate to={PAGE_TO_PATH[defaultPages[role]]} replace />
  }
  return <>{children}</>
}

/** Guards a whole subtree (via <Outlet/>) behind authentication + optional role check, wrapped in Layout. */
function ProtectedLayout({ allow }: { allow?: Role[] }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />
  const role = roleFromApiRole(user.role)
  if (allow && !allow.includes(role)) {
    return <Navigate to={PAGE_TO_PATH[defaultPages[role]]} replace />
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />
      <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
      <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      <Route path="/forgot-password" element={<PublicOnlyRoute><ForgotPassword /></PublicOnlyRoute>} />
      <Route path="/blog" element={<Blog />} />

      {/* Student */}
      <Route element={<ProtectedLayout allow={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/courses" element={<CourseCatalog />} />
        <Route path="/student/my-courses" element={<MyCourses />} />
        <Route path="/student/checkout" element={<CheckoutPage />} />
        <Route path="/student/payments/success" element={<CheckoutSuccess />} />
        <Route path="/student/payments/failed" element={<CheckoutFailed />} />
        <Route path="/student/transactions" element={<TransactionsPage />} />
        <Route path="/student/billing" element={<BillingPage />} />
        <Route path="/student/refund-request" element={<RefundRequestPage />} />
        <Route path="/student/assignments" element={<Assignments />} />
        <Route path="/student/live-class" element={<LiveClass />} />
        <Route path="/student/exams" element={<Exams />} />
        <Route path="/student/certificates" element={<Certificates />} />
        <Route path="/student/ai-assistant" element={<AIAssistant />} />
      </Route>

      {/* Instructor */}
      <Route element={<ProtectedLayout allow={['instructor']} />}>
        <Route path="/instructor/dashboard" element={<InstructorDashboard />} />
        <Route path="/instructor/course-builder" element={<CourseBuilder />} />
        <Route path="/instructor/attendance-manager" element={<AttendanceManager />} />
        <Route path="/instructor/grading-manager" element={<GradingManager />} />
        <Route path="/instructor/live-controller" element={<LiveController />} />
        <Route path="/instructor/quiz-creator" element={<QuizCreator />} />
        <Route path="/instructor/analytics" element={<InstructorAnalytics />} />
      </Route>

      {/* Admin */}
      {import.meta.env.DEV && (
        <Route path="/admin/payments" element={<AdminPaymentsPage />} />
      )}
      <Route element={<ProtectedLayout allow={['admin', 'superadmin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/kyc" element={<AdminDashboard />} />
        <Route path="/admin/courses" element={<AdminDashboard />} />
        {!import.meta.env.DEV && <Route path="/admin/payments" element={<AdminPaymentsPage />} />}
        <Route path="/admin/payments/:id" element={<PaymentDetailPage />} />
        <Route path="/admin/refund-requests" element={<RefundRequestsPage />} />
      </Route>

      {/* Shared for Student + Instructor KYC */}
      <Route element={<ProtectedLayout allow={['student', 'instructor']} />}>
        <Route path="/kyc/submit" element={<KycSubmit />} />
      </Route>

      {/* Shared (any authenticated role) */}
      <Route element={<ProtectedLayout />}>
        <Route path="/profile" element={<StudentProfile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
          {import.meta.env.DEV ? <DevPreview /> : null}
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
