// src/hooks/admin/useCourseModeration.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type PendingCourseSummary, type CourseReviewDecision, type CourseModerationStatus } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useCourseModeration() {
    const { success, error: toastError } = useToast()
    const [courses, setCourses] = useState<PendingCourseSummary[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPending = useCallback(async () => {
        setLoading(true)
        try {
            setCourses(await courseService.getPendingCourses())
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [toastError])

    useEffect(() => { fetchPending() }, [fetchPending])

    const submitReview = async (courseId: string, decision: CourseReviewDecision, reason?: string) => {
        try {
            await courseService.submitCourseReview(courseId, decision, reason)
            success(
                decision === 'publish' ? 'تم نشر الكورس بنجاح!' :
                    decision === 'reject' ? 'تم رفض الكورس.' :
                        'تم إرجاع الكورس للمحاضر لإجراء تعديلات.'
            )
            await fetchPending()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    const moderateStatus = async (courseId: string, status: CourseModerationStatus) => {
        try {
            await courseService.updateCourseStatus(courseId, status)
            success(status === 'suspended' ? 'تم تعليق الكورس.' : 'تم أرشفة الكورس.')
            await fetchPending()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    return { courses, loading, submitReview, moderateStatus }
}