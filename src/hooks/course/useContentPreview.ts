// src/hooks/course/useContentPreview.ts
import { useState, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService } from '../../services/courseService'

export function useContentPreview(courseId: string | null) {
    const { error: toastError } = useToast()
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [fileUrls, setFileUrls] = useState<Record<string, string>>({})

    const toggle = useCallback((contentId: string, needsBlob: boolean) => {
        if (expandedId === contentId) {
            setExpandedId(null)
            return
        }
        setExpandedId(contentId)

        if (needsBlob && !fileUrls[contentId] && courseId) {
            // Generate the direct URL (no async fetch needed)
            const url = courseService.getContentFileUrl(courseId, contentId)
            setFileUrls(prev => ({ ...prev, [contentId]: url }))
        }
    }, [courseId, expandedId, fileUrls])

    return { expandedId, fileUrls, toggle }
}