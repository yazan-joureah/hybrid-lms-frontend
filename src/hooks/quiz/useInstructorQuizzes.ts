// src/hooks/quiz/useInstructorQuizzes.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { quizService, type Quiz, type QuizFormPayload } from '../../services/quizService'
import { getErrorCode, getErrorMessage } from '../../utils/errorMessages'

export function useInstructorQuizzes(courseId: string | null) {
    const { success, error: toastError } = useToast()
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [loading, setLoading] = useState(false)

    const fetchQuizzes = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        try {
            setQuizzes(await quizService.listForCourse(courseId))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [courseId, toastError])

    useEffect(() => { fetchQuizzes() }, [fetchQuizzes])

    const createQuiz = async (form: QuizFormPayload) => {
        if (!courseId) return false
        try {
            await quizService.create(courseId, form)
            success('تم إنشاء الاختبار كمسودة بنجاح!')
            await fetchQuizzes()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    const updateQuiz = async (quizId: string, form: QuizFormPayload) => {
        try {
            await quizService.update(quizId, form)
            success('تم تحديث الاختبار بنجاح!')
            await fetchQuizzes()
            return true
        } catch (err) {
            if (getErrorCode(err) === 'QUIZ_LOCKED') await fetchQuizzes()
            toastError(getErrorMessage(err))
            return false
        }
    }

    const deleteQuiz = async (quiz: Quiz) => {
        if (quiz.locked) { toastError('لا يمكن حذف اختبار مقفل لوجود محاولات طلاب عليه.'); return }
        if (!window.confirm(`هل أنت متأكد من حذف "${quiz.title}"؟`)) return
        try {
            await quizService.delete(quiz._id)
            success('تم حذف الاختبار.')
            await fetchQuizzes()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const publishQuiz = async (quizId: string) => {
        try {
            await quizService.publish(quizId)
            success('تم نشر الاختبار! أصبح متاحاً للطلاب الآن.')
            await fetchQuizzes()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const finalExam = quizzes.find(q => q.quiz_type === 'exam')

    return { quizzes, loading, finalExam, createQuiz, updateQuiz, deleteQuiz, publishQuiz, refetch: fetchQuizzes }
}