// src/hooks/quiz/useStudentQuizEngine.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { quizService, type ActiveAttempt, type QuizResult, type StudentQuizSummary } from '../../services/quizService'
import { getErrorCode, getErrorMessage } from '../../utils/errorMessages'

type EngineState = 'checking' | 'intro' | 'in_progress' | 'result'
const HEARTBEAT_MS = 20000

export function useStudentQuizEngine(quiz: StudentQuizSummary, onCompleted?: () => void) {
    const { showToast, error: toastError, success } = useToast()

    const [state, setState] = useState<EngineState>('checking')
    const [attempt, setAttempt] = useState<ActiveAttempt | null>(null)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [currentIndex, setCurrentIndex] = useState(0)
    const [timeRemaining, setTimeRemaining] = useState(0)
    const [result, setResult] = useState<QuizResult | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved')
    const [starting, setStarting] = useState(false)

    const submittingRef = useRef(false)

    const applyAttempt = (data: ActiveAttempt) => {
        setAttempt(data)
        const map: Record<string, string> = {}
            ; (data.previous_answers || []).forEach(a => { map[a.question_id] = a.selected_choice_id })
        setAnswers(map)
        setCurrentIndex(0)
        const remaining = Math.max(0, Math.floor((new Date(data.expires_at).getTime() - Date.now()) / 1000))
        setTimeRemaining(remaining)
        setState('in_progress')
    }

    useEffect(() => {
        let cancelled = false
        const check = async () => {
            try {
                const existing = await quizService.getCurrentAttempt(quiz._id)
                if (cancelled) return
                if (existing) { applyAttempt(existing); showToast('...', 'info'); return }
                // ✅ لا توجد محاولة جارية — لكن هل يوجد نتيجة سابقة؟
                if (quiz.last_result) {
                    setResult({
                        score: 0, // أو أرسلها من الباك إن احتجتها بدقة
                        total_possible: 0,
                        percentage: quiz.last_result.score_percent,
                        passed: quiz.last_result.passed,
                    })
                    setState('result')
                    return
                }
                setState('intro')
            } catch {
                if (!cancelled) setState('intro')
            }
        }
        void check()
        return () => { cancelled = true }
    }, [quiz._id, quiz.last_result])

    const startQuiz = async () => {
        setStarting(true)
        try {
            const data = await quizService.startAttempt(quiz._id)
            applyAttempt(data)
        } catch (err) {
            if (getErrorCode(err) === 'ATTEMPT_IN_PROGRESS') {
                try {
                    const existing = await quizService.getCurrentAttempt(quiz._id)
                    if (existing) { applyAttempt(existing); showToast('جارٍ استئناف محاولتك السابقة...', 'info'); return }
                } catch { /* fallthrough */ }
            }
            toastError(getErrorMessage(err))
        } finally {
            setStarting(false)
        }
    }

    const saveAnswer = useCallback(async (questionId: string, choiceId: string) => {
        if (!attempt) return
        setAutoSaveStatus('saving')
        try {
            await quizService.saveAnswer(attempt.attempt_id, questionId, choiceId)
            setAutoSaveStatus('saved')
        } catch (err) {
            if (getErrorCode(err) === 'ATTEMPT_TIMED_OUT') {
                showToast('انتهى الوقت المسموح! جارٍ إرسال إجاباتك...', 'warning')
                void submitQuiz(true)
            } else {
                setAutoSaveStatus('error')
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attempt])

    const selectChoice = (questionId: string, choiceId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: choiceId }))
        void saveAnswer(questionId, choiceId)
    }

    useEffect(() => {
        if (state !== 'in_progress' || !attempt) return

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) { clearInterval(timer); void submitQuiz(true); return 0 }
                return prev - 1
            })
        }, 1000)

        const heartbeat = setInterval(() => {
            const question = attempt.quiz.questions[currentIndex]
            if (question && answers[question._id]) void saveAnswer(question._id, answers[question._id])
        }, HEARTBEAT_MS)

        return () => { clearInterval(timer); clearInterval(heartbeat) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state, attempt, currentIndex, answers])

    const submitQuiz = async (isTimeout = false) => {
        if (submittingRef.current || !attempt) return
        submittingRef.current = true
        setSubmitting(true)
        try {
            const data = await quizService.submitAttempt(attempt.attempt_id)
            setResult(data)
            setState('result')
            success(data.passed ? '🎉 مبروك! لقد اجتزت الاختبار.' : 'تم إنهاء الاختبار. راجع نتيجتك أدناه.')
            onCompleted?.()
        } catch (err) {
            toastError(isTimeout ? 'انتهى الوقت ولكن فشل إرسال إجاباتك تلقائياً.' : getErrorMessage(err))
        } finally {
            setSubmitting(false)
            submittingRef.current = false
        }
    }

    const goToQuestion = (index: number) => setCurrentIndex(index)
    const restart = () => { setState('intro'); setAttempt(null); setResult(null); setAnswers({}); setCurrentIndex(0) }

    return { state, attempt, answers, currentIndex, timeRemaining, result, submitting, autoSaveStatus, starting, startQuiz, selectChoice, goToQuestion, submitQuiz, restart }
}