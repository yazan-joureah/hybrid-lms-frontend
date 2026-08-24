// src/hooks/peer/useAssignmentSubmissions.ts
import { useState, useEffect } from 'react'
import { useToast } from '../../context/ToastContext'
import { peerService, type InstructorSubmissionRow } from '../../services/peerService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useAssignmentSubmissions(assignmentId: string) {
    const { error: toastError } = useToast()
    const [submissions, setSubmissions] = useState<InstructorSubmissionRow[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        peerService.listSubmissions(assignmentId)
            .then(data => { if (!cancelled) setSubmissions(data) })
            .catch(err => { if (!cancelled) toastError(getErrorMessage(err)) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentId])

    return { submissions, loading }
}