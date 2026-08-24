// src/hooks/course/useCoursePlayer.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type CourseSummary, type PlayerUnit, type ContentItem } from '../../services/courseService'
import { quizService, type StudentQuizSummary } from '../../services/quizService'
import { peerService, type PeerAssignment } from '../../services/peerService'
import { getErrorMessage } from '../../utils/errorMessages'

export type PlayerSelection =
    | { kind: 'content'; item: ContentItem }
    | { kind: 'quiz'; quiz: StudentQuizSummary }
    | { kind: 'peer'; assignment: PeerAssignment }

export type PlayerBlockedReason = 'not_found' | 'under_review' | 'unavailable'

export function useCoursePlayer(courseId: string) {
    const { success, error: toastError } = useToast()

    const [course, setCourse] = useState<CourseSummary | null>(null)
    const [units, setUnits] = useState<PlayerUnit[]>([])
    const [quizzes, setQuizzes] = useState<StudentQuizSummary[]>([])
    const [peerAssignments, setPeerAssignments] = useState<PeerAssignment[]>([])
    const [progressPercentage, setProgressPercentage] = useState(0)
    const [loading, setLoading] = useState(true)
    const [blockedReason, setBlockedReason] = useState<PlayerBlockedReason | null>(null)

    const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(new Set())
    const [loadingUnitIds, setLoadingUnitIds] = useState<Set<string>>(new Set())

    const [selection, setSelection] = useState<PlayerSelection | null>(null)
    const [contentBlobUrl, setContentBlobUrl] = useState<string | null>(null)
    const [contentLoading, setContentLoading] = useState(false)
    const [marking, setMarking] = useState(false)

    const blobUrlRef = useRef<string | null>(null)
    const hasAutoSelectedRef = useRef(false)

    const revokeCurrentBlob = () => {
        if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    }

    // ---------- Selection: content ----------
    const selectContentItem = useCallback(async (item: ContentItem) => {
        revokeCurrentBlob()
        setContentBlobUrl(null)
        setSelection({ kind: 'content', item })

        if (item.content_type === 'video' || item.content_type === 'document') {
            setContentLoading(true)
            try {
                const blob = await courseService.getContentFileBlob(courseId, item._id)
                const url = URL.createObjectURL(blob)
                blobUrlRef.current = url
                setContentBlobUrl(url)
            } catch (err) {
                toastError(getErrorMessage(err))
            } finally {
                setContentLoading(false)
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId])

    const selectQuizItem = (quiz: StudentQuizSummary) => {
        revokeCurrentBlob()
        setContentBlobUrl(null)
        setSelection({ kind: 'quiz', quiz })
    }

    const selectPeerItem = (assignment: PeerAssignment) => {
        revokeCurrentBlob()
        setContentBlobUrl(null)
        setSelection({ kind: 'peer', assignment })
    }

    // ---------- Lazy unit content loading ----------
    const expandUnit = useCallback(async (unitId: string, currentUnits?: PlayerUnit[]) => {
        setExpandedUnitIds(prev => new Set(prev).add(unitId))

        const list = currentUnits || units
        const existing = list.find(u => u._id === unitId)
        if (existing?.content) return

        setLoadingUnitIds(prev => new Set(prev).add(unitId))
        try {
            const detail = await courseService.getUnitDetail(courseId, unitId)
            const content = detail?.content || []
            setUnits(prev => prev.map(u => (u._id === unitId ? { ...u, content } : u)))

            if (!hasAutoSelectedRef.current && content.length > 0) {
                hasAutoSelectedRef.current = true
                void selectContentItem(content[0])
            }
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoadingUnitIds(prev => { const next = new Set(prev); next.delete(unitId); return next })
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, units, selectContentItem])

    const toggleUnit = (unitId: string) => {
        if (expandedUnitIds.has(unitId)) {
            setExpandedUnitIds(prev => { const next = new Set(prev); next.delete(unitId); return next })
        } else {
            void expandUnit(unitId)
        }
    }

    // ---------- Initial load ----------
    const loadCourse = useCallback(async () => {
        setLoading(true)
        setBlockedReason(null)

        // الخطوة 1: نجيب بيانات الكورس الأساسية أول، ونتحقق من حالته قبل أي طلب إضافي
        let courseData: CourseSummary | null = null
        try {
            courseData = await courseService.getById(courseId)
        } catch (err) {
            // الباك اند بيرفض الوصول لكورس مش منشور (403/404) — نعرض شاشة واضحة بدل كسر الصفحة
            setBlockedReason('unavailable')
            setLoading(false)
            return
        }

        if (!courseData) {
            setBlockedReason('not_found')
            setLoading(false)
            return
        }

        setCourse(courseData)

        if (courseData.status && courseData.status !== 'published') {
            // الكورس موجود لكن قيد المراجعة/موقوف — لا نكمل جلب الوحدات/الاختبارات إطلاقاً
            setBlockedReason('under_review')
            setLoading(false)
            return
        }

        // الخطوة 2: الكورس منشور فعلياً — نكمل جلب باقي البيانات بأمان
        try {
            const [unitList, availableQuizzes, allPeerAssignments, progress] = await Promise.all([
                courseService.getUnits(courseId),
                quizService.listAvailableForCourse(courseId),
                peerService.listAssignments(),
                courseService.getProgressSummary(courseId),
            ])
            setUnits(unitList)
            setQuizzes(availableQuizzes)
            setPeerAssignments(
                allPeerAssignments.filter(a => String(typeof a.courseId === 'object' ? a.courseId._id : a.courseId) === String(courseId))
            )
            setProgressPercentage(progress?.progress_percentage ?? 0)

            if (unitList.length > 0) {
                await expandUnit(unitList[0]._id, unitList)
            }
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId])

    useEffect(() => {
        hasAutoSelectedRef.current = false
        void loadCourse()
        return () => revokeCurrentBlob()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId])

    // ---------- Mark content complete ----------
    const markActiveComplete = async () => {
        if (selection?.kind !== 'content') return
        const item = selection.item
        setMarking(true)
        try {
            await courseService.markContentComplete(courseId, item._id)
            success('تم تحديث تقدّمك!')
            const progress = await courseService.getProgressSummary(courseId)
            setProgressPercentage(progress?.progress_percentage ?? 0)
            setUnits(prev => prev.map(u => ({
                ...u,
                content: u.content?.map(c => (c._id === item._id ? { ...c, completed: true } : c)),
            })))
            setSelection({ kind: 'content', item: { ...item, completed: true } })
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setMarking(false)
        }
    }

    // ---------- بعد إرسال اختبار ----------
    const refreshAfterQuiz = useCallback(async () => {
        try {
            const progress = await courseService.getProgressSummary(courseId)
            setProgressPercentage(progress?.progress_percentage ?? 0)
        } catch {
            // تجاهل — فشل تحديث بسيط لا يجب أن يكسر عرض نتيجة الاختبار
        }
    }, [courseId])

    // ---------- بعد أي تغيير بمهمة مراجعة جماعية (تسليم/مراجعة/اكتمال) ----------
    const refreshAfterPeerChange = useCallback(async () => {
        try {
            const [all, progress] = await Promise.all([peerService.listAssignments(), courseService.getProgressSummary(courseId)])
            setPeerAssignments(all.filter(a => String(typeof a.courseId === 'object' ? a.courseId._id : a.courseId) === String(courseId)))
            setProgressPercentage(progress?.progress_percentage ?? 0)
        } catch {
            // تجاهل — فشل تحديث بسيط لا يجب أن يكسر تجربة الطالب
        }
    }, [courseId])

    return {
        course,
        units,
        quizzes,
        peerAssignments,
        loading,
        blockedReason,
        progressPercentage,
        expandedUnitIds,
        loadingUnitIds,
        toggleUnit,
        selection,
        contentBlobUrl,
        contentLoading,
        selectContentItem,
        selectQuizItem,
        selectPeerItem,
        marking,
        markActiveComplete,
        refreshAfterQuiz,
        refreshAfterPeerChange,
        retry: loadCourse,
    }
}