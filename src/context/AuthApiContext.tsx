// src/context/AuthApiContext.tsx
//
// هاد Context منفصل تمامًا عن NavContext — مسؤوليته الوحيدة هي التواصل
// مع الباك (login/register/verify/reset/google...). ما بيلمس أي state تبع
// التنقل أو بيانات المستخدم المحلية — هاي تضل مسؤولية NavContext متل ما هي.
//
import { createContext, useContext, useState, type ReactNode } from 'react'
import API, { BASE_URL } from '../config/api'

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
  birth_date: string
  role: string
  guardian_email?: string
  privacy_consent_version?: string
}

export interface BackendUser {
  id?: string
  full_name?: string
  email?: string
  role?: string
  [key: string]: any
}

// أنواع نتائج استدعاء الـ Google callback — نفس الاحتمالات يلي بالباك الأصلي
export type GoogleCallbackResult =
  | { kind: 'authenticated'; user: BackendUser }
  | { kind: 'mfa_required'; mfaTempToken: string }
  | { kind: 'requires_birth_date'; token: string }
  | { kind: 'requires_link_confirmation'; token: string }

function extractErrorMessage(err: any): string {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    'حدث خطأ غير متوقع. حاول مرة أخرى.'
  )
}

// كود الخطأ المحدد يلي راجع من الباك — نفس القيم يلي بكود صاحبك بالضبط
// (INVALID_CODE, CODE_EXPIRED, TOO_MANY_ATTEMPTS...) عشان نعرض رسالة دقيقة
// بدل رسالة عامة
function extractErrorCode(err: any): string | undefined {
  return err?.response?.data?.error?.code
}

// رسائل مترجمة مطابقة تمامًا لمنطق كود صاحبك (نفس الأكواد، نفس الحالات)
export function getCodeErrorMessage(err: any, fallback: string): string {
  const code = extractErrorCode(err)
  if (code === 'INVALID_CODE') return 'الرمز غير صحيح، حاول مرة أخرى.'
  if (code === 'CODE_EXPIRED') return 'انتهت صلاحية الرمز، اطلب رمزاً جديداً.'
  if (code === 'TOO_MANY_ATTEMPTS') return 'محاولات كثيرة جداً، اطلب رمزاً جديداً بعد قليل.'
  return fallback || extractErrorMessage(err)
}

// الباك (حسب كود صاحبك) بيتوقع القيمة بأحرف كبيرة بالحرف الأول: Student / Instructor
export function mapRoleToBackend(role: string): string {
  const known: Record<string, string> = { student: 'Student', instructor: 'Instructor', admin: 'Admin', superadmin: 'Superadmin' }
  return known[role.toLowerCase()] || 'Student'
}

interface AuthApiContextType {
  login: (email: string, password: string) => Promise<{ mfaRequired?: boolean; user?: BackendUser }>
  verifyMfa: (code: string) => Promise<{ user?: BackendUser }>
  register: (payload: RegisterPayload) => Promise<any>
  verifyEmail: (email: string, code: string) => Promise<any>
  resendVerification: (email: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
  // Google OAuth
  googleLogin: () => void
  googleCallback: (code: string, state: string) => Promise<GoogleCallbackResult>
  googleRegisterConfirm: (token: string, birthDate: string) => Promise<{ user?: BackendUser; requiresGuardianEmail?: boolean; guardianPendingToken?: string }>
  googleLinkConfirm: (token: string, password: string) => Promise<{ user?: BackendUser }>
  googleGuardianEmail: (token: string, guardianEmail: string) => Promise<void>
  getErrorMessage: (err: any) => string
}

const AuthApiContext = createContext<AuthApiContextType | undefined>(undefined)

export function AuthApiProvider({ children }: { children: ReactNode }) {
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null)

  const fetchProfile = async (): Promise<BackendUser> => {
    const res = await API.get('/users/me')
    return res.data?.data
  }

  const setSession = async (token: string): Promise<BackendUser> => {
    localStorage.setItem('session_active', 'true')
    API.defaults.headers.common.Authorization = `Bearer ${token}`
    return fetchProfile()
  }

  const login: AuthApiContextType['login'] = async (email, password) => {
    const res = await API.post('/auth/login', { email, password })
    const data = res.data?.data

    if (data?.mfa_required) {
      setMfaTempToken(data.mfa_temp_token)
      return { mfaRequired: true }
    }

    const token = data?.access_token
    if (!token) throw new Error('لم يتم استلام رمز الدخول من الخادم')
    const user = await setSession(token)
    return { user }
  }

