// src/hooks/course/useCourseStudents.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type EnrolledStudent } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useCourseStudents(courseId: string | null) {
    const { error: toastError } = useToast()
    const [students, setStudents] = useState<EnrolledStudent[]>([])
    const [loading, setLoading] = useState(false)

    const fetchStudents = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        try {
            setStudents(await courseService.getEnrolledStudents(courseId))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [courseId, toastError])

    useEffect(() => { fetchStudents() }, [fetchStudents])

    return { students, loading, refetch: fetchStudents }
}