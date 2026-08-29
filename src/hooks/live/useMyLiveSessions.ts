// src/hooks/live/useMyLiveSessions.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { liveService, type LiveSession } from '../../services/liveService'
import { getErrorMessage } from '../../utils/errorMessages'

const POLL_MS = 30000

export function useMyLiveSessions() {
    const { error: toastError } = useToast()
    const [sessions, setSessions] = useState<LiveSession[]>([])
    const [loading, setLoading] = useState(true)

    const fetchSessions = useCallback(async () => {
        try {
            setSessions(await liveService.getSessions())
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [toastError])

    useEffect(() => {
        void fetchSessions()
        const iv = setInterval(fetchSessions, POLL_MS)
        return () => clearInterval(iv)
    }, [fetchSessions])

    const sorted = [...sessions].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

    return { sessions: sorted, loading, refetch: fetchSessions }
}