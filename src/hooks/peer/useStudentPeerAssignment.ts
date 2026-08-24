// src/hooks/peer/useStudentPeerAssignment.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import {
    peerService,
    type PeerAssignment, type PeerSubmission, type AssignedReview,
    type ReviewSubmissionContent, type StudentGradeData,
} from '../../services/peerService'
import { getErrorCode, getErrorMessage } from '../../utils/errorMessages'

export type PeerTabKey = 'submission' | 'reviews' | 'grade'

export function useStudentPeerAssignment(assignmentId: string, assignmentMeta: PeerAssignment, isSynchronous: boolean, onCompleted?: () => void) {
    const { showToast, success, error: toastError } = useToast()

    const [assignment, setAssignment] = useState<PeerAssignment>(assignmentMeta)
    const [loadingAssignment, setLoadingAssignment] = useState(true)
    const [activeTab, setActiveTab] = useState<PeerTabKey>('submission')

    const [mySubmission, setMySubmission] = useState<PeerSubmission | null>(null)
    const [submissionText, setSubmissionText] = useState('')
    const [submissionFile, setSubmissionFile] = useState<File | null>(null)
    const [submitting, setSubmitting] = useState(false)

    const [reviews, setReviews] = useState<AssignedReview[]>([])
    const [reviewsLoading, setReviewsLoading] = useState(false)

    const [activeReview, setActiveReview] = useState<{ reviewId: string; content: ReviewSubmissionContent } | null>(null)
    const [reviewScores, setReviewScores] = useState<Record<string, number>>({})
    const [reviewFeedback, setReviewFeedback] = useState('')
    const [submittingReview, setSubmittingReview] = useState(false)

    const [gradeData, setGradeData] = useState<StudentGradeData | null>(null)
    const [gradeLoading, setGradeLoading] = useState(false)

    const fetchMySubmission = useCallback(async () => {
        try {
            const submission = await peerService.getMySubmission(assignmentId)
            setMySubmission(submission)
            if (submission) setSubmissionText(submission.textContent || '')
        } catch (err) {
            toastError('فشل تحميل بيانات تسليمك.')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentId])

    const fetchGrade = useCallback(async () => {
        setGradeLoading(true)
        try {
            setGradeData(await peerService.getMyGrade(assignmentId))
        } catch {
            // لا توجد درجة بعد — حالة طبيعية
        } finally {
            setGradeLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentId])

    const loadFullAssignment = useCallback(async () => {
        setLoadingAssignment(true)
        try {
            const full = await peerService.getAssignment(assignmentId)
            if (full) setAssignment(full)
            await fetchMySubmission()
            if (full && full.status !== 'open') {
                await fetchGrade()
                if (full.status === 'completed') onCompleted?.()
            }
        } catch {
            toastError('فشل تحميل بيانات مهمة المراجعة الجماعية.')
        } finally {
            setLoadingAssignment(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentId, fetchMySubmission, fetchGrade])

    useEffect(() => {
        setActiveTab('submission')
        setMySubmission(null)
        setReviews([])
        setActiveReview(null)
        setGradeData(null)
        void loadFullAssignment()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [assignmentId])

    const fetchReviews = async () => {
        setReviewsLoading(true)
        try {
            setReviews(await peerService.listMyReviews(assignmentId))
        } catch {
            toastError('فشل تحميل مهام المراجعة الخاصة بك.')
        } finally {
            setReviewsLoading(false)
        }
    }

    const switchTab = (tab: PeerTabKey) => {
        setActiveTab(tab)
        if (tab === 'reviews') void fetchReviews()
        if (tab === 'grade') void fetchGrade()
    }

    // ---------- derived flags ----------
    const isAsync = isSynchronous === false
    const isDistributed = assignment.status === 'distributed'
    const isCompleted = assignment.status === 'completed'
    const isOpen = assignment.status === 'open'

    const hasReviewDeadline = Boolean(assignment.reviewDeadline)
    const isReviewDeadlinePassed = hasReviewDeadline && new Date(assignment.reviewDeadline!) < new Date()
    const canSubmitLate = isAsync && isDistributed && (!hasReviewDeadline || !isReviewDeadlinePassed)

    const hasGrade = gradeData?.finalScorePercentage != null
    const attemptNumber = mySubmission?.attemptNumber || 1
    const maxAttempts = assignment.maxAttempts || 3
    const attemptsRemaining = maxAttempts - attemptNumber
    const attemptsExhausted = hasGrade && attemptsRemaining <= 0
    const canSubmit = (isOpen || canSubmitLate) && !attemptsExhausted
    const pendingReviewsCount = reviews.filter(r => r.status === 'assigned').length

    // ---------- submission ----------
    const submitAssignment = async () => {
        if (attemptsExhausted) { toastError('لقد استنفدت جميع المحاولات المسموحة لهذه المهمة.'); return }
        const hasText = submissionText.trim().length > 0
        const hasFile = Boolean(assignment.allowFileSubmission && submissionFile)
        if (!hasText && !hasFile) { toastError('يجب كتابة نص أو إرفاق ملف (إذا كانت المهمة تسمح بذلك).'); return }

        setSubmitting(true)
        try {
            await peerService.submitAssignment(assignmentId, submissionText, assignment.allowFileSubmission ? submissionFile : null)
            success('تم إرسال حلّك بنجاح!')
            setSubmissionFile(null)
            await fetchMySubmission()
            await loadFullAssignment()
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setSubmitting(false)
        }
    }

    // ---------- reviews ----------
    const startReview = async (review: AssignedReview) => {
        if (review.status === 'completed') { showToast('هذه المراجعة مكتملة بالفعل ولا يمكن تعديلها.', 'info'); return }
        try {
            const content = await peerService.getReviewSubmission(review.reviewId)
            setActiveReview({ reviewId: review.reviewId, content: content || {} })
            const initial: Record<string, number> = {}
            assignment.rubric.forEach(r => { initial[r.criterion] = 0 })
            setReviewScores(initial)
            setReviewFeedback('')
        } catch (err) {
            toastError(getErrorMessage(err))
        }
    }

    const downloadReviewFile = async () => {
        if (!activeReview) return
        try {
            const blob = await peerService.downloadReviewSubmissionFile(activeReview.reviewId)
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `submission_${activeReview.content.displaySequentialId || 'file'}`
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(url)
        } catch {
            toastError('فشل تحميل الملف.')
        }
    }

    const setReviewScore = (criterion: string, value: number) => setReviewScores(prev => ({ ...prev, [criterion]: value }))

    const submitReviewForActive = async () => {
        if (!activeReview) return
        const scores = assignment.rubric.map(r => ({ criterion: r.criterion, score: Number(reviewScores[r.criterion]) || 0 }))
        setSubmittingReview(true)
        try {
            await peerService.submitReview(activeReview.reviewId, scores, reviewFeedback.trim() || undefined)
            success('تم إرسال تقييمك بنجاح! شكراً لمساهمتك.')
            setActiveReview(null)
            await fetchReviews()
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setSubmittingReview(false)
        }
    }

    return {
        assignment, loadingAssignment, activeTab, switchTab,
        mySubmission, submissionText, setSubmissionText, submissionFile, setSubmissionFile, submitting, submitAssignment,
        reviews, reviewsLoading, activeReview, setActiveReview, reviewScores, setReviewScore, reviewFeedback, setReviewFeedback,
        submittingReview, startReview, submitReviewForActive, downloadReviewFile,
        gradeData, gradeLoading,
        isAsync, isDistributed, isCompleted, isOpen, canSubmitLate, hasReviewDeadline, isReviewDeadlinePassed,
        hasGrade, attemptNumber, maxAttempts, attemptsRemaining, attemptsExhausted, canSubmit, pendingReviewsCount,
        errorCode: getErrorCode,
    }
}