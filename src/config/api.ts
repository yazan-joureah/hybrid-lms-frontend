// src/config/api.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// الآن اتصال Cross-Origin مباشر (Vercel → Render) — لا حاجة لـ Same-Origin Proxy
// بعد ما استبدلنا Double-Submit Cookie بـ Origin Validation في الباك اند.
export const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // يبعث refresh_token (HttpOnly) تلقائيًا — هذا وحده الكافي الآن
})

// ❌ حُذفت getCookie() بالكامل — ما عاد في csrf_token نقرأه أو نرسله.
// المتصفح نفسه بيرسل هيدر Origin تلقائيًا مع كل طلب cross-site،
// والباك اند بيتحقق منه مباشرة عبر requireTrustedOrigin — بدون أي تدخل من الفرونت.

let isRefreshing = false
let failedQueue: { resolve: (token: string | null) => void; reject: (err: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

const publicAuthEndpoints = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/google',
  '/auth/google/callback',
  '/auth/google/link/confirm',
  '/auth/google/register/confirm',
  '/auth/google/guardian-email',
  '/auth/guardian/approve',
  '/auth/guardian/manage',
  '/auth/guardian/manage/resend',
  '/auth/guardian/manage/update-email',
]

API.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config
    const status = error.response?.status

    if (originalRequest?.url && publicAuthEndpoints.includes(originalRequest.url)) {
      return Promise.reject(error)
    }

    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (originalRequest.url === '/auth/refresh') {
        delete API.defaults.headers.common.Authorization
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          if (token) originalRequest.headers.Authorization = `Bearer ${token}`
          return API(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true
      try {
        const response = await API.post('/auth/refresh')
        const newToken = response.data?.data?.access_token
        if (newToken) {
          API.defaults.headers.common.Authorization = `Bearer ${newToken}`
          processQueue(null, newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return API(originalRequest)
        }
        throw new Error('Refresh returned no token')
      } catch (refreshError) {
        processQueue(refreshError, null)
        delete API.defaults.headers.common.Authorization
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default API