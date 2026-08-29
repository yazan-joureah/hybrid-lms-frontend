// src/hooks/peer/useInstructorPeerAssignments.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { peerService, type PeerAssignment, type PeerAssignmentFormPayload } from '../../services/peerService'
import { getErrorCode, getErrorMessage } from '../../utils/errorMessages'

export function useInstructorPeerAssignments(courseId: string | null) {
    const { success, error: toastError } = useToast()
    const [assignments, setAssignments] = useState<PeerAssignment[]>([])
    const [loading, setLoading] = useState(false)

    const fetchAssignments = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        try {
            const all = await peerService.listAssignments()
            setAssignments(all.filter(a => String(typeof a.courseId === 'object' ? a.courseId._id : a.courseId) === String(courseId)))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [courseId, toastError])

    useEffect(() => { fetchAssignments() }, [fetchAssignments])

    const createAssignment = async (form: PeerAssignmentFormPayload) => {
        if (!courseId) return false
        try {
            await peerService.createAssignment(courseId, form)
            success('تم إنشاء مهمة المراجعة الجماعية بنجاح.')
            await fetchAssignments()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    const updateAssignment = async (assignmentId: string, form: PeerAssignmentFormPayload) => {
        try {
            await peerService.updateAssignment(assignmentId, form)
            success('تم تحديث المهمة بنجاح.')
            await fetchAssignments()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    const deleteAssignment = async (assignment: PeerAssignment) => {
        if (!window.confirm(`هل أنت متأكد من حذف "${assignment.title}"؟`)) return
        try {
            await peerService.deleteAssignment(assignment._id)
            success('تم حذف المهمة.')
            await fetchAssignments()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const distributeReviews = async (assignment: PeerAssignment) => {
        if (!window.confirm('سيتم توزيع المراجعات عشوائياً على الطلاب الآن. هل تريد المتابعة؟')) return
        try {
            await peerService.distributeReviews(assignment._id)
            success('تم توزيع المراجعات بنجاح!')
            await fetchAssignments()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const calculateGrades = async (assignmentId: string, lockAssignment: boolean) => {
        try {
            await peerService.calculateGrades(assignmentId, lockAssignment)
            success('تم احتساب الدرجات النهائية بنجاح!')
            await fetchAssignments()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    return { assignments, loading, createAssignment, updateAssignment, deleteAssignment, distributeReviews, calculateGrades, refetch: fetchAssignments, getErrorCode }
}