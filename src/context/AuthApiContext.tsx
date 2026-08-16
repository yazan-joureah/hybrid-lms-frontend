// src/context/AuthApiContext.tsx
//
// هاد Context منفصل تمامًا عن NavContext — مسؤوليته الوحيدة هي التواصل
// مع الباك (login/register/verify/reset/google...). ما بيلمس أي state تبع
// التنقل أو بيانات المستخدم المحلية — هاي تضل مسؤولية NavContext متل ما هي.
//
import { createContext, useContext, useState, type ReactNode } from 'react'
import API, { BASE_URL } from '../config/api'
import type { Page } from './NavContext'

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
  login: (email: string, password: string) => Promise<{ mfaRequired?: boolean; user?: BackendUser; redirectTo?: string }>
  verifyMfa: (code: string) => Promise<{ user?: BackendUser; redirectTo?: string }>
  getCurrentUser: () => Promise<BackendUser>
  logout: () => Promise<void>
  setupMfa: () => Promise<{ qrCodeDataUrl: string; manualEntryKey: string }>
  confirmMfa: (code: string) => Promise<{ backupCodes?: string[] }>
  register: (payload: RegisterPayload) => Promise<any>
  verifyEmail: (email: string, code: string) => Promise<any>
  resendVerification: (email: string) => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<void>
  // Google OAuth
  googleLogin: () => void
  googleRegisterConfirm: (token: string, birthDate: string) => Promise<{ user?: BackendUser; requiresGuardianEmail?: boolean; guardianPendingToken?: string }>
  googleLinkConfirm: (token: string, password: string) => Promise<{ user?: BackendUser }>
  googleGuardianEmail: (token: string, guardianEmail: string) => Promise<void>
  // جديد — استعادة الجلسة (مطلوبة بعد نجاح Google، وأيضًا عند تحميل التطبيق
  // إذا كان session_active=true بالـ localStorage). بتعتمد على refresh_token
  // المحفوظ بكوكي httpOnly من الباك — ما بتحتاج أي parameter.
  restoreSession: () => Promise<{ success: boolean; user?: BackendUser }>
  // جديد — لحقن mfa_temp_token الجاي من redirect الباك (?oauth_step=mfa&token=...)
  // بالـ state الداخلي، عشان verifyMfa() تلاقيه لما نستدعيها من صفحة /login
  setPendingMfaToken: (token: string) => void
  uploadProfilePicture: (file: File) => Promise<void>
  getProfilePictureUrl: (userId: string) => string
  submitKyc: (params: { idDocumentType: 'national_id' | 'passport'; idDocumentFile: File; selfieFile: File }) => Promise<void>
  getErrorMessage: (err: any) => string
}

const AuthApiContext = createContext<AuthApiContextType | undefined>(undefined)

