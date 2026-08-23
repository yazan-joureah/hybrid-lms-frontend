import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type InstructorCourse, type CourseFormPayload } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useCourseDetail(courseId: string | null, onChanged?: () => void) {
    const { success, error: toastError } = useToast()
    const [detail, setDetail] = useState<InstructorCourse | null>(null)
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [coverUploading, setCoverUploading] = useState(false)

    const fetchDetail = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        try {
            const course = await courseService.getById(courseId)
            setDetail(course as InstructorCourse)
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [courseId, toastError])

    useEffect(() => { fetchDetail() }, [fetchDetail])

    const updateCourse = async (payload: Partial<CourseFormPayload>) => {
        if (!courseId) return false
        setSaving(true)
        try {
            await courseService.updateCourse(courseId, payload)
            success('تم تحديث بيانات الكورس بنجاح!')
            await fetchDetail()
            onChanged?.()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        } finally {
            setSaving(false)
        }
    }

    const deleteCourse = async () => {
        if (!courseId) return false
        try {
            await courseService.deleteCourse(courseId)
            success('تم حذف الكورس.')
            onChanged?.()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    const uploadCover = async (file: File) => {
        if (!courseId) return
        setCoverUploading(true)
        try {
            await courseService.uploadCoverImage(courseId, file)
            success('تم تحديث صورة الغلاف!')
            await fetchDetail()
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setCoverUploading(false)
        }
    }

    const submitForReview = async () => {
        if (!courseId) return
        try {
            await courseService.submitForReview(courseId)
            success('تم إرسال الكورس للمراجعة!')
            await fetchDetail()
            onChanged?.()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const cancelReview = async () => {
        if (!courseId) return
        try {
            await courseService.cancelReview(courseId)
            success('تم إلغاء طلب المراجعة.')
            await fetchDetail()
            onChanged?.()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    return { detail, loading, saving, coverUploading, updateCourse, deleteCourse, uploadCover, submitForReview, cancelReview, refetch: fetchDetail }
}