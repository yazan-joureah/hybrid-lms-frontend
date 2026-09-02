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

export interface SubmitKycPayload {
    idDocumentType: 'national_id' | 'passport'
    idDocumentFile: File
    selfieFile: File
}

export const kycService = {
    /** POST /kyc/requests — تسليم طلب توثيق هوية من الطالب/المدرّس نفسه */
    submitMyRequest: async ({ idDocumentType, idDocumentFile, selfieFile }: SubmitKycPayload): Promise<void> => {
        const formData = new FormData()
        formData.append('idDocumentType', idDocumentType)
        formData.append('id_document', idDocumentFile)
        formData.append('selfie', selfieFile)
        await API.post('/kyc/requests', formData)
    },

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

    approve: async (
        requestId: string,
        documentBirthDate: string,
        optionalNote?: string,
        confirmYellowTier = false,
    ): Promise<void> => {
        await API.post(`/admin/kyc/requests/${requestId}/approve`, {
            documentBirthDate,
            optionalNote: optionalNote || undefined,
            confirmYellowTier,
        })
    },

    reject: async (requestId: string, rejectionReason: string): Promise<void> => {
        await API.post(`/admin/kyc/requests/${requestId}/reject`, { rejectionReason })
    },

    // ---------- الطالب: تصحيح العمر بعد age_flagged ----------
    requestAgeCorrection: async (birthDate: string, guardianEmail: string): Promise<void> => {
        await API.post('/kyc/age-correction', {
            birth_date: birthDate,
            guardian_email: guardianEmail,
        })
    },
}