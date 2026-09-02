// src/hooks/admin/useDeletionRequests.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import {
    adminAccountService, type DeletionRequestItem, type DeletionReviewDecision,
} from '../../services/adminAccountService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useDeletionRequests() {
    const { success, error: toastError } = useToast()
    const [requests, setRequests] = useState<DeletionRequestItem[]>([])
    const [loading, setLoading] = useState(true)
    const [reviewingId, setReviewingId] = useState<string | null>(null)

    const fetchRequests = useCallback(async () => {
        setLoading(true)
        try {
            setRequests(await adminAccountService.listDeletionRequests('pending_review'))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [toastError])

    useEffect(() => { void fetchRequests() }, [fetchRequests])

    const review = async (requestId: string, decision: DeletionReviewDecision, decisionReason?: string) => {
        setReviewingId(requestId)
        try {
            await adminAccountService.reviewDeletionRequest(requestId, decision, decisionReason)
            success(decision === 'approve' ? 'تمت الموافقة على طلب الحذف.' : 'تم رفض طلب الحذف.')
            setRequests(prev => prev.filter(r => r._id !== requestId))
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        } finally {
            setReviewingId(null)
        }
    }

    return { requests, loading, reviewingId, review, refetch: fetchRequests }
}