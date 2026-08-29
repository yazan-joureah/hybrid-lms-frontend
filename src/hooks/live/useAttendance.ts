import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { attendanceService, type CourseAttendanceSummary, type SessionReport } from '../../services/liveService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useAttendance(courseId: string | null) {
    const { success, error: toastError } = useToast()
    const [summary, setSummary] = useState<CourseAttendanceSummary | null>(null)
    const [report, setReport] = useState<SessionReport | null>(null)
    const [loading, setLoading] = useState(false)
    const [correctingId, setCorrectingId] = useState<string | null>(null)

    const fetchSummary = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        try {
            setSummary(await attendanceService.getCourseSummary(courseId))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [courseId, toastError])

    useEffect(() => { void fetchSummary() }, [fetchSummary])

    const fetchReport = async (sessionId: string) => {
        if (!sessionId) return
        setLoading(true)
        try {
            setReport(await attendanceService.getSessionReport(sessionId))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    const exportCSV = async (sessionId: string) => {
        try {
            const blob = await attendanceService.exportSessionCSV(sessionId)
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `attendance_session_${sessionId}.csv`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const correctAttendance = async (sessionId: string, studentId: string, reason: string) => {
        setCorrectingId(studentId)
        try {
            await attendanceService.correctAttendance(sessionId, studentId, reason)
            success('تم تصحيح حالة الحضور بنجاح.')
            await fetchReport(sessionId)
            await fetchSummary()
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setCorrectingId(null)
        }
    }

    return { summary, report, loading, correctingId, fetchReport, exportCSV, correctAttendance, refetchSummary: fetchSummary }
}