// src/pages/student/my-courses/player/PlayerSidebar.tsx
import type { PlayerUnit, ContentItem } from '../../../../services/courseService'
import type { StudentQuizSummary } from '../../../../services/quizService'
import type { PeerAssignment } from '../../../../services/peerService'

const CONTENT_ICONS: Record<ContentItem['content_type'], string> = {
    video: '🎥', document: '📄', link: '🔗', text: '📝',
}

interface Props {
    units: PlayerUnit[]
    quizzes: StudentQuizSummary[]
    peerAssignments: PeerAssignment[]
    expandedUnitIds: Set<string>
    loadingUnitIds: Set<string>
    activeContentId?: string
    activeQuizId?: string
    activePeerId?: string
    onToggleUnit: (unitId: string) => void
    onSelectContent: (item: ContentItem) => void
    onSelectQuiz: (quiz: StudentQuizSummary) => void
    onSelectPeer: (assignment: PeerAssignment) => void
}

export function PlayerSidebar({
    units,
    quizzes,
    peerAssignments,
    expandedUnitIds,
    loadingUnitIds,
    activeContentId,
    activeQuizId,
    activePeerId,
    onToggleUnit,
    onSelectContent,
    onSelectQuiz,
    onSelectPeer,
}: Props) {
    const finalExams = quizzes.filter(q => q.quiz_type === 'exam')
    const getUnitQuizzes = (unitId: string) => quizzes.filter(q => q.quiz_type === 'quiz' && q.unit_id === unitId)
    const generalQuizzes = quizzes.filter(q => q.quiz_type === 'quiz' && !q.unit_id)

    const getAssignmentUnitId = (a: PeerAssignment) => (typeof a.unitId === 'object' ? a.unitId?._id : a.unitId)
    const getUnitPeerAssignments = (unitId: string) => peerAssignments.filter(a => getAssignmentUnitId(a) === unitId)
    const generalPeerAssignments = peerAssignments.filter(a => !getAssignmentUnitId(a))

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {units.map((unit, index) => {
                    const isExpanded = expandedUnitIds.has(unit._id)
                    const isLoading = loadingUnitIds.has(unit._id)
                    const unitQuizzes = getUnitQuizzes(unit._id)
                    const unitPeerAssignments = getUnitPeerAssignments(unit._id)
                    return (
                        <div key={unit._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <div
                                onClick={() => onToggleUnit(unit._id)}
                                style={{ padding: '13px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)' }}
                            >
                                <span style={{ fontSize: 13.5, fontWeight: 700 }}>الوحدة {index + 1}: {unit.title}</span>
                                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{isExpanded ? '▼' : '◀'}</span>
                            </div>

                            {isExpanded && (
                                <div style={{ padding: '4px 0' }}>
                                    {isLoading ? (
                                        <div style={{ padding: '10px 16px', fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>جارٍ التحميل...</div>
                                    ) : (
                                        <>
                                            {(!unit.content || unit.content.length === 0) && unitQuizzes.length === 0 && unitPeerAssignments.length === 0 && (
                                                <div style={{ padding: '10px 16px', fontSize: 12.5, color: 'rgba(255,255,255,0.35)' }}>لا يوجد محتوى بهذه الوحدة.</div>
                                            )}
                                            {unit.content?.map(item => {
                                                const isActive = activeContentId === item._id
                                                return (
                                                    <div
                                                        key={item._id}
                                                        onClick={() => onSelectContent(item)}
                                                        style={{
                                                            padding: '9px 16px 9px 28px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                                                            borderRight: isActive ? '3px solid #a855f7' : '3px solid transparent',
                                                            fontSize: 13, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                                                        }}
                                                    >
                                                        <span>{CONTENT_ICONS[item.content_type]} {item.title}</span>
                                                        {item.completed && <span style={{ color: '#34d399', fontSize: 12 }}>✓</span>}
                                                    </div>
                                                )
                                            })}
                                            {unitQuizzes.map(quiz => {
                                                const isActive = activeQuizId === quiz._id
                                                return (
                                                    <div
                                                        key={quiz._id}
                                                        onClick={() => onSelectQuiz(quiz)}
                                                        style={{
                                                            padding: '9px 16px 9px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                                            background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                                                            borderRight: isActive ? '3px solid #a855f7' : '3px solid transparent',
                                                            fontSize: 13, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                                                        }}
                                                    >
                                                        <span>🎯 {quiz.title}</span>
                                                        <span className="badge badge-neutral" style={{ fontSize: 9.5, padding: '0 6px' }}>اختبار</span>
                                                    </div>
                                                )
                                            })}
                                            {unitPeerAssignments.map(a => {
                                                const isActive = activePeerId === a._id
                                                return (
                                                    <div
                                                        key={a._id}
                                                        onClick={() => onSelectPeer(a)}
                                                        style={{
                                                            padding: '9px 16px 9px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                                            background: isActive ? 'rgba(16,185,129,0.15)' : 'transparent',
                                                            borderRight: isActive ? '3px solid #34d399' : '3px solid transparent',
                                                            fontSize: 13, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                                                        }}
                                                    >
                                                        <span>🤝 {a.title}</span>
                                                        {a.status === 'completed' && <span style={{ color: '#34d399', fontSize: 12, marginRight: 'auto' }}>✓</span>}
                                                    </div>
                                                )
                                            })}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {generalQuizzes.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '11px 16px', background: 'rgba(124,58,237,0.1)', fontSize: 12.5, fontWeight: 700, color: '#c4b5fd' }}>📝 اختبارات عامة</div>
                    {generalQuizzes.map(quiz => (
                        <div
                            key={quiz._id}
                            onClick={() => onSelectQuiz(quiz)}
                            style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13, background: activeQuizId === quiz._id ? 'rgba(124,58,237,0.15)' : 'transparent', color: activeQuizId === quiz._id ? '#fff' : 'rgba(255,255,255,0.7)' }}
                        >
                            🎯 {quiz.title}
                        </div>
                    ))}
                </div>
            )}

            {generalPeerAssignments.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '11px 16px', background: 'rgba(16,185,129,0.1)', fontSize: 12.5, fontWeight: 700, color: '#34d399' }}>🤝 مراجعة جماعية</div>
                    {generalPeerAssignments.map(a => (
                        <div
                            key={a._id}
                            onClick={() => onSelectPeer(a)}
                            style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', background: activePeerId === a._id ? 'rgba(16,185,129,0.15)' : 'transparent', color: activePeerId === a._id ? '#fff' : 'rgba(255,255,255,0.7)' }}
                        >
                            <span>🤝 {a.title}</span>
                            {a.status === 'completed' && <span style={{ color: '#34d399' }}>✓</span>}
                        </div>
                    ))}
                </div>
            )}

            {finalExams.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '11px 16px', background: 'rgba(239,68,68,0.1)', fontSize: 12.5, fontWeight: 700, color: '#f87171' }}>🏆 الامتحانات النهائية</div>
                    {finalExams.map(quiz => (
                        <div
                            key={quiz._id}
                            onClick={() => onSelectQuiz(quiz)}
                            style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13, background: activeQuizId === quiz._id ? 'rgba(239,68,68,0.15)' : 'transparent', color: activeQuizId === quiz._id ? '#fff' : 'rgba(255,255,255,0.7)' }}
                        >
                            🎓 {quiz.title}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}