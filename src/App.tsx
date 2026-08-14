import { useState, useCallback } from 'react'
import { NavContext, type Role, type Page } from './context/NavContext'
import { AuthApiProvider } from './context/AuthApiContext'
import Layout from './components/Layout'

// Public pages
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import GoogleCallback from './pages/GoogleCallback'

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

// Instructor pages
import InstructorDashboard from './pages/instructor/InstructorDashboard'
import CourseBuilder from './pages/instructor/CourseBuilder'
import AttendanceManager from './pages/instructor/AttendanceManager'
import GradingManager from './pages/instructor/GradingManager'
import LiveController from './pages/instructor/LiveController'
import QuizCreator from './pages/instructor/QuizCreator'
import InstructorAnalytics from './pages/instructor/InstructorAnalytics'

const defaultPages: Record<Role, Page> = {
  student: 'student-dashboard',
  instructor: 'instructor-dashboard',
  admin: 'admin-dashboard',
  superadmin: 'admin-dashboard',
}

// لما Google يرجع المستخدم عالموقع بعد تسجيل الدخول، بيكون فيه ?code=...&state=...
// بالرابط. بما إنه التطبيق ما بيستخدم React Router (بس page state)، لازم نتأكد
// من هاد الشي عند أول تحميل للصفحة ونفتح صفحة google-callback مباشرة.
function getInitialPage(): Page {
  const params = new URLSearchParams(window.location.search)
  if (params.get('code') && params.get('state')) {
    return 'google-callback'
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
    case 'course-builder': return <CourseBuilder />
    case 'attendance-manager': return <AttendanceManager />
    case 'grading-manager': return <GradingManager />
    case 'live-controller': return <LiveController />
    case 'quiz-creator': return <QuizCreator />
    case 'instructor-analytics': return <InstructorAnalytics />
    default: return <StudentDashboard />
  }
}

export default function App() {
  const [page, setPage] = useState<Page>(getInitialPage)
  const [role, setRoleState] = useState<Role>('student')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userName, setUserName] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [userPhone, setUserPhone] = useState('')
  const [userDob, setUserDob] = useState('')
  const [userBio, setUserBio] = useState('')
  const [userGender, setUserGender] = useState<'male' | 'female'>('male')

  const navigate = useCallback((target: Page) => setPage(target), [])

  const login = useCallback((r: Role) => {
    setRoleState(r)
    setIsAuthenticated(true)
    setPage(defaultPages[r])
  }, [])

  const logout = useCallback(() => {
    setIsAuthenticated(false)
    setPage('landing')
  }, [])

  const setRole = useCallback((r: Role) => {
    setRoleState(r)
    setPage(defaultPages[r])
  }, [])

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
  }

  if (!isAuthenticated) {
    return (
      <AuthApiProvider>
        <NavContext.Provider value={ctx}>
          {page === 'landing' && <Landing />}
          {page === 'login' && <Login />}
          {page === 'register' && <Register />}
          {page === 'forgot-password' && <ForgotPassword />}
          {page === 'google-callback' && <GoogleCallback />}
        </NavContext.Provider>
      </AuthApiProvider>
    )
  }

  return (
    <AuthApiProvider>
      <NavContext.Provider value={ctx}>
        <Layout>
          <PageContent page={page} />
        </Layout>
      </NavContext.Provider>
    </AuthApiProvider>
  )
}
