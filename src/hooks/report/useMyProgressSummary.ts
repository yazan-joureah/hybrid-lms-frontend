// src/hooks/report/useMyProgressSummary.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { reportService, type PersonalProgressSummary } from '../../services/reportService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useMyProgressSummary() {
    const { error: toastError } = useToast()
    const [summary, setSummary] = useState<PersonalProgressSummary | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchSummary = useCallback(async () => {
        setLoading(true)
        try {
            setSummary(await reportService.getMyProgressSummary())
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [toastError])

    useEffect(() => { void fetchSummary() }, [fetchSummary])

    return { summary, loading, refetch: fetchSummary }
}