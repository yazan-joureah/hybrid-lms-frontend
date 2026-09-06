// src/context/AuthApiContext.tsx
//
// هذا Context منفصل تمامًا عن NavContext — مسؤوليته الوحيدة هي التواصل
// مع الباك (login/register/verify/reset/google...). لا يلمس أي state تابع
// للتنقل أو بيانات المستخدم المحلية — هذه تبقى مسؤولية NavContext كما هي.
//
import { createContext, useContext, useState, type ReactNode } from 'react'
import API, { BASE_URL } from '../config/api'
import type { Page } from './NavContext'
import { userService } from '../services/userService' // ✅ استيراد userService

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
  birth_date: string
  role: string
  guardian_email?: string
  privacy_consent_version?: string
}

export interface UpdateProfilePayload {
  full_name?: string
  phone?: string
  bio?: string
  birth_date?: string // ISO string — يُرفض بـ BIRTH_DATE_LOCKED إذا kyc_status === 'verified'
}

export interface AccountDeletionResult {
  immediate: boolean   // true = طالب (حذف فوري) | false = مدرّس (بانتظار مراجعة SuperAdmin)
  status: string
  requestId?: string
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

function extractErrorCode(err: any): string | undefined {
  return err?.response?.data?.error?.code
}

export function getCodeErrorMessage(err: any, fallback: string): string {
  const code = extractErrorCode(err)
  if (code === 'INVALID_CODE') return 'الرمز غير صحيح، حاول مرة أخرى.'
  if (code === 'CODE_EXPIRED') return 'انتهت صلاحية الرمز، اطلب رمزاً جديداً.'
  if (code === 'TOO_MANY_ATTEMPTS') return 'محاولات كثيرة جداً، اطلب رمزاً جديداً بعد قليل.'
  return fallback || extractErrorMessage(err)
}

export function mapRoleToBackend(role: string): string {
  const known: Record<string, string> = { student: 'Student', instructor: 'Instructor', admin: 'Admin', superadmin: 'Superadmin' }
  return known[role.toLowerCase()] || 'Student'
}

interface AuthApiContextType {
  login: (email: string, password: string) => Promise<{
    mfaRequired?: boolean
    user?: BackendUser
    redirectTo?: string
    guardianPending?: boolean
    guardianManageToken?: string
    requiresEmailVerification?: boolean
  }>
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
  googleRegisterConfirm: (token: string, birthDate: string, role: 'Student' | 'Instructor') => Promise<{ user?: BackendUser; requiresGuardianEmail?: boolean; guardianPendingToken?: string }>
  googleLinkConfirm: (token: string, password: string) => Promise<{ user?: BackendUser }>
  googleGuardianEmail: (token: string, guardianEmail: string) => Promise<void>
  // Guardian management (new)
  guardianManageStatus: (token: string) => Promise<{
    status: 'pending' | 'approved' | 'rejected' | 'expired'
    guardianEmail: string
    expiresAt: string
    resendCount: number
    maxResendCount: number
  }>
  guardianManageResend: (token: string) => Promise<{ resendCount: number }>
  guardianManageUpdateEmail: (token: string, guardianEmail: string) => Promise<{ guardianEmail: string }>
  // Guardian decision (المُوافقة الفعلية على الطلب — SF مختلفة عن guardianManage أعلاه)
  guardianApprove: (params: {
    token: string
    decision: 'approve' | 'decline'
    guardianFullName: string
    relationship: 'parent' | 'guardian'
    consent?: boolean
  }) => Promise<{ status: 'active' | 'guardian_pending'; message: string }>
  // استعادة الجلسة
  restoreSession: () => Promise<{ success: boolean; user?: BackendUser }>
  setPendingMfaToken: (token: string) => void
  // Profile & Account
  uploadProfilePicture: (file: File) => Promise<void>
  getProfilePictureUrl: (userId: string) => string
  submitKyc: (params: { idDocumentType: 'national_id' | 'passport'; idDocumentFile: File; selfieFile: File }) => Promise<void>
  updateProfile: (payload: UpdateProfilePayload) => Promise<BackendUser>
  requestAccountDeletion: (reason?: string) => Promise<AccountDeletionResult>
  getErrorMessage: (err: any) => string
}

const AuthApiContext = createContext<AuthApiContextType | undefined>(undefined)

export function AuthApiProvider({ children }: { children: ReactNode }) {
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null)

