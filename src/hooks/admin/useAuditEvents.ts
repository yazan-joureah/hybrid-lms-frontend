// src/hooks/admin/useAuditEvents.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { securityAuditService, type AuditEventItem } from '../../services/securityAuditService'
import { getErrorMessage } from '../../utils/errorMessages'

const PAGE_SIZE = 20

export function useAuditEvents() {
    const { error: toastError } = useToast()
    const [items, setItems] = useState<AuditEventItem[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [actionFilter, setActionFilterState] = useState('')
    const [availableActions, setAvailableActions] = useState<string[]>([])

    useEffect(() => {
        securityAuditService.listActions().then(setAvailableActions).catch(() => { })
    }, [])

    const fetchEvents = useCallback(async () => {
        setLoading(true)
        try {
            const res = await securityAuditService.listEvents({
                action: actionFilter || undefined,
                page,
                pageSize: PAGE_SIZE,
            })
            setItems(res.items)
            setTotal(res.total)
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [actionFilter, page, toastError])

    useEffect(() => { void fetchEvents() }, [fetchEvents])

    const setActionFilter = (action: string) => {
        setActionFilterState(action)
        setPage(1)
    }

    const goToPage = (p: number) => setPage(Math.max(1, p))

    return {
        items, total, page, pageSize: PAGE_SIZE, loading,
        actionFilter, setActionFilter, availableActions,
        goToPage, refetch: fetchEvents,
    }
}