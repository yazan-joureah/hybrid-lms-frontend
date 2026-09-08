// src/hooks/ai/useInstructorAI.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '../../context/ToastContext'
import { aiService, type InstructorAIOption } from '../../services/aiService'
import { courseService, type InstructorCourse } from '../../services/courseService'
import { getErrorCode, getErrorMessage } from '../../utils/errorMessages'

export interface InstructorChatMessage {
    id: string
    role: 'user' | 'assistant'
    text: string
    flagged: boolean
    time: string
}

function formatTime() {
    return new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
}

/**
 * ⚠️ لا يوجد endpoint لسجلّ محادثة المحاضر بالباك اند (aiRoutes.js يملك
 * فقط GET /student/history — لا مقابل لها بجانب Instructor). المحادثة
 * هون محفوظة محلياً بالذاكرة (state) فقط، لكل كورس على حدة، وتُفرَّغ
 * عند تبديل الكورس أو تحديث الصفحة. هذا سلوك مقصود يطابق الـ API
 * الحالي، وليس نقصاً بالتنفيذ.
 */
export function useInstructorAI() {
    const { error: toastError } = useToast()

    const [courses, setCourses] = useState<InstructorCourse[]>([])
    const [loadingCourses, setLoadingCourses] = useState(true)
    const [selectedCourseId, setSelectedCourseId] = useState<string>('')
    const [mode, setMode] = useState<InstructorAIOption>('content_suggestions')

    const [messagesByCourse, setMessagesByCourse] = useState<Record<string, InstructorChatMessage[]>>({})
    const [starting, setStarting] = useState(false)
    const [sending, setSending] = useState(false)

    const sessionStartedRef = useRef<Set<string>>(new Set())

    // ---------- تحميل كورسات المحاضر ----------
    useEffect(() => {
        let cancelled = false
        setLoadingCourses(true)
        courseService.getMyInstructorCourses()
            .then(list => {
                if (cancelled) return
                setCourses(list)
                setSelectedCourseId(prev => prev || (list[0]?._id ?? ''))
            })
            .catch(err => { if (!cancelled) toastError(getErrorMessage(err)) })
            .finally(() => { if (!cancelled) setLoadingCourses(false) })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // UC-AI-04 — بدء/تحديث الجلسة (SF-AI-01 تُبنى بالباك اند تلقائياً معها)
    const ensureSession = useCallback(async (courseId: string) => {
        if (sessionStartedRef.current.has(courseId)) return
        setStarting(true)
        try {
            await aiService.startInstructorSession(courseId)
            sessionStartedRef.current.add(courseId)
        } finally {
            setStarting(false)
        }
    }, [])

    // عند تبديل الكورس المختار: بدء الجلسة (بلا تحميل سجل — غير متاح للمحاضر)
    useEffect(() => {
        if (!selectedCourseId) return
        let cancelled = false
            ; (async () => {
                try {
                    await ensureSession(selectedCourseId)
                } catch (err) {
                    if (!cancelled) toastError(getErrorMessage(err))
                }
            })()
        return () => { cancelled = true }
    }, [selectedCourseId, ensureSession, toastError])

    const pushMessage = (courseId: string, msg: InstructorChatMessage) => {
        setMessagesByCourse(prev => ({ ...prev, [courseId]: [...(prev[courseId] || []), msg] }))
    }

    // UC-AI-05 (content_suggestions) أو UC-AI-06 (performance_summary)
    const sendMessage = async (text: string) => {
        if (!text.trim() || !selectedCourseId || sending) return
        const courseId = selectedCourseId

        const userMsg: InstructorChatMessage = { id: `local-${Date.now()}`, role: 'user', text, flagged: false, time: formatTime() }
        pushMessage(courseId, userMsg)
        setSending(true)

        try {
            await ensureSession(courseId)

            const call = () => mode === 'content_suggestions'
                ? aiService.generateContentSuggestions(courseId, text)
                : aiService.getPerformanceSummary(courseId, text)

            let result: { reply: string; flagged: boolean }
            try {
                result = await call()
            } catch (err) {
                // ✅ نفس منطق useStudentAI: لو الجلسة انقفلت بالسيرفر، نعيد
                // بدءها ونحاول مرة إضافية واحدة فقط.
                if (getErrorCode(err) === 'SESSION_NOT_STARTED') {
                    sessionStartedRef.current.delete(courseId)
                    await ensureSession(courseId)
                    result = await call()
                } else {
                    throw err
                }
            }

            pushMessage(courseId, {
                id: `local-${Date.now() + 1}`,
                role: 'assistant',
                text: result.reply,
                flagged: result.flagged,
                time: formatTime(),
            })
        } catch (err) {
            toastError(getErrorMessage(err))
            setMessagesByCourse(prev => ({
                ...prev,
                [courseId]: (prev[courseId] || []).filter(m => m.id !== userMsg.id),
            }))
        } finally {
            setSending(false)
        }
    }

    return {
        courses,
        loadingCourses,
        selectedCourseId,
        setSelectedCourseId,
        mode,
        setMode,
        messages: selectedCourseId ? (messagesByCourse[selectedCourseId] || []) : [],
        starting,
        sending,
        sendMessage,
    }
}