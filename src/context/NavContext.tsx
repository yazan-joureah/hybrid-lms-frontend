// src/context/NavContext.tsx
//
// NOTE: This used to be a standalone React Context holding fake/local
// auth + navigation state. It has been rewritten as a thin compatibility
// hook (`useNav`) built on top of the *real* infrastructure:
//   - react-router-dom for navigation (real URLs, back/forward, deep links)
//   - AuthContext for the authenticated user (real API calls via axios)
//
// This means every page that already called `useNav()` keeps working
// unmodified, while under the hood navigation and auth are now real.
// No <NavContext.Provider> is needed anymore — useNavigate/useLocation/
// useAuth are already context-backed hooks themselves.

import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { ApiRole } from '../types';

export type Role = 'student' | 'instructor' | 'admin' | 'superadmin';

export type Page =
  | 'landing' | 'login' | 'register' | 'forgot-password'
  | 'student-dashboard' | 'course-catalog' | 'my-courses' | 'student-checkout'
  | 'student-payments-success' | 'student-payments-failed' | 'student-transactions'
  | 'student-billing' | 'student-refund-request' | 'assignments' | 'live-class'
  | 'exams' | 'certificates' | 'ai-assistant' | 'profile'
  | 'instructor-dashboard' | 'course-builder' | 'attendance-manager'
  | 'grading-manager' | 'live-controller' | 'quiz-creator' | 'instructor-analytics'
  | 'admin-dashboard' | 'admin-payments' | 'admin-payment-detail' | 'admin-refund-requests'
  | 'user-management' | 'kyc-review' | 'course-approval' | 'refunds' | 'platform-analytics'
  | 'security-dashboard' | 'audit-log' | 'rbac' | 'data-retention'
  | 'blog'

export const PAGE_TO_PATH: Record<Page, string> = {
  landing: '/',
  login: '/login',
  register: '/register',
  'forgot-password': '/forgot-password',
  blog: '/blog',

  'student-dashboard': '/student/dashboard',
  'course-catalog': '/student/courses',
  'my-courses': '/student/my-courses',
  'student-checkout': '/student/checkout',
  'student-payments-success': '/student/payments/success',
  'student-payments-failed': '/student/payments/failed',
  'student-transactions': '/student/transactions',
  'student-billing': '/student/billing',
  'student-refund-request': '/student/refund-request',
  assignments: '/student/assignments',
  'live-class': '/student/live-class',
  exams: '/student/exams',
  certificates: '/student/certificates',
  'ai-assistant': '/student/ai-assistant',
  profile: '/profile',

  'instructor-dashboard': '/instructor/dashboard',
  'course-builder': '/instructor/course-builder',
  'attendance-manager': '/instructor/attendance-manager',
  'grading-manager': '/instructor/grading-manager',
  'live-controller': '/instructor/live-controller',
  'quiz-creator': '/instructor/quiz-creator',
  'instructor-analytics': '/instructor/analytics',

  'admin-dashboard': '/admin/dashboard',
  'admin-payments': '/admin/payments',
  'admin-payment-detail': '/admin/payments/:id',
  'admin-refund-requests': '/admin/refund-requests',
  'user-management': '/admin/users',
  'kyc-review': '/admin/kyc',
  'course-approval': '/admin/courses',
  refunds: '/admin/refunds',
  'platform-analytics': '/admin/analytics',
  'security-dashboard': '/admin/security',
  'audit-log': '/admin/audit-log',
  rbac: '/admin/rbac',
  'data-retention': '/admin/data-retention',
}

const PATH_TO_PAGE: Record<string, Page> = Object.fromEntries(
  Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page as Page])
) as Record<string, Page>

export const defaultPages: Record<Role, Page> = {
  student: 'student-dashboard',
  instructor: 'instructor-dashboard',
  admin: 'admin-dashboard',
  superadmin: 'admin-dashboard',
}

export function roleFromApiRole(apiRole?: ApiRole): Role {
  switch (apiRole) {
    case 'Instructor': return 'instructor'
    case 'Admin': return 'admin'
    case 'Student':
    default: return 'student'
  }
}

/**
 * Compatibility hook. Keeps the same shape the rest of the app already
 * depends on, but everything is now backed by real routing + a real,
 * authenticated user from AuthContext.
 */
export function useNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const auth = useAuth()

  const page: Page = PATH_TO_PAGE[location.pathname] || 'landing'
  const role: Role = roleFromApiRole(auth.user?.role)
  const isAuthenticated = !!auth.user

  const goTo = useCallback((p: Page) => {
    navigate(PAGE_TO_PATH[p] || '/')
  }, [navigate])

  // Real sign-in/sign-up now happens via useAuth().login()/register() directly
  // on the Login/Register pages. This is kept only so any legacy call site
  // still redirects to the right dashboard for the now-authenticated user.
  const login = useCallback((_r: Role) => {
    const target = defaultPages[roleFromApiRole(auth.user?.role)]
    navigate(PAGE_TO_PATH[target])
  }, [navigate, auth.user])

  const logout = useCallback(() => {
    auth.logout().finally(() => navigate('/'))
  }, [auth, navigate])

  // Role is now derived from the authenticated user, not user-settable.
  const setRole = useCallback((_r: Role) => {}, [])

  const userName = auth.user?.full_name || ''
  const setUserName = useCallback((n: string) => { void auth.updateProfile({ full_name: n }) }, [auth])

  const userEmail = auth.user?.email || ''
  // Email changes normally require a dedicated re-verification flow; not wired here.
  const setUserEmail = useCallback((_e: string) => {}, [])

  const userPhone = (auth.user?.phone as string) || ''
  const setUserPhone = useCallback((p: string) => { void auth.updateProfile({ phone: p }) }, [auth])

  const userDob = auth.user?.birth_date || ''
  // Birth date is KYC-verified server-side; not user-editable from the profile page.
  const setUserDob = useCallback((_d: string) => {}, [])

  const userBio = (auth.user?.bio as string) || ''
  const setUserBio = useCallback((b: string) => { void auth.updateProfile({ bio: b }) }, [auth])

  const userGender = (auth.user?.gender as 'male' | 'female') || 'male'
  const setUserGender = useCallback((g: 'male' | 'female') => { void auth.updateProfile({ gender: g }) }, [auth])

  // notifOpen is UI-only state and only ever read/written inside Header.tsx,
  // so it's safe to keep as local state here.
  const [notifOpen, setNotifOpen] = useState(false)

  return {
    page,
    navigate: goTo,
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
}
