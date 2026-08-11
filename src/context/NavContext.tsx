import { createContext, useContext } from 'react'

export type Role = 'student' | 'instructor' | 'admin' | 'superadmin'

export type Page =
  | 'landing' | 'login' | 'register' | 'forgot-password'
  | 'student-dashboard' | 'course-catalog' | 'my-courses' | 'assignments'
  | 'live-class' | 'exams' | 'certificates' | 'ai-assistant' | 'profile'
  | 'instructor-dashboard' | 'course-builder' | 'attendance-manager'
  | 'grading-manager' | 'live-controller' | 'quiz-creator' | 'instructor-analytics'
  | 'admin-dashboard' | 'user-management' | 'kyc-review' | 'course-approval'
  | 'refunds' | 'platform-analytics'
  | 'security-dashboard' | 'audit-log' | 'rbac' | 'data-retention'

interface NavContextType {
  page: Page
  navigate: (p: Page) => void
  role: Role
  setRole: (r: Role) => void
  isAuthenticated: boolean
  login: (r: Role) => void
  logout: () => void
  notifOpen: boolean
  setNotifOpen: (v: boolean) => void
  userName: string
  setUserName: (n: string) => void
  userEmail: string
  setUserEmail: (e: string) => void
  userPhone: string
  setUserPhone: (p: string) => void
  userDob: string
  setUserDob: (d: string) => void
  userBio: string
  setUserBio: (b: string) => void
  userGender: 'male' | 'female'
  setUserGender: (g: 'male' | 'female') => void
}

export const NavContext = createContext<NavContextType>({
  page: 'landing',
  navigate: () => {},
  role: 'student',
  setRole: () => {},
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  notifOpen: false,
  setNotifOpen: () => {},
  userName: '',
  setUserName: () => {},
  userEmail: '',
  setUserEmail: () => {},
  userPhone: '',
  setUserPhone: () => {},
  userDob: '',
  setUserDob: () => {},
  userBio: '',
  setUserBio: () => {},
  userGender: 'male',
  setUserGender: () => {},
})

export const useNav = () => useContext(NavContext)