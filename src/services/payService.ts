// src/services/payService.ts
import API from '../config/api'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type RefundStatus = 'review_pending' | 'approved' | 'rejected'

// عملة المنصة موحّدة (env.payment.currency بالباك) — ما في سعر لكل كورس بعملة
// مختلفة، فمنستخدمها كـ fallback بصفحة Checkout قبل ما يصير في Payment فعلي
export const PLATFORM_CURRENCY = 'usd'

export function formatCurrency(amount: number, currency: string = PLATFORM_CURRENCY): string {
    try {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(Number(amount) || 0)
    } catch {
        return `${(Number(amount) || 0).toFixed(2)} ${currency.toUpperCase()}`
    }
}

export interface PaymentCourseRef {
    _id: string
    title: string
}

export interface PaymentStudentRef {
    _id: string
    full_name?: string
    email?: string
}

export interface RefundRequestRef {
    _id: string
    status: RefundStatus
    decision_reason?: string | null
}

// ⚠️ مطابق حرفياً لـ Payment.js — لا يوجد حقل provider، ولا حالة processing
export interface Payment {
    _id: string
    student_id: PaymentStudentRef | string | null   // populated فقط بردود الأدمن
    course_id: PaymentCourseRef | string | null      // ممكن null لو الكورس انحذف
    enrollment_id: string
    amount: number
    currency: string
    status: PaymentStatus
    gateway_session_id?: string | null
    gateway_payment_intent_id?: string | null
    failure_reason?: string | null
    paid_at?: string | null
    createdAt: string
    refund_request?: RefundRequestRef | null
}

// ⚠️ نستخدم هالـ helpers بدل `typeof x === 'object'` مباشرة بأي مكان —
// typeof null === 'object' بجافاسكريبت، فالفحص المباشر بينكرش لو الباك
// رجّع course_id/student_id = null (كورس أو مستخدم محذوف، أو payment قديم
// قبل استقرار الـ populate). هاي الدوال بتتعامل مع null بأمان بمكان واحد.
export function getCourseTitle(course: Payment['course_id']): string {
    if (course && typeof course === 'object') return course.title || '—'
    return typeof course === 'string' && course ? course : '—'
}

export function getStudentLabel(student: Payment['student_id']): string {
    if (student && typeof student === 'object') return student.full_name || student.email || '—'
    return typeof student === 'string' && student ? student : '—'
}

export function getStudentEmail(student: Payment['student_id']): string | undefined {
    if (student && typeof student === 'object') return student.email
    return undefined
}

// باقي الـ interfaces والـ service object...

export interface RefundRequestListItem {
    _id: string
    payment_id: {
        _id: string
        amount: number
        currency: string
        paid_at?: string
        course_id?: { title?: string }
    }
    student_id: { full_name?: string; email?: string }
    status: RefundStatus
    reason?: string
    decision_reason?: string | null
    createdAt: string
}

export interface InitiatePaymentResult {
    checkoutUrl: string
    paymentId: string
}

export interface AdminPaymentListParams {
    status?: PaymentStatus
    page?: number
    limit?: number
}

export const payService = {
    initiatePayment: async (enrollmentId: string): Promise<InitiatePaymentResult> => {
        const res = await API.post('/pay/initiate', { enrollment_id: enrollmentId })
        return res.data?.data
    },

    getPaymentStatus: async (paymentId: string): Promise<Payment | null> => {
        const res = await API.get(`/pay/payments/${paymentId}`)
        return res.data?.data?.payment || null
    },

    adminGetPayment: async (paymentId: string): Promise<Payment | null> => {
        const res = await API.get(`/pay/payments/${paymentId}`)
        return res.data?.data?.payment || null
    },

    getMyPayments: async (params: { page?: number; limit?: number; status?: PaymentStatus } = {}): Promise<Payment[]> => {
        const res = await API.get('/pay/my-payments', { params })
        return res.data?.data?.payments || []
    },

    requestRefund: async (paymentId: string, reason?: string): Promise<void> => {
        await API.post('/pay/refund-requests', { payment_id: paymentId, reason })
    },

    getRefundRequests: async (params: { status?: string; page?: number; limit?: number } = {}): Promise<RefundRequestListItem[]> => {
        const res = await API.get('/pay/refund-requests', { params })
        return res.data?.data?.refundRequests || []
    },

    reviewRefund: async (refundRequestId: string, decision: 'approve' | 'reject', decisionReason?: string): Promise<void> => {
        await API.post(`/pay/refund-requests/${refundRequestId}/review`, {
            decision,
            decision_reason: decisionReason,
        })
    },

    adminListPayments: async (params: AdminPaymentListParams = {}): Promise<Payment[]> => {
        const res = await API.get('/pay/admin/payments', { params })
        return res.data?.data?.payments || []
    },
}