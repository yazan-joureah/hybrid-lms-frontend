// src/pages/student/my-courses/CourseOverviewPanel.tsx
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Enrollment } from '../../../services/courseService'
import { useCoursePlayer, type PlayerBlockedReason, type StoredSelection } from '../../../hooks/course/useCoursePlayer'
import { PlayerSidebar } from './player/PlayerSidebar'
import { ContentViewer } from './player/ContentViewer'
import { QuizPlayer } from '../../../components/quiz/QuizPlayer'
import { LiveSessionPanel } from './player/LiveSessionPanel'
import { PeerAssignmentView } from '../../../components/peer/student/PeerAssignmentView'
import { SkeletonLoader } from '../../../components/common/Loading'

interface Props {
    enrollment: Enrollment
    onBack: () => void
}

const BLOCKED_META: Record<PlayerBlockedReason, { icon: string; title: string; message: string }> = {
    not_found: {
        icon: '🔍',
        title: 'الكورس غير متاح',
        message: 'لم نتمكن من العثور على هذا الكورس. ربما تم حذفه أو تغيير رابطه.',
    },
    under_review: {
        icon: '🛠️',
        title: 'الكورس قيد التحديث',
        message: 'المحاضر يعمل حالياً على تحديث هذا الكورس وهو بانتظار مراجعة الإدارة. سيعود الوصول تلقائياً بمجرد اعتماد التحديثات — تقدّمك السابق محفوظ.',
    },
    unavailable: {
        icon: '⚠️',
        title: 'تعذّر الوصول للكورس',
        message: 'حدث خطأ أثناء تحميل هذا الكورس. حاول مرة أخرى بعد قليل، أو تواصل مع الدعم إذا استمرت المشكلة.',
    },
}

export function CourseOverviewPanel({ enrollment, onBack }: Props) {
    const courseId = enrollment.course_id?._id
    const [searchParams, setSearchParams] = useSearchParams()

    const selectionStorage = useMemo(() => ({
        get: (): StoredSelection | null => {
            const kind = searchParams.get('kind')
            const itemId = searchParams.get('itemId')
            if (!kind || !itemId) return null
            if (kind === 'content') {
                const unitId = searchParams.get('unitId')
                if (!unitId) return null
                return { kind: 'content', id: itemId, unitId }
            }
            if (kind === 'quiz' || kind === 'peer' || kind === 'session') {
                return { kind, id: itemId } as StoredSelection
            }
            return null
        },
        set: (sel: StoredSelection) => {
            setSearchParams(prev => {
                const next = new URLSearchParams(prev)
                next.set('kind', sel.kind)
                next.set('itemId', sel.id)
                if (sel.kind === 'content') next.set('unitId', sel.unitId)
                else next.delete('unitId')
                return next
            }, { replace: true })
        },
    }), [searchParams, setSearchParams])

    const player = useCoursePlayer(courseId, selectionStorage)

    return (
        <div>
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 20 }}>
                ← العودة لكورساتي
            </button>

            {player.loading ? (
                <SkeletonLoader type="row" count={4} />
            ) : player.blockedReason ? (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 48, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
                    <div style={{ fontSize: 44, marginBottom: 14 }}>{BLOCKED_META[player.blockedReason].icon}</div>
                    <h3 style={{ fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{BLOCKED_META[player.blockedReason].title}</h3>
                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 24 }}>{BLOCKED_META[player.blockedReason].message}</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button className="btn-outline" style={{ padding: '9px 22px', fontSize: 13.5 }} onClick={player.retry}>إعادة المحاولة</button>
                        <button className="btn-primary" style={{ padding: '9px 22px', fontSize: 13.5 }} onClick={onBack}>العودة لكورساتي</button>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                        <h2 style={{ fontSize: 19, fontWeight: 800, margin: 0, wordBreak: 'break-word' }}>{player.course?.title}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>التقدم:</span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#a855f7' }}>{Math.round(player.progressPercentage * 100)}%</span>
                        </div>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: 24 }}>
                        <div className="progress-fill" style={{ width: `${player.progressPercentage * 100}%` }} />
                    </div>

                    <div className="player-grid">
                        <PlayerSidebar
                            units={player.units}
                            quizzes={player.quizzes}
                            peerAssignments={player.peerAssignments}
                            liveSessions={player.liveSessions}
                            expandedUnitIds={player.expandedUnitIds}
                            loadingUnitIds={player.loadingUnitIds}
                            activeContentId={player.selection?.kind === 'content' ? player.selection.item._id : undefined}
                            activeQuizId={player.selection?.kind === 'quiz' ? player.selection.quiz._id : undefined}
                            activePeerId={player.selection?.kind === 'peer' ? player.selection.assignment._id : undefined}
                            activeSessionId={player.selection?.kind === 'session' ? player.selection.session._id : undefined}
                            onToggleUnit={player.toggleUnit}
                            onSelectContent={player.selectContentItem}
                            onSelectQuiz={player.selectQuizItem}
                            onSelectPeer={player.selectPeerItem}
                            onSelectSession={player.selectSessionItem}
                        />

                        {!player.selection ? (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                اختر عنصراً من القائمة الجانبية للبدء
                            </div>
                        ) : player.selection.kind === 'content' ? (
                            <ContentViewer
                                item={player.selection.item}
                                fileUrl={player.contentFileUrl}
                                marking={player.marking}
                                onMarkComplete={player.markActiveComplete}
                            />
                        ) : player.selection.kind === 'quiz' ? (
                            <QuizPlayer key={player.selection.quiz._id} quiz={player.selection.quiz} onCompleted={player.refreshAfterQuiz} />
                        ) : player.selection.kind === 'session' ? (
                            <LiveSessionPanel key={player.selection.session._id} session={player.selection.session} onRefresh={player.refreshLiveSessions} />
                        ) : (
                            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 26 }}>
                                <PeerAssignmentView
                                    key={player.selection.assignment._id}
                                    assignmentId={player.selection.assignment._id}
                                    assignmentMeta={player.selection.assignment}
                                    isSynchronous={player.course?.is_synchronous ?? true}
                                    onCompleted={player.refreshAfterPeerChange}
                                />
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}