// src/hooks/report/useInstructorCourseAnalytics.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { instructorAnalyticsService, type InstructorCourseAnalytics } from '../../services/instructorAnalyticsService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useInstructorCourseAnalytics(courseId: string | null) {
    const { error: toastError } = useToast()
    const [analytics, setAnalytics] = useState<InstructorCourseAnalytics | null>(null)
    const [loading, setLoading] = useState(false)

    const fetchAnalytics = useCallback(async () => {
        if (!courseId) { setAnalytics(null); return }
        setLoading(true)
        try {
            setAnalytics(await instructorAnalyticsService.getCourseAnalytics(courseId))
        } catch (err) {
            toastError(getErrorMessage(err))
            setAnalytics(null)
        } finally {
            setLoading(false)
        }
    }, [courseId, toastError])

    useEffect(() => { void fetchAnalytics() }, [fetchAnalytics])

    return { analytics, loading, refetch: fetchAnalytics }
}