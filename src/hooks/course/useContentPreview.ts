// src/hooks/course/useContentPreview.ts
import { useState, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useContentPreview(courseId: string | null) {
    const { error: toastError } = useToast()
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const toggle = useCallback(async (contentId: string, needsBlob: boolean) => {
        if (expandedId === contentId) {
            setExpandedId(null)
            return
        }
        setExpandedId(contentId)

        if (needsBlob && !fileUrls[contentId] && courseId) {
            // SECURITY: getContentFileUrl now calls /stream-ticket over the network (SF-COURSE-03)
            // instead of building an immediate URL – so it is now async.
            setLoadingId(contentId)
            try {
                const url = await courseService.getContentFileUrl(courseId, contentId)
                // DEVIATION: guard against race condition – if the user opened another item
                // before this result returns, do not write the URL for an item that is no longer
                // the current one.
                setFileUrls(prev => (prev[contentId] ? prev : { ...prev, [contentId]: url }))
            } catch (err) {
                toastError(getErrorMessage(err))
            } finally {
                setLoadingId(current => (current === contentId ? null : current))
            }
        }
    }, [courseId, expandedId, fileUrls, toastError])

    return { expandedId, fileUrls, loadingId, toggle }
}