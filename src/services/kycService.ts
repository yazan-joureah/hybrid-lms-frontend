// src/services/kycService.ts
import API from '../config/api'

export interface KycListItem {
    _id: string
    user_id: { _id: string; full_name: string; email: string; role: string } | null
    status: string
    submitted_at: string
    applicant_role: string
}

export interface KycApplicant {
    full_name: string
    email: string
    birth_date: string
    role: string
}

export type KycDocumentType = 'id_document' | 'selfie'

export const kycService = {
    listPending: async (): Promise<KycListItem[]> => {
        const res = await API.get('/admin/kyc/requests')
        return res.data?.data?.requests || []
    },

    getApplicant: async (requestId: string): Promise<KycApplicant | null> => {
        const res = await API.get(`/admin/kyc/requests/${requestId}`)
        return res.data?.data?.applicant || null
    },

    getDocumentBlob: async (requestId: string, doc: KycDocumentType): Promise<Blob> => {
        const res = await API.get(`/admin/kyc/requests/${requestId}/documents/${doc}`, { responseType: 'blob' })
        return res.data
    },

    approve: async (requestId: string, documentBirthDate: string, optionalNote?: string): Promise<void> => {
        await API.post(`/admin/kyc/requests/${requestId}/approve`, { documentBirthDate, optionalNote: optionalNote || undefined })
    },

    reject: async (requestId: string, rejectionReason: string): Promise<void> => {
        await API.post(`/admin/kyc/requests/${requestId}/reject`, { rejectionReason })
    },
}