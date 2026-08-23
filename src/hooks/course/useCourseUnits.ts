import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type UnitDetail, type ContentFormInput } from '../../services/courseService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useCourseUnits(courseId: string | null) {
    const { success, error: toastError } = useToast()
    const [units, setUnits] = useState<UnitDetail[]>([])
    const [loading, setLoading] = useState(false)

    const fetchUnits = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        try {
            setUnits(await courseService.getUnitsWithContent(courseId))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [courseId, toastError])

    useEffect(() => { fetchUnits() }, [fetchUnits])

    const addUnit = async (title: string, desc?: string) => {
        if (!courseId) return
        try {
            await courseService.addUnit(courseId, title, desc)
            success('تمت إضافة الوحدة!')
            await fetchUnits()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const updateUnit = async (unitId: string, title: string, desc?: string) => {
        if (!courseId) return
        try {
            await courseService.updateUnit(courseId, unitId, title, desc)
            success('تم تحديث الوحدة.')
            await fetchUnits()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const deleteUnit = async (unitId: string) => {
        if (!courseId) return
        try {
            await courseService.deleteUnit(courseId, unitId)
            success('تم حذف الوحدة.')
            await fetchUnits()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const moveUnit = async (index: number, direction: -1 | 1) => {
        if (!courseId) return
        const targetIndex = index + direction
        if (targetIndex < 0 || targetIndex >= units.length) return
        const reordered = [...units]
            ;[reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]]
        setUnits(reordered) // تحديث متفائل فوري
        try {
            await courseService.reorderUnits(courseId, reordered.map(u => u._id))
        } catch (err) {
            toastError(getErrorMessage(err))
            fetchUnits() // تراجع عند الفشل
        }
    }

    const addContent = async (unitId: string, input: ContentFormInput) => {
        if (!courseId) return false
        try {
            await courseService.addContent(courseId, unitId, input)
            success('تمت إضافة المحتوى!')
            await fetchUnits()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    const deleteContent = async (unitId: string, contentId: string) => {
        if (!courseId) return
        try {
            await courseService.deleteContent(courseId, unitId, contentId)
            success('تم حذف المحتوى.')
            await fetchUnits()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    return { units, loading, addUnit, updateUnit, deleteUnit, moveUnit, addContent, deleteContent, refetch: fetchUnits }
}