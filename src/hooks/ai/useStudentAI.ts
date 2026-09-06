// src/hooks/ai/useStudentAI.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '../../context/ToastContext'
import { aiService, type AIMessage } from '../../services/aiService'
import { courseService, type Enrollment } from '../../services/courseService'
import { getErrorCode, getErrorMessage } from '../../utils/errorMessages'

export interface ChatMessage {
    id: string
    role: 'user' | 'assistant'
    text: string
    flagged: boolean
    time: string
}

function formatTime(iso?: string) {
    const d = iso ? new Date(iso) : new Date()
    return d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })
}

function mapHistory(messages: AIMessage[]): ChatMessage[] {
    return messages.map((m, i) => ({
        id: `${m.createdAt}-${i}`,
        role: m.sender === 'user' ? 'user' : 'assistant',
        text: m.text,
        flagged: m.flagged,
        time: formatTime(m.createdAt),
    }))
}

export function useStudentAI() {
    const { error: toastError } = useToast()

    const [courses, setCourses] = useState<Enrollment[]>([])
    const [loadingCourses, setLoadingCourses] = useState(true)
    const [selectedCourseId, setSelectedCourseId] = useState<string>('')

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [sending, setSending] = useState(false)

    // ✅ تتبّع محلي لأي كورس تم بدء جلسته بالفعل بهذه الجلسة (Session)
    // بالمتصفح، حتى ما ننادي startStudentSession مع كل رسالة بلا داعٍ.
    const sessionStartedRef = useRef<Set<string>>(new Set())

    // ---------- تحميل كورسات الطالب الفعّالة فقط ----------
    useEffect(() => {
        let cancelled = false
        setLoadingCourses(true)
        courseService.getMyCourses()
            .then(list => {
                if (cancelled) return
                const active = list.filter(e => e.status === 'active')
                setCourses(active)
                setSelectedCourseId(prev => prev || (active[0]?.course_id?._id ?? ''))
            })
            .catch(err => { if (!cancelled) toastError(getErrorMessage(err)) })
            .finally(() => { if (!cancelled) setLoadingCourses(false) })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const ensureSession = useCallback(async (courseId: string) => {
        if (sessionStartedRef.current.has(courseId)) return
        await aiService.startStudentSession(courseId)
        sessionStartedRef.current.add(courseId)
    }, [])

    // ---------- عند تبديل الكورس المختار: بدء الجلسة + تحميل السجل ----------
    useEffect(() => {
        if (!selectedCourseId) return
        let cancelled = false
        setLoadingHistory(true)
        setMessages([])

            ; (async () => {
                try {
                    await ensureSession(selectedCourseId)
                    const history = await aiService.getHistory(selectedCourseId)
                    if (!cancelled) setMessages(mapHistory(history))
                } catch (err) {
                    if (!cancelled) toastError(getErrorMessage(err))
                } finally {
                    if (!cancelled) setLoadingHistory(false)
                }
            })()

        return () => { cancelled = true }
    }, [selectedCourseId, ensureSession, toastError])

    const sendMessage = async (text: string) => {
        if (!text.trim() || !selectedCourseId || sending) return

        const userMsg: ChatMessage = { id: `local-${Date.now()}`, role: 'user', text, flagged: false, time: formatTime() }
        setMessages(prev => [...prev, userMsg])
        setSending(true)

        try {
            await ensureSession(selectedCourseId)
            let result: { reply: string; flagged: boolean }
            try {
                result = await aiService.queryAssistant(selectedCourseId, text)
            } catch (err) {
                // ✅ لو الباك رجّع SESSION_NOT_STARTED (مثلاً الجلسة أُغلقت بالسيرفر)
                // نعيد بدء الجلسة ونحاول مرة واحدة إضافية فقط.
                if (getErrorCode(err) === 'SESSION_NOT_STARTED') {
                    sessionStartedRef.current.delete(selectedCourseId)
                    await ensureSession(selectedCourseId)
                    result = await aiService.queryAssistant(selectedCourseId, text)
                } else {
                    throw err
                }
            }
            const assistantMsg: ChatMessage = {
                id: `local-${Date.now() + 1}`,
                role: 'assistant',
                text: result.reply,
                flagged: result.flagged,
                time: formatTime(),
            }
            setMessages(prev => [...prev, assistantMsg])
        } catch (err) {
            toastError(getErrorMessage(err))
            setMessages(prev => prev.filter(m => m.id !== userMsg.id))
        } finally {
            setSending(false)
        }
    }

    return {
        courses, loadingCourses,
        selectedCourseId, setSelectedCourseId,
        messages, loadingHistory, sending,
        sendMessage,
    }
}