export function AuthApiProvider({ children }: { children: ReactNode }) {
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null)

  const fetchProfile = async (): Promise<BackendUser> => {
    const res = await API.get('/users/me')
    return res.data?.data
  }

  const getCurrentUser: AuthApiContextType['getCurrentUser'] = async () => {
    return fetchProfile()
  }

  const setupMfa: AuthApiContextType['setupMfa'] = async () => {
    const res = await API.post('/auth/mfa/totp/setup')
    const data = res.data?.data
    return {
      qrCodeDataUrl: data?.qr_code_data_url || '',
      manualEntryKey: data?.manual_entry_key || '',
    }
  }

  const confirmMfa: AuthApiContextType['confirmMfa'] = async (code) => {
    const res = await API.post('/auth/mfa/totp/verify', { code })
    return { backupCodes: res.data?.data?.backupCodes }
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
    return { user, redirectTo: data?.user?.redirect_to }   // ← نحافظ عليها بدل ما نرميها
  }

  const logout: AuthApiContextType['logout'] = async () => {
    try {
      await API.post('/auth/logout')
    } catch (err) {
      // نكمل تنظيف الفرونت حتى لو فشل الطلب (مثلاً السيرفر واقع أو التوكن منتهي أصلاً)
    }
    localStorage.removeItem('session_active')
    delete API.defaults.headers.common.Authorization
    setMfaTempToken(null)
  }

  // ⚠️ افتراض غير مؤكد: نفس نمط الكود المرجعي القديم
  // (PATCH /users/me/profile-picture, حقل 'image'). لازم تأكيد من
  // userRoutes.js/user.controller.js الحالي قبل الاعتماد الكامل.
  const uploadProfilePicture: AuthApiContextType['uploadProfilePicture'] = async (file) => {
    const formData = new FormData()
    formData.append('image', file)
    await API.patch('/users/me/profile-picture', formData)
  }

  const getProfilePictureUrl: AuthApiContextType['getProfilePictureUrl'] = (userId) => {
    return `${BASE_URL}/users/${userId}/profile-picture`
  }

  // مطابقة تمامًا لعقد kyc.controller.js/kycRoutes.js المؤكد سابقًا
  const submitKyc: AuthApiContextType['submitKyc'] = async ({ idDocumentType, idDocumentFile, selfieFile }) => {
    const formData = new FormData()
    formData.append('idDocumentType', idDocumentType)
    formData.append('id_document', idDocumentFile)
    formData.append('selfie', selfieFile)
    await API.post('/kyc/requests', formData)
  }

  const verifyMfa: AuthApiContextType['verifyMfa'] = async (code) => {
    if (!mfaTempToken) throw new Error('لا توجد جلسة تحقق ثنائي نشطة، حاول تسجيل الدخول من جديد')
    const res = await API.post('/auth/mfa/login/verify', { mfaTempToken, code })
    const data = res.data?.data
    const token = data?.access_token
    if (!token) throw new Error('لم يتم استلام رمز الدخول من الخادم')
    const user = await setSession(token)
    setMfaTempToken(null)
    return { user, redirectTo: data?.user?.redirect_to }
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

  // بيوديك على صفحة Google نفسها — الباك بعدين بيرجعك عبر redirect حقيقي
  // (مو JSON) لصفحة /login بـ query params (oauth_step/token/oauth_error)
  // أو لصفحة /dashboard?auth=google_success. هاد التعامل صار داخل Login.tsx
  // مباشرة، مو بصفحة منفصلة.
  const googleLogin: AuthApiContextType['googleLogin'] = () => {
    window.location.href = `${BASE_URL}/auth/google`
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

  // ---------- استعادة الجلسة ----------
  // بتنادى بحالتين:
  // 1) عند تحميل التطبيق إذا localStorage['session_active'] === 'true'
  // 2) بعد ما الباك يعمل redirect لـ /dashboard?auth=google_success
  //    (لأنه الباك بس بيحط refresh_token بكوكي httpOnly، وما بيرجع
  //    access_token بالـ URL — وهاد الصح أمنيًا. فلازم نطلبه إحنا يدويًا).
  const restoreSession: AuthApiContextType['restoreSession'] = async () => {
    try {
      const res = await API.post('/auth/refresh') // refresh_token بيترسل تلقائيًا عبر الكوكي (withCredentials)
      const token = res.data?.data?.access_token
      if (!token) {
        localStorage.removeItem('session_active')
        return { success: false }
      }
      const user = await setSession(token)
      return { success: true, user }
    } catch (err) {
      localStorage.removeItem('session_active')
      return { success: false }
    }
  }

  const setPendingMfaToken: AuthApiContextType['setPendingMfaToken'] = (token) => {
    setMfaTempToken(token)
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
    googleRegisterConfirm,
    googleLinkConfirm,
    googleGuardianEmail,
    restoreSession,
    setPendingMfaToken,
    logout,
    uploadProfilePicture,
    getProfilePictureUrl,
    submitKyc,
    getCurrentUser, setupMfa, confirmMfa,
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

// ⚠️ ملاحظة أمنية: oauth.service.js (completeLoginForLinkedUser) ما بيستدعي
// computeRedirectTo() إطلاقًا بمسار Google — يعني مدرّس يسجل عبر Google
// ممكن يتجاوز فحص KYC/MFA يلي مطبّق بمسار كلمة المرور العادي. هاي الدالة
// هون هي طبقة حماية إضافية بالفرونت لسد الفجوة مؤقتًا، لحد ما تنصلح بالباك
// (session.service.js:computeRedirectTo لازم تُستدعى بمسار Google كمان).
export function computeFallbackPage(user: BackendUser): Page {
  const role = normalizeRole(user.role)
  if (role === 'instructor') {
    const needsSetup = !user.mfa_enabled || user.kyc_status !== 'verified'
    return needsSetup ? 'instructor-setup' : 'instructor-dashboard'
  }
  if (role === 'admin' || role === 'superadmin') return 'admin-dashboard'
  return 'student-dashboard'
}