// src/services/userService.ts
import API, { BASE_URL } from '../config/api'

export interface UserProfile {
    id: string
    full_name: string
    email: string
    role: string
    status: string
    kyc_status: string
    mfa_enabled: boolean
    birth_date?: string | null
    created_at?: string
    profile_picture_storage_path?: string | null
}

export interface UpdateProfilePayload {
    full_name?: string
    phone?: string   // '' مسموحة لمسح الحقل (حسب updateProfileSchema)
    bio?: string      // '' مسموحة لمسح الحقل
    birth_date?: string // ISO: YYYY-MM-DD — يُرفض لو مؤكّد KYC (BIRTH_DATE_LOCKED)
}

export interface UpdateProfileResult {
    id: string
    full_name: string
    email: string
    phone?: string
    bio?: string
    birth_date?: string | null
}

export interface AccountDeletionResult {
    immediate: boolean
    status: string
    requestId?: string
}

export const userService = {
    /** GET /users/me */
    getMe: async (): Promise<UserProfile> => {
        const res = await API.get('/users/me')
        return res.data?.data
    },

    /** PATCH /users/me — تحديث جزئي، كل الحقول اختيارية */
    updateMe: async (updates: UpdateProfilePayload): Promise<UpdateProfileResult> => {
        const res = await API.patch('/users/me', updates)
        return res.data?.data
    },

    /** PATCH /users/me/profile-picture */
    uploadProfilePicture: async (file: File): Promise<void> => {
        const formData = new FormData()
        formData.append('image', file)
        await API.patch('/users/me/profile-picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    /** GET /users/:userId/profile-picture — رابط مباشر (streaming، مو JSON) */
    getProfilePictureUrl: (userId: string): string => {
        return `${BASE_URL}/users/${userId}/profile-picture`
    },

    /**
     * DELETE /auth/account — طلب حذف ذاتي.
     * Student → يُحذف فورًا (immediate=true).
     * Instructor/Admin → يدخل بانتظار موافقة SuperAdmin (immediate=false).
     * ⚠️ افتراض غير مؤكد: شكل الـ response هون مبني على توقيع
     * accountDeletionRequest.service.js (requestOwnAccountDeletion) لأنه
     * الـ controller المسؤول عن هاد الراوت ما انرفع لسا — لازم تأكيد.
     */
    requestOwnAccountDeletion: async (reason: string): Promise<AccountDeletionResult> => {
        const res = await API.delete('/auth/account', { data: { reason } })
        return res.data?.data
    },

    /** POST /auth/account/restore/request — خطوة 1، بدون auth */
    requestAccountRestore: async (email: string): Promise<void> => {
        await API.post('/auth/account/restore/request', { email })
    },

    /** POST /auth/account/restore/confirm — خطوة 2، بدون auth */
    confirmAccountRestore: async (email: string, code: string): Promise<void> => {
        await API.post('/auth/account/restore/confirm', { email, code })
    },
}