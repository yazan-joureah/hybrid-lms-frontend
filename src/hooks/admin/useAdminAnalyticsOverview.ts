// src/hooks/admin/useAdminAnalyticsOverview.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { adminAnalyticsService, type AdminAnalyticsOverview } from '../../services/adminAnalyticsService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useAdminAnalyticsOverview() {
    const { error: toastError } = useToast()
    const [overview, setOverview] = useState<AdminAnalyticsOverview | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchOverview = useCallback(async () => {
        setLoading(true)
        try {
            setOverview(await adminAnalyticsService.getOverview())
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [toastError])

    useEffect(() => { void fetchOverview() }, [fetchOverview])

    return { overview, loading, refetch: fetchOverview }
}