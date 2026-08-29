import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type Enrollment, type EnrollmentStatus } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useMyCourses() {
    const { error: toastError } = useToast()
    const [enrollments, setEnrollments] = useState<Enrollment[]>([])
    const [progressMap, setProgressMap] = useState<Record<string, number>>({})
    const [loading, setLoading] = useState(true)

    const fetchAll = useCallback(async () => {
        setLoading(true)
        try {
            const list = await courseService.getMyCourses()
            setEnrollments(list)

            const relevant = list.filter(e => e.status === 'active' || e.status === 'completed')
            const results = await Promise.all(
                relevant.map(async e => {
                    const courseId = e.course_id?._id
                    if (!courseId) return null
                    const summary = await courseService.getProgressSummary(courseId)
                    return { courseId, percentage: summary?.progress_percentage ?? 0 }
                })
            )
            const map: Record<string, number> = {}
            results.forEach(r => { if (r) map[r.courseId] = r.percentage })
            setProgressMap(map)
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [toastError])

    useEffect(() => { fetchAll() }, [fetchAll])

    const byStatus = (status: EnrollmentStatus) => enrollments.filter(e => e.status === status)

    return { enrollments, progressMap, loading, byStatus, refetch: fetchAll }
}