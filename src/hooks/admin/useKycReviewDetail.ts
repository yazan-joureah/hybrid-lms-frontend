// src/hooks/admin/useKycReviewDetail.ts
import { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { kycService, type KycApplicant } from '../../services/kycService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useKycReviewDetail(requestId: string, onDecided: () => void) {
    const { success, error: toastError } = useToast()

    const [applicant, setApplicant] = useState<KycApplicant | null>(null)
    const [idImageUrl, setIdImageUrl] = useState<string | null>(null)
    const [selfieImageUrl, setSelfieImageUrl] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [imagesLoading, setImagesLoading] = useState(false)
    const [actionLoading, setActionLoading] = useState(false)

    useEffect(() => {
        setApplicant(null)
        setIdImageUrl(null)
        setSelfieImageUrl(null)

        let cancelled = false
        let localIdUrl: string | null = null
        let localSelfieUrl: string | null = null

        setLoading(true)
        kycService.getApplicant(requestId)
            .then(data => { if (!cancelled) setApplicant(data) })
            .catch(err => { if (!cancelled) toastError(getErrorMessage(err)) })
            .finally(() => { if (!cancelled) setLoading(false) })

        setImagesLoading(true)
        Promise.all([
            kycService.getDocumentBlob(requestId, 'id_document'),
            kycService.getDocumentBlob(requestId, 'selfie'),
        ])
            .then(([idBlob, selfieBlob]) => {
                if (cancelled) return
                localIdUrl = URL.createObjectURL(idBlob)
                localSelfieUrl = URL.createObjectURL(selfieBlob)
                setIdImageUrl(localIdUrl)
                setSelfieImageUrl(localSelfieUrl)
            })
            .catch(err => { if (!cancelled) toastError('تعذّر تحميل صور المستندات: ' + getErrorMessage(err)) })
            .finally(() => { if (!cancelled) setImagesLoading(false) })

        return () => {
            cancelled = true
            if (localIdUrl) URL.revokeObjectURL(localIdUrl)
            if (localSelfieUrl) URL.revokeObjectURL(localSelfieUrl)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [requestId])

    const approve = async (documentBirthDate: string, optionalNote: string) => {
        if (!documentBirthDate) { toastError('أدخل تاريخ الميلاد كما هو مكتوب بالوثيقة.'); return false }
        setActionLoading(true)
        try {
            await kycService.approve(requestId, documentBirthDate, optionalNote.trim() || undefined)
            success('تم قبول طلب التوثيق بنجاح.')
            onDecided()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        } finally {
            setActionLoading(false)
        }
    }

    const reject = async (rejectionReason: string) => {
        setActionLoading(true)
        try {
            await kycService.reject(requestId, rejectionReason)
            success('تم رفض طلب التوثيق.')
            onDecided()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        } finally {
            setActionLoading(false)
        }
    }

    return { applicant, idImageUrl, selfieImageUrl, loading, imagesLoading, actionLoading, approve, reject }
}