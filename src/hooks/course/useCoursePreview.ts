// src/hooks/course/useCoursePreview.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type CourseSummary, type UnitDetail } from '../../services/courseService'
import { quizService, type Quiz } from '../../services/quizService'
import { getErrorMessage } from '../../utils/errorMessages'

interface Options { viewerRole: 'instructor' | 'admin' }

export function useCoursePreview(courseId: string | null, { viewerRole }: Options) {
    const { error: toastError } = useToast()
    const [course, setCourse] = useState<CourseSummary | null>(null)
    const [units, setUnits] = useState<UnitDetail[]>([])
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(false)

    const load = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        try {
            const [courseData, unitsData, quizzesData] = await Promise.all([
                courseService.getById(courseId),
                courseService.getUnitsWithContent(courseId),
                viewerRole === 'admin' ? quizService.listForCourseAdmin(courseId) : quizService.listForCourse(courseId),
            ])
            setCourse(courseData)
            setUnits(unitsData)
            setQuizzes(quizzesData)
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [courseId, viewerRole, toastError])

    useEffect(() => { load() }, [load])

    return { course, units, quizzes, loading }
}