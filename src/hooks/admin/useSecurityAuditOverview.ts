// src/hooks/admin/useSecurityAuditOverview.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { securityAuditService, type SecurityAuditOverview } from '../../services/securityAuditService'
import { getErrorMessage } from '../../utils/errorMessages'

export const RANGE_OPTIONS = [7, 30, 90] as const

export function useSecurityAuditOverview() {
    const { error: toastError } = useToast()
    const [rangeDays, setRangeDays] = useState<number>(30)
    const [overview, setOverview] = useState<SecurityAuditOverview | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchOverview = useCallback(async () => {
        setLoading(true)
        try {
            setOverview(await securityAuditService.getOverview(rangeDays))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [rangeDays, toastError])

    useEffect(() => { void fetchOverview() }, [fetchOverview])

    return { overview, loading, rangeDays, setRangeDays, refetch: fetchOverview }
}