  const verifyMfa: AuthApiContextType['verifyMfa'] = async (code) => {
    if (!mfaTempToken) throw new Error('لا توجد جلسة تحقق ثنائي نشطة، حاول تسجيل الدخول من جديد')
    const res = await API.post('/auth/mfa/login/verify', { mfaTempToken, code })
    const token = res.data?.data?.access_token
    if (!token) throw new Error('لم يتم استلام رمز الدخول من الخادم')
    const user = await setSession(token)
    setMfaTempToken(null)
    return { user }
  }

  const register: AuthApiContextType['register'] = async (payload) => {
    const cleanPayload = { ...payload }
    if (!cleanPayload.guardian_email) delete cleanPayload.guardian_email
    const res = await API.post('/auth/register', cleanPayload)
    return res.data?.data
  }

  const verifyEmail: AuthApiContextType['verifyEmail'] = async (email, code) => {
    const res = await API.post('/auth/verify-email', { email, code })
    return res.data?.data
  }

  const resendVerification: AuthApiContextType['resendVerification'] = async (email) => {
    await API.post('/auth/resend-verification', { email })
  }

  const forgotPassword: AuthApiContextType['forgotPassword'] = async (email) => {
    await API.post('/auth/forgot-password', { email })
  }

  const resetPassword: AuthApiContextType['resetPassword'] = async (email, code, newPassword) => {
    await API.post('/auth/reset-password', { email, code, new_password: newPassword })
  }

  // ---------- Google OAuth ----------

  // بيوديك على صفحة Google نفسها — الباك بعدين بيرجعك على /auth/google/callback
  const googleLogin: AuthApiContextType['googleLogin'] = () => {
    window.location.href = `${BASE_URL}/auth/google`
  }

  const googleCallback: AuthApiContextType['googleCallback'] = async (code, state) => {
    const res = await API.get(`/auth/google/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`)
    const data = res.data?.data

    if (data?.requires_birth_date) {
      return { kind: 'requires_birth_date', token: data.registration_pending_token }
    }
    if (data?.requires_link_confirmation) {
      return { kind: 'requires_link_confirmation', token: data.link_pending_token }
    }
    if (data?.mfa_required) {
      setMfaTempToken(data.mfa_temp_token)
      return { kind: 'mfa_required', mfaTempToken: data.mfa_temp_token }
    }

    // مسجل دخول بالكامل مباشرة
    const token = data?.access_token
    const user = token ? await setSession(token) : await fetchProfile()
    return { kind: 'authenticated', user }
  }

  const googleRegisterConfirm: AuthApiContextType['googleRegisterConfirm'] = async (token, birthDate) => {
    const res = await API.post('/auth/google/register/confirm', {
      registration_pending_token: token,
      birth_date: birthDate,
    })
    const data = res.data?.data
    if (data?.requires_guardian_email) {
      return { requiresGuardianEmail: true, guardianPendingToken: data.guardian_pending_token }
    }
    if (data?.access_token) {
      const user = await setSession(data.access_token)
      return { user }
    }
    return {}
  }

  const googleLinkConfirm: AuthApiContextType['googleLinkConfirm'] = async (token, password) => {
    const res = await API.post('/auth/google/link/confirm', {
      link_pending_token: token,
      password,
    })
    const data = res.data?.data
    if (data?.access_token) {
      const user = await setSession(data.access_token)
      return { user }
    }
    return {}
  }

  const googleGuardianEmail: AuthApiContextType['googleGuardianEmail'] = async (token, guardianEmail) => {
    await API.post('/auth/google/guardian-email', {
      guardian_pending_token: token,
      guardian_email: guardianEmail,
    })
  }

  const value: AuthApiContextType = {
    login,
    verifyMfa,
    register,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    googleLogin,
    googleCallback,
    googleRegisterConfirm,
    googleLinkConfirm,
    googleGuardianEmail,
    getErrorMessage: extractErrorMessage,
  }

  return <AuthApiContext.Provider value={value}>{children}</AuthApiContext.Provider>
}

export function useAuthApi() {
  const ctx = useContext(AuthApiContext)
  if (!ctx) throw new Error('useAuthApi must be used within an AuthApiProvider')
  return ctx
}

export function normalizeRole(raw: string | undefined): 'student' | 'instructor' | 'admin' | 'superadmin' {
  const known = ['student', 'instructor', 'admin', 'superadmin'] as const
  const lower = (raw || '').toLowerCase()
  return (known as readonly string[]).includes(lower) ? (lower as any) : 'student'
}
