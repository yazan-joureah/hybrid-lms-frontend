// src/hooks/peer/useAssignmentGrades.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { peerService, type InstructorGradeRow } from '../../services/peerService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useAssignmentGrades(assignmentId: string) {
    const { success, error: toastError } = useToast()
    const [grades, setGrades] = useState<InstructorGradeRow[]>([])
    const [loading, setLoading] = useState(true)

    const fetchGrades = useCallback(async () => {
        setLoading(true)
        try {
            setGrades(await peerService.getAllGrades(assignmentId))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [assignmentId, toastError])

    useEffect(() => { fetchGrades() }, [fetchGrades])

    const overrideGrade = async (submissionId: string, score: number, reason: string) => {
        try {
            await peerService.overrideGrade(assignmentId, submissionId, score, reason)
            success('تم تحديث الدرجة يدوياً بنجاح.')
            await fetchGrades()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    return { grades, loading, overrideGrade, refetch: fetchGrades }
}