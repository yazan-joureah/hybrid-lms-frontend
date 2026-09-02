// src/context/NavContext.tsx
import { createContext, useContext } from 'react'

export type Role = 'student' | 'instructor' | 'admin' | 'superadmin'

export type Page =
  | 'landing' | 'login' | 'register' | 'forgot-password' | 'verify-certificate'
  | 'guardian-manage'
  | 'student-dashboard' | 'course-catalog' | 'my-courses'
  | 'live-class' | 'certificates' | 'ai-assistant' | 'profile'
  | 'checkout' | 'payment-success' | 'payment-cancelled'
  | 'admin-payments' | 'admin-accounts' | 'admin-payment-detail'
  | 'instructor-dashboard' | 'instructor-setup' | 'course-builder'
  | 'admin-dashboard' | 'admin-setup' | 'admin-dashboard' | 'refunds' | 'privacy-policy'

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
  adminSetupIncomplete: boolean
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
  adminSetupIncomplete: false,
  refreshUser: async () => { },
})

export const useNav = () => useContext(NavContext)

// مفتاح sessionStorage لتمرير التوكن من Login.tsx (بعد فشل تسجيل الدخول
// بسبب GUARDIAN_PENDING) لصفحة GuardianManage — نفس نمط
// CHECKOUT_ENROLLMENT_KEY / SELECTED_ENROLLMENT_KEY المستخدم بالمشروع،
// لأن NavContext ما بيدعم route params حقيقية.
export const GUARDIAN_MANAGE_TOKEN_KEY = 'guardian_manage_token_pending'