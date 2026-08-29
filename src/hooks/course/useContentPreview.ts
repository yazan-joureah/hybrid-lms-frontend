// src/hooks/course/useContentPreview.ts
import { useState, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useContentPreview(courseId: string | null) {
    const { error: toastError } = useToast()
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [blobUrls, setBlobUrls] = useState<Record<string, string>>({})
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const toggle = useCallback(async (contentId: string, needsBlob: boolean) => {
        if (expandedId === contentId) { setExpandedId(null); return }
        setExpandedId(contentId)
        if (needsBlob && !blobUrls[contentId] && courseId) {
            setLoadingId(contentId)
            try {
                const blob = await courseService.getContentFileBlob(courseId, contentId)
                const url = URL.createObjectURL(blob)
                setBlobUrls(prev => ({ ...prev, [contentId]: url }))
            } catch (err) {
                toastError(getErrorMessage(err))
            } finally {
                setLoadingId(null)
            }
        }
    }, [courseId, expandedId, blobUrls, toastError])

    return { expandedId, blobUrls, loadingId, toggle }
}