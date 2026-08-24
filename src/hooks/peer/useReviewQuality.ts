// src/hooks/peer/useReviewQuality.ts
import { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { peerService, type QualityTimelineEntry } from '../../services/peerService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useReviewQuality(assignmentId: string) {
    const { error: toastError } = useToast()
    const [timeline, setTimeline] = useState<QualityTimelineEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        peerService.listReviewQualityTimeline(assignmentId)
            .then(data => { if (!cancelled) setTimeline(data) })
            .catch(err => { if (!cancelled) toastError(getErrorMessage(err)) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentId])

    return { timeline, loading }
}