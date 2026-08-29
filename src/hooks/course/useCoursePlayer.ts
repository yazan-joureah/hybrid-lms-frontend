// src/hooks/course/useCoursePlayer.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService, type CourseSummary, type PlayerUnit, type ContentItem } from '../../services/courseService'
import { quizService, type StudentQuizSummary } from '../../services/quizService'
import { peerService, type PeerAssignment } from '../../services/peerService'
import { liveService, type LiveSession } from '../../services/liveService'
import { getErrorMessage } from '../../utils/errorMessages'

export type PlayerSelection =
    | { kind: 'content'; item: ContentItem }
    | { kind: 'quiz'; quiz: StudentQuizSummary }
    | { kind: 'peer'; assignment: PeerAssignment }
    | { kind: 'session'; session: LiveSession }

export type PlayerBlockedReason = 'not_found' | 'under_review' | 'unavailable'

export type StoredSelection =
    | { kind: 'content'; id: string; unitId: string }
    | { kind: 'quiz'; id: string }
    | { kind: 'peer'; id: string }
    | { kind: 'session'; id: string }

// أدابتر تخزين قابل للاستبدال — الحاوي (مثلاً صفحة تستخدم useSearchParams)
// فيه يمرر أدابتر يخزّن الاختيار بالـ URL بدل sessionStorage، فيصير رابط
// قابل للمشاركة ويصمد أمام F5. إذا ما انمرر أدابتر، منرجع لنفس السلوك
// القديم (sessionStorage) للحفاظ على التوافق.
export interface PlayerSelectionStorage {
    get: () => StoredSelection | null
    set: (sel: StoredSelection) => void
}

