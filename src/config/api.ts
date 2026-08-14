// src/config/api.ts
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

// TODO: عدّل هاد الرابط إذا الباك شغال على بورت أو دومين مختلف
export const BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000/api/v1'

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // يبعث الكوكيز (refresh_token, csrf_token)
})

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? match[2] : null
}

// إضافة CSRF token تلقائيًا لأي request مش GET
API.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (!['get', 'options'].includes(config.method?.toLowerCase() || '')) {
      const csrfToken = getCookie('csrf_token')
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let failedQueue: { resolve: (token: string | null) => void; reject: (err: unknown) => void }[] = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

// نقاط دخول عامة لا تحتاج محاولة refresh عند فشلها
const publicAuthEndpoints = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/google',
  '/auth/google/callback',
  '/auth/guardian/approve',
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
