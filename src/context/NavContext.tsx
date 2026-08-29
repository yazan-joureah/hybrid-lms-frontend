import { createContext, useContext } from 'react'

export type Role = 'student' | 'instructor' | 'admin' | 'superadmin'

export type Page =
  | 'landing' | 'login' | 'register' | 'forgot-password' | 'verify-certificate'
  | 'student-dashboard' | 'course-catalog' | 'my-courses'
  | 'live-class' | 'certificates' | 'ai-assistant' | 'profile'
  | 'checkout' | 'payment-success' | 'payment-cancelled'
  | 'admin-payments' | 'admin-payment-detail'
  | 'instructor-dashboard' | 'instructor-setup' | 'course-builder'
  | 'admin-dashboard' | 'refunds'

interface NavContextType {
  page: Page
  navigate: (p: Page) => void
  role: Role
  setRole: (r: Role) => void
  isAuthenticated: boolean
  login: (r: Role) => void
  logout: () => void
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
  kycStatus: string
  mfaEnabled: boolean
  instructorSetupIncomplete: boolean
  refreshUser: () => Promise<void>
}

export const NavContext = createContext<NavContextType>({
  page: 'landing',
  navigate: () => { },
  role: 'student',
  setRole: () => { },
  isAuthenticated: false,
  login: () => { },
  logout: () => { },
  userName: '',
  setUserName: () => { },
  userEmail: '',
  setUserEmail: () => { },
  userPhone: '',
  setUserPhone: () => { },
  userDob: '',
  setUserDob: () => { },
  userBio: '',
  setUserBio: () => { },
  userGender: 'male',
  setUserGender: () => { },
  kycStatus: 'not_submitted',
  mfaEnabled: false,
  instructorSetupIncomplete: false,
  refreshUser: async () => { },
})

export const useNav = () => useContext(NavContext)