export function useCoursePlayer(courseId: string, storage?: PlayerSelectionStorage) {
    const { success, error: toastError } = useToast()

    const SELECTION_STORAGE_KEY = `course_player_selection:${courseId}`

    const defaultStorage: PlayerSelectionStorage = {
        get: () => {
            try {
                const raw = sessionStorage.getItem(SELECTION_STORAGE_KEY)
                return raw ? JSON.parse(raw) : null
            } catch {
                return null
            }
        },
        set: (sel) => {
            try {
                sessionStorage.setItem(SELECTION_STORAGE_KEY, JSON.stringify(sel))
            } catch {
                // بيئات بدون sessionStorage (نادر) — نتجاهل بأمان
            }
        },
    }
    const selectionStorage = storage || defaultStorage

    const [course, setCourse] = useState<CourseSummary | null>(null)
    const [units, setUnits] = useState<PlayerUnit[]>([])
    const [quizzes, setQuizzes] = useState<StudentQuizSummary[]>([])
    const [peerAssignments, setPeerAssignments] = useState<PeerAssignment[]>([])
    const [liveSessions, setLiveSessions] = useState<LiveSession[]>([])
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

    // ---------- حفظ الاختيار عبر الأدابتر (URL من الحاوي، أو sessionStorage احتياطًا) ----------
    const persistSelection = (sel: StoredSelection) => {

        selectionStorage.set(sel)
    }

    // ---------- Selection: content (with unitId) ----------
    const selectContentItem = useCallback(async (item: ContentItem, unitId: string) => {
        revokeCurrentBlob()
        setContentBlobUrl(null)
        setSelection({ kind: 'content', item })
        persistSelection({ kind: 'content', id: item._id, unitId })

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
        persistSelection({ kind: 'quiz', id: quiz._id })
    }

    const selectPeerItem = (assignment: PeerAssignment) => {
        revokeCurrentBlob()
        setContentBlobUrl(null)
        setSelection({ kind: 'peer', assignment })
        persistSelection({ kind: 'peer', id: assignment._id })
    }

    const selectSessionItem = (session: LiveSession) => {
        revokeCurrentBlob()
        setContentBlobUrl(null)
        setSelection({ kind: 'session', session })
        persistSelection({ kind: 'session', id: session._id })
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
                void selectContentItem(content[0], unitId)
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

    // ---------- Restore selection from sessionStorage ----------
    const restoreSelection = useCallback(async (
        unitList: PlayerUnit[],
        availableQuizzes: StudentQuizSummary[],
        availablePeerAssignments: PeerAssignment[],
        availableLiveSessions: LiveSession[],
    ): Promise<boolean> => {
        const stored: StoredSelection | null = selectionStorage.get()
        if (!stored) return false

        if (stored.kind === 'quiz') {
            const quiz = availableQuizzes.find(q => q._id === stored.id)
            if (!quiz) return false
            hasAutoSelectedRef.current = true
            if (quiz.unit_id) void expandUnit(quiz.unit_id, unitList)
            selectQuizItem(quiz)
            return true
        }

        if (stored.kind === 'peer') {
            const assignment = availablePeerAssignments.find(a => a._id === stored.id)
            if (!assignment) return false
            hasAutoSelectedRef.current = true
            const unitId = typeof assignment.unitId === 'object' ? assignment.unitId?._id : assignment.unitId
            if (unitId) void expandUnit(unitId, unitList)
            selectPeerItem(assignment)
            return true
        }

        if (stored.kind === 'session') {
            const found = availableLiveSessions.find(s => s._id === stored.id)
            if (!found) return false
            hasAutoSelectedRef.current = true
            const unitId = typeof found.unit_id === 'object' ? found.unit_id?._id : found.unit_id
            if (unitId) void expandUnit(unitId, unitList)
            selectSessionItem(found)
            return true
        }
        // kind === 'content'
        const unitExists = unitList.some(u => u._id === stored.unitId)
        if (!unitExists) return false
        hasAutoSelectedRef.current = true
        setExpandedUnitIds(prev => new Set(prev).add(stored.unitId))
        setLoadingUnitIds(prev => new Set(prev).add(stored.unitId))
        try {
            const detail = await courseService.getUnitDetail(courseId, stored.unitId)
            const content = detail?.content || []
            setUnits(prev => prev.map(u => (u._id === stored.unitId ? { ...u, content } : u)))
            const item = content.find(c => c._id === stored.id)
            if (item) {
                void selectContentItem(item, stored.unitId)
                return true
            }
            return false
        } catch {
            return false // فشل الاسترجاع — سيعود للسلوك الافتراضي (أول وحدة)
        } finally {
            setLoadingUnitIds(prev => { const next = new Set(prev); next.delete(stored.unitId); return next })
        }
    }, [SELECTION_STORAGE_KEY, courseId, expandUnit, selectContentItem, selectQuizItem, selectPeerItem])

    // ---------- Initial load ----------
    const loadCourse = useCallback(async () => {
        setLoading(true)
        setBlockedReason(null)

        let courseData: CourseSummary | null = null
        try {
            courseData = await courseService.getById(courseId)
        } catch (err) {
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
            setBlockedReason('under_review')
            setLoading(false)
            return
        }

        try {
            const [unitList, availableQuizzes, allPeerAssignments, allLiveSessions, progress] = await Promise.all([
                courseService.getUnits(courseId),
                quizService.listAvailableForCourse(courseId),
                peerService.listAssignments(),
                liveService.getSessions({ courseId }),
                courseService.getProgressSummary(courseId),
            ])
            setUnits(unitList)
            setQuizzes(availableQuizzes)
            const filteredPeerAssignments = allPeerAssignments.filter(
                a => String(typeof a.courseId === 'object' ? a.courseId._id : a.courseId) === String(courseId)
            )
            setPeerAssignments(filteredPeerAssignments)
            const extractCourseId = (c: LiveSession['courseId']) => String(typeof c === 'object' ? c._id : c)
            const filteredLiveSessions = allLiveSessions.filter(s => extractCourseId(s.courseId) === String(courseId))
            setLiveSessions(filteredLiveSessions)
            setProgressPercentage(progress?.progress_percentage ?? 0)

            // محاولة استعادة الاختيار المحفوظ، وإلا التحديد التلقائي لأول محتوى
            const restored = await restoreSelection(unitList, availableQuizzes, filteredPeerAssignments, filteredLiveSessions)
            if (!restored && unitList.length > 0) {
                await expandUnit(unitList[0]._id, unitList)
            }
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [courseId, restoreSelection, expandUnit])

    const refreshLiveSessions = useCallback(async () => {
        try {
            const all = await liveService.getSessions({ courseId })
            const extractCourseId = (c: LiveSession['courseId']) => String(typeof c === 'object' ? c._id : c)
            setLiveSessions(all.filter(s => extractCourseId(s.courseId) === String(courseId)))
        } catch {
            // تجاهل — فشل تحديث بسيط لا يجب أن يكسر تجربة الطالب
        }
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
        liveSessions,
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
        selectSessionItem,
        marking,
        markActiveComplete,
        refreshAfterQuiz,
        refreshAfterPeerChange,
        refreshLiveSessions,
        retry: loadCourse,
    }
}