  // ✅ استخدام userService بدلاً من API.get مباشرة
  const fetchProfile = async (): Promise<BackendUser> => {
    return userService.getMe() as unknown as BackendUser
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
    return { backupCodes: res.data?.data?.backup_codes }
  }

  const setSession = async (token: string): Promise<BackendUser> => {
    localStorage.setItem('session_active', 'true')
    API.defaults.headers.common.Authorization = `Bearer ${token}`
    return fetchProfile()
  }

  const login: AuthApiContextType['login'] = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password })
      const data = res.data?.data

      if (data?.mfa_required) {
        setMfaTempToken(data.mfa_temp_token)
        return { mfaRequired: true }
      }

      const token = data?.access_token
      if (!token) throw new Error('لم يتم استلام رمز الدخول من الخادم')
      const user = await setSession(token)
      return { user, redirectTo: data?.user?.redirect_to }
    } catch (err: any) {
      const code = err?.response?.data?.error?.code
      if (code === 'GUARDIAN_PENDING') {
        const guardianManageToken = err?.response?.data?.data?.guardian_manage_token
        return { guardianPending: true, guardianManageToken }
      }
      if (code === 'EMAIL_NOT_VERIFIED') {
        return { requiresEmailVerification: true }
      }
      throw err
    }
  }

  const logout: AuthApiContextType['logout'] = async () => {
    try {
      await API.post('/auth/logout')
    } catch {
      // نكمل تنظيف الفرونت حتى لو فشل الطلب
    }
    localStorage.removeItem('session_active')
    delete API.defaults.headers.common.Authorization
    setMfaTempToken(null)

    // تنظيف أي أثر لآخر كورس/تسجيل
    try {
      sessionStorage.removeItem('selected_enrollment_id')
      const keysToRemove: string[] = []
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i)
        if (key && key.startsWith('course_player_selection:')) keysToRemove.push(key)
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key))
    } catch {
      // تجاهل
    }
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
  const googleLogin: AuthApiContextType['googleLogin'] = () => {
    window.location.href = `${BASE_URL}/auth/google`
  }

  const googleRegisterConfirm: AuthApiContextType['googleRegisterConfirm'] = async (token, birthDate, role) => {
    const res = await API.post('/auth/google/register/confirm', {
      registration_pending_token: token,
      birth_date: birthDate,
      role,
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

  // ---------- Guardian management (new) ----------
  const guardianManageStatus: AuthApiContextType['guardianManageStatus'] = async (token) => {
    const res = await API.get('/auth/guardian/manage', { params: { token } })
    const data = res.data?.data
    return {
      status: data?.status,
      guardianEmail: data?.guardian_email,
      expiresAt: data?.expires_at,
      resendCount: data?.resend_count,
      maxResendCount: data?.max_resend_count,
    }
  }

  const guardianManageResend: AuthApiContextType['guardianManageResend'] = async (token) => {
    const res = await API.post('/auth/guardian/manage/resend', { token })
    return { resendCount: res.data?.data?.resend_count }
  }

  const guardianManageUpdateEmail: AuthApiContextType['guardianManageUpdateEmail'] = async (token, guardianEmail) => {
    const res = await API.post('/auth/guardian/manage/update-email', {
      token,
      guardian_email: guardianEmail,
    })
    return { guardianEmail: res.data?.data?.guardian_email }
  }

  // ---------- Guardian decision (approve/decline the request itself) ----------
  // SECURITY: consent يُرسَل فقط عند decision='approve' — السيرفر
  // (guardianApproveSchema) يشترطه true حصراً في تلك الحالة، وإرساله
  // false/undefined عند الرفض قد يُربك المخطط بلا داعٍ.
  const guardianApprove: AuthApiContextType['guardianApprove'] = async ({
    token, decision, guardianFullName, relationship, consent,
  }) => {
    const res = await API.post('/auth/guardian/approve', {
      token,
      decision,
      guardian_full_name: guardianFullName,
      relationship,
      ...(decision === 'approve' && { consent }),
    })
    const data = res.data?.data
    return { status: data?.status, message: data?.message }
  }

  // ---------- استعادة الجلسة ----------
  const restoreSession: AuthApiContextType['restoreSession'] = async () => {
    try {
      const res = await API.post('/auth/refresh')
      const token = res.data?.data?.access_token
      if (!token) {
        localStorage.removeItem('session_active')
        return { success: false }
      }
      const user = await setSession(token)
      return { success: true, user }
    } catch {
      localStorage.removeItem('session_active')
      return { success: false }
    }
  }

  const setPendingMfaToken: AuthApiContextType['setPendingMfaToken'] = (token) => {
    setMfaTempToken(token)
  }

  // ---------- Profile & Account ----------
  const uploadProfilePicture: AuthApiContextType['uploadProfilePicture'] = async (file) => {
    const formData = new FormData()
    formData.append('profile_picture', file)
    await API.post('/users/me/profile-picture', formData)
  }

  const getProfilePictureUrl: AuthApiContextType['getProfilePictureUrl'] = (userId) => {
    return `${API.defaults.baseURL}/users/${userId}/profile-picture`
  }

  const submitKyc: AuthApiContextType['submitKyc'] = async ({ idDocumentType, idDocumentFile, selfieFile }) => {
    const formData = new FormData()
    formData.append('idDocumentType', idDocumentType)
    formData.append('id_document', idDocumentFile)
    formData.append('selfie', selfieFile)
    await API.post('/kyc/requests', formData)
  }

  // ⚠️ افتراض غير مؤكد: بافترض إنه updateProfileSchema (userSchemas.js) بيقبل
  // full_name/phone/bio/birth_date كلها اختيارية (partial update) — لازم تأكيد
  // من محتوى userSchemas.js الفعلي لو صار عندك اختلاف بالسلوك.
  const updateProfile: AuthApiContextType['updateProfile'] = async (payload) => {
    const res = await API.patch('/users/me', payload)
    return res.data?.data
  }

  // ⚠️ افتراض غير مؤكد: requestOwnDeletionSchema (authSchemas.js) — بنرسل دايمًا
  // نص غير فارغ لـ reason تجنبًا لفشل التحقق لو كان الحقل إلزامي بالسكيما.
  const requestAccountDeletion: AuthApiContextType['requestAccountDeletion'] = async (reason) => {
    const res = await API.delete('/auth/account', {
      data: { reason: reason?.trim() || 'لم يتم تحديد سبب من المستخدم.' },
    })
    return res.data?.data
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
    guardianManageStatus,
    guardianManageResend,
    guardianManageUpdateEmail,
    guardianApprove,
    restoreSession,
    setPendingMfaToken,
    logout,
    getCurrentUser,
    setupMfa,
    confirmMfa,
    uploadProfilePicture,
    getProfilePictureUrl,
    submitKyc,
    updateProfile,
    requestAccountDeletion,
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

export function computeFallbackPage(user: BackendUser): Page {
  const role = normalizeRole(user.role)
  if (role === 'instructor') {
    const needsSetup = !user.mfa_enabled || user.kyc_status !== 'verified'
    return needsSetup ? 'instructor-setup' : 'instructor-dashboard'
  }
  if (role === 'admin' || role === 'superadmin') {
    return !user.mfa_enabled ? 'admin-setup' : 'admin-dashboard'
  }
  return 'student-dashboard'
}