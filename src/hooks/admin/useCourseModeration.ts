// src/hooks/admin/useCourseModeration.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type PendingCourseSummary, type CourseReviewDecision, type CourseModerationStatus } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'

export type CourseModerationView = 'pending' | 'all'

export function useCourseModeration() {
    const { success, error: toastError } = useToast()
    const [view, setView] = useState<CourseModerationView>('pending')
    const [statusFilter, setStatusFilter] = useState('')
    const [courses, setCourses] = useState<PendingCourseSummary[]>([])
    const [loading, setLoading] = useState(true)

    const fetchCourses = useCallback(async () => {
        setLoading(true)
        try {
            if (view === 'pending') {
                setCourses(await courseService.getPendingCourses())
            } else {
                const result = await courseService.getAllCoursesForAdmin({ status: statusFilter || undefined })
                setCourses(result.courses)
            }
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [view, statusFilter, toastError])

    useEffect(() => { fetchCourses() }, [fetchCourses])

    const submitReview = async (courseId: string, decision: CourseReviewDecision, reason?: string) => {
        try {
            await courseService.submitCourseReview(courseId, decision, reason)
            success(
                decision === 'publish' ? 'تم نشر الكورس بنجاح!' :
                    decision === 'reject' ? 'تم رفض الكورس.' :
                        'تم إرجاع الكورس للمحاضر لإجراء تعديلات.'
            )
            await fetchCourses()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    const moderateStatus = async (courseId: string, status: CourseModerationStatus) => {
        try {
            await courseService.updateCourseStatus(courseId, status)
            success(
                status === 'suspended' ? 'تم تعليق الكورس.' :
                    status === 'archived' ? 'تم أرشفة الكورس.' :
                        'تمت إعادة تفعيل الكورس ونشره من جديد.'
            )
            await fetchCourses()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    return { view, setView, statusFilter, setStatusFilter, courses, loading, submitReview, moderateStatus, refetch: fetchCourses }
}