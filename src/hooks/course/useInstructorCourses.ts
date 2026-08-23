import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type InstructorCourse } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useInstructorCourses() {
    const { error: toastError } = useToast()
    const [courses, setCourses] = useState<InstructorCourse[]>([])
    const [loading, setLoading] = useState(true)

    const fetchCourses = useCallback(async () => {
        setLoading(true)
        try {
            setCourses(await courseService.getMyInstructorCourses())
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [toastError])

    useEffect(() => { fetchCourses() }, [fetchCourses])

    return { courses, loading, refetch: fetchCourses }
}