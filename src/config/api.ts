// src/config/api.ts
/// <reference types="vite/client" />
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Configure API base URL via VITE_API_BASE_URL. Default to '/api' so paths are relative
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

const API = axios.create({
    baseURL,
    withCredentials: true,
});

// Helper to read a cookie by name
function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

// ---------------- DEV Preview Mock Handler ----------------
function isDevPreviewEnabled(): boolean {
    if (!import.meta.env.DEV) return false;
    try {
        return window.localStorage.getItem('dev_preview_enabled') === 'true';
    } catch {
        return false;
    }
}

function makeOk(payload: any) {
    return { data: { success: true, data: payload }, status: 200, statusText: 'OK' };
}

function devMockResponse(config: InternalAxiosRequestConfig) {
    const now = new Date().toISOString();

    const mockCourses = [
        { _id: 'course_paid_1', title: 'React المتقدم وإدارة الحالة', instructor_name: 'خالد المدرب', thumbnail: '', price: 349, currency: 'SAR', isPaid: true },
        { _id: 'course_paid_2', title: 'Python للتحليل المالي', instructor_name: 'خالد المدرب', thumbnail: '', price: 299, currency: 'SAR', isPaid: true },
        { _id: 'course_free_1', title: 'أساسيات البرمجة', instructor_name: 'خالد المدرب', thumbnail: '', price: 0, currency: 'SAR', isPaid: false },
    ];

    const mockPayments = [
        { _id: 'dev_pay_1', userId: 'dev_user_student', courseId: 'course_paid_1', amount: 349, currency: 'SAR', status: 'paid', provider: 'mock', createdAt: now },
        { _id: 'dev_pay_2', userId: 'dev_user_student', courseId: 'course_paid_2', amount: 299, currency: 'SAR', status: 'pending', provider: 'mock', createdAt: now },
    ];

    const url = config.url || '';
    const method = (config.method || 'get').toLowerCase();

    if (method === 'post' && /^\/auth\/refresh$/.test(url)) {
        return makeOk({ access_token: 'dev-access-token' });
    }

    if (method === 'get' && /^\/users\/me$/.test(url)) {
        const role = (window.localStorage.getItem('dev_preview_role') || 'Admin') as string;
        const roleMap: Record<string, any> = {
            Student: { _id: 'dev_user_student', full_name: 'Dev Student', email: 'student@dev.local', role: 'Student', phone: '+10000000001' },
            Instructor: { _id: 'dev_user_instructor', full_name: 'Dev Instructor', email: 'instructor@dev.local', role: 'Instructor', phone: '+10000000002' },
            Admin: { _id: 'dev_user_admin', full_name: 'Dev Admin', email: 'admin@dev.local', role: 'Admin', phone: '+10000000003' },
        };
        return makeOk(roleMap[role] || roleMap.Admin);
    }

    if (method === 'get' && /^\/courses\/enrollments\/my-courses$/.test(url)) {
        return makeOk(mockCourses.map((c) => ({ course_id: c })));
    }

    const mCourse = url.match(/^\/courses\/(.+)$/);
    if (method === 'get' && mCourse) {
        const id = mCourse[1];
        const found = mockCourses.find((c) => c._id === id) || mockCourses[0];
        return makeOk(found);
    }

    if (method === 'post' && /^\/payments\/create-checkout-session$/.test(url)) {
        return makeOk({ sessionId: 'dev_sess_1', paymentId: 'dev_pay_1', url: `${window.location.origin}/student/payments/success?paymentId=dev_pay_1&mock=1` });
    }

    if (method === 'post' && /^\/payments\/webhook$/.test(url)) {
        return makeOk({ success: true });
    }

    if (method === 'post' && /^\/kyc\/requests$/.test(url)) {
        return makeOk({ success: true, status: 'pending_review' });
    }

    if (method === 'get' && /^\/payments\/my-transactions$/.test(url)) {
        return makeOk(mockPayments);
    }

    if (method === 'get' && /^\/admin\/payments(\/.*)?$/.test(url)) {
        return makeOk(mockPayments);
    }

    if (method === 'get' && /^\/admin\/refund-requests$/.test(url)) {
        return makeOk([]);
    }

    if (method === 'post' && /^\/payments\/.+\/refund$/.test(url)) {
        return makeOk({ _id: `refund_${Date.now()}`, status: 'requested' });
    }

    return null;
}

API.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (!['get', 'options'].includes((config.method || 'get').toLowerCase())) {
            const csrfToken = getCookie('csrf_token');
            if (csrfToken) {
                config.headers = config.headers || {};
                (config.headers as Record<string, string>)['X-CSRF-Token'] = csrfToken;
            }
        }

        if (isDevPreviewEnabled()) {
            const mock = devMockResponse(config);
            if (mock) {
                const err: any = new Error('mock');
                err.__mock = true;
                err.mockResponse = mock;
                throw err;
            }
        }

        return config;
    },
    (error: AxiosError) => Promise.reject(error)
);

interface QueuedRequest {
    resolve: (token?: string | null) => void;
    reject: (error: unknown) => void;
}

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null): void => {
    failedQueue.forEach((prom) => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

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
];

API.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const anyErr: any = error as any;
        if (anyErr && anyErr.__mock && anyErr.mockResponse) {
            return Promise.resolve(anyErr.mockResponse);
        }

        const originalRequest = error.config as RetriableRequestConfig | undefined;
        const status = error.response?.status;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        if (originalRequest.url && publicAuthEndpoints.includes(originalRequest.url)) {
            return Promise.reject(error);
        }

        if (status === 401 && !originalRequest._retry) {
            if (originalRequest.url === '/auth/refresh') {
                delete API.defaults.headers.common['Authorization'];
                if (import.meta.env.PROD) {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers = originalRequest.headers || {};
                        if (token) originalRequest.headers['Authorization'] = `Bearer ${token}`;
                        return API(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const response = await API.post('/auth/refresh');
                const newToken: string | undefined = response.data?.data?.access_token;
                if (newToken) {
                    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    processQueue(null, newToken);
                    originalRequest.headers = originalRequest.headers || {};
                    originalRequest.headers['Authorization'] = `Bearer ${token}`;
                    return API(originalRequest);
                } else {
                    throw new Error('Refresh returned no token');
                }
            } catch (refreshError) {
                processQueue(refreshError, null);
                delete API.defaults.headers.common['Authorization'];
                if (import.meta.env.PROD) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

export default API;


