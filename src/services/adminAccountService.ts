// src/services/adminAccountService.ts
import API from '../config/api'

export type AccountRole = 'Student' | 'Instructor' | 'Admin' | 'SuperAdmin'
export type AccountStatusAction = 'suspend' | 'activate'
export type DeletionReviewDecision = 'approve' | 'reject'

export interface AdminAccountListItem {
    _id: string
    full_name: string
    email: string
    role: AccountRole
    status: string
    kyc_status?: string
    mfa_enabled?: boolean
    created_at: string
    deleted_at?: string | null
}

export interface AccountListParams {
    role?: string
    status?: string
    search?: string
    page?: number
    pageSize?: number
}

export interface AccountListResult {
    items: AdminAccountListItem[]
    total: number
    page: number
    pageSize: number
}

export interface DeletionRequestItem {
    _id: string
    user_id: { _id: string; full_name: string; email: string; role: string } | null
    reason: string
    status: 'pending_review' | 'approved' | 'rejected'
    decision_reason?: string | null
    requested_at?: string
    reviewed_at?: string | null
}

export const adminAccountService = {
    /** GET /admin/accounts?role=&status=&search=&page=&pageSize= */
    list: async (params: AccountListParams = {}): Promise<AccountListResult> => {
        const res = await API.get('/admin/accounts', { params })
        const data = res.data?.data
        return {
            items: data?.items || [],
            total: data?.total || 0,
            page: data?.page || 1,
            pageSize: data?.pageSize || 20,
        }
    },

    /** PATCH /admin/accounts/:id/status — action + reason (إلزامي) */
    setStatus: async (userId: string, action: AccountStatusAction, reason: string): Promise<string> => {
        const res = await API.patch(`/admin/accounts/${userId}/status`, { action, reason })
        return res.data?.data?.status
    },

    /** POST /admin/accounts — SuperAdmin فقط، بدون كلمة مرور (OTP بالإيميل) */
    createAdmin: async (email: string, fullName: string): Promise<{ adminId: string; email: string }> => {
        const res = await API.post('/admin/accounts', { email, fullName })
        return res.data?.data
    },

    /** DELETE /admin/accounts/:id — reason إلزامي */
    deleteAccount: async (userId: string, reason: string): Promise<{ status: string; restoreWindowDays: number }> => {
        const res = await API.delete(`/admin/accounts/${userId}`, { data: { reason } })
        return res.data?.data
    },

    /** PATCH /admin/accounts/:id/deletion — استعادة حساب محذوف (خلال 30 يوم) */
    restoreAccount: async (userId: string): Promise<string> => {
        const res = await API.patch(`/admin/accounts/${userId}/deletion`)
        return res.data?.data?.status
    },

    /** GET /admin/deletion-requests?status= — SuperAdmin فقط */
    listDeletionRequests: async (status: string = 'pending_review'): Promise<DeletionRequestItem[]> => {
        const res = await API.get('/admin/deletion-requests', { params: { status } })
        return res.data?.data?.requests || []
    },

    /** POST /admin/deletion-requests/:id/review — SuperAdmin فقط */
    reviewDeletionRequest: async (
        requestId: string,
        decision: DeletionReviewDecision,
        decisionReason?: string
    ): Promise<string> => {
        const res = await API.post(`/admin/deletion-requests/${requestId}/review`, {
            decision,
            decisionReason,
        })
        return res.data?.data?.status
    },
}