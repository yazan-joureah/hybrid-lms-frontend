// src/hooks/admin/useKycRequests.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { kycService, type KycListItem } from '../../services/kycService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useKycRequests() {
    const { error: toastError } = useToast()
    const [requests, setRequests] = useState<KycListItem[]>([])
    const [loading, setLoading] = useState(true)

    const fetchList = useCallback(async () => {
        setLoading(true)
        try {
            setRequests(await kycService.listPending())
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [toastError])

    useEffect(() => { fetchList() }, [fetchList])

    return { requests, loading, refetch: fetchList }
}