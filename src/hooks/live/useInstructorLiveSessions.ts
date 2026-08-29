import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { liveService, type LiveSession, type LiveSessionFormPayload } from '../../services/liveService'
import { getErrorMessage } from '../../utils/errorMessages'

const POLL_MS = 30000

const extractId = (field?: string | { _id: string } | null) =>
    field ? String(typeof field === 'object' ? field._id : field) : null

export function useInstructorLiveSessions(courseId: string | null) {
    const { success, error: toastError } = useToast()
    const [sessions, setSessions] = useState<LiveSession[]>([])
    const [loading, setLoading] = useState(false)

    const fetchSessions = useCallback(async () => {
        if (!courseId) return
        setLoading(true)
        try {
            const all = await liveService.getSessions({ courseId })
            setSessions(all.filter(s => extractId(s.courseId) === String(courseId)))
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }, [courseId, toastError])

    useEffect(() => {
        void fetchSessions()
        const iv = setInterval(fetchSessions, POLL_MS)
        return () => clearInterval(iv)
    }, [fetchSessions])

    const createSession = async (payload: LiveSessionFormPayload): Promise<boolean> => {
        if (!courseId) return false
        try {
            await liveService.createSession(courseId, payload)
            success('تم جدولة الحصة المباشرة بنجاح!')
            await fetchSessions()
            return true
        } catch (err) {
            const code = (err as any)?.response?.data?.error?.code
            if (code === 'SESSION_TIME_CONFLICT') {
                const proceed = window.confirm('يوجد تعارض زمني مع جلسة أخرى لنفس الكورس. هل تريد الجدولة رغم ذلك؟')
                if (!proceed) return false
                try {
                    await liveService.createSession(courseId, payload, true)
                    success('تم جدولة الحصة المباشرة بنجاح!')
                    await fetchSessions()
                    return true
                } catch (err2) {
                    toastError(getErrorMessage(err2))
                    return false
                }
            }
            toastError(getErrorMessage(err))
            return false
        }
    }

    const updateSession = async (sessionId: string, payload: Omit<LiveSessionFormPayload, 'unitId'>): Promise<boolean> => {
        try {
            await liveService.updateSession(sessionId, payload)
            success('تم تحديث الحصة بنجاح.')
            await fetchSessions()
            return true
        } catch (err) {
            const code = (err as any)?.response?.data?.error?.code
            if (code === 'SESSION_TIME_CONFLICT') {
                const proceed = window.confirm('يوجد تعارض زمني مع جلسة أخرى لنفس الكورس. هل تريد الحفظ رغم ذلك؟')
                if (!proceed) return false
                try {
                    await liveService.updateSession(sessionId, payload, true)
                    success('تم تحديث الحصة بنجاح.')
                    await fetchSessions()
                    return true
                } catch (err2) {
                    toastError(getErrorMessage(err2))
                    return false
                }
            }
            toastError(getErrorMessage(err))
            return false
        }
    }

    const cancelSession = async (sessionId: string, reason?: string) => {
        try {
            await liveService.cancelSession(sessionId, reason)
            success('تم إلغاء الحصة.')
            await fetchSessions()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const startSession = async (sessionId: string) => {
        try {
            await liveService.startSession(sessionId)
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    const endSession = async (sessionId: string) => {
        try {
            await liveService.endSession(sessionId)
            success('تم إنهاء الحصة.')
            await fetchSessions()
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const attachRecording = async (sessionId: string, recordingUrl: string) => {
        try {
            await liveService.attachRecording(sessionId, recordingUrl)
            success('تم حفظ رابط التسجيل.')
            await fetchSessions()
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        }
    }

    return { sessions, loading, createSession, updateSession, cancelSession, startSession, endSession, attachRecording, refetch: fetchSessions }
}