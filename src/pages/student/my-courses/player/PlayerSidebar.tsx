// src/pages/student/my-courses/player/PlayerSidebar.tsx
import { useState } from 'react'
import type { PlayerUnit, ContentItem } from '../../../../services/courseService'
import type { StudentQuizSummary } from '../../../../services/quizService'
import type { PeerAssignment } from '../../../../services/peerService'
import type { LiveSession } from '../../../../services/liveService'

const CONTENT_ICONS: Record<ContentItem['content_type'], string> = {
    video: '🎥', document: '📄', link: '🔗', text: '📝',
}

const SESSION_STATUS_META: Record<LiveSession['status'], { label: string; color: string }> = {
    scheduled: { label: 'مجدولة', color: '#f59e0b' },
    ongoing: { label: 'مباشر الآن', color: '#ef4444' },
    ended: { label: 'انتهت', color: '#94a3b8' },
    cancelled: { label: 'ملغاة', color: '#64748b' },
}

// قصّ آمن عند أقرب فراغ قبل الحد الأقصى — يتجنّب مشكلة قطع الكلمات في
// المنتصف التي تسبّبها -webkit-line-clamp مع نص عربي/لاتيني مختلط الاتجاه
function truncateDesc(text: string, maxLen = 130) {
    if (text.length <= maxLen) return text
    const cut = text.slice(0, maxLen)
    const lastSpace = cut.lastIndexOf(' ')
    return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + '…'
}

interface Props {
    units: PlayerUnit[]
    quizzes: StudentQuizSummary[]
    peerAssignments: PeerAssignment[]
    liveSessions: LiveSession[]
    expandedUnitIds: Set<string>
    loadingUnitIds: Set<string>
    activeContentId?: string
    activeQuizId?: string
    activePeerId?: string
    activeSessionId?: string
    onToggleUnit: (unitId: string) => void
    onSelectContent: (item: ContentItem, unitId: string) => void
    onSelectQuiz: (quiz: StudentQuizSummary) => void
    onSelectPeer: (assignment: PeerAssignment) => void
    onSelectSession: (session: LiveSession) => void
}

export function PlayerSidebar({
    units,
    quizzes,
    peerAssignments,
    liveSessions,
    expandedUnitIds,
    loadingUnitIds,
    activeContentId,
    activeQuizId,
    activePeerId,
    activeSessionId,
    onToggleUnit,
    onSelectContent,
    onSelectQuiz,
    onSelectPeer,
    onSelectSession,
}: Props) {
    const [expandedDescIds, setExpandedDescIds] = useState<Set<string>>(new Set())
    const toggleDesc = (unitId: string) => {
        setExpandedDescIds(prev => {
            const next = new Set(prev)
            if (next.has(unitId)) next.delete(unitId)
            else next.add(unitId)
            return next
        })
    }

    const finalExams = quizzes.filter(q => q.quiz_type === 'exam')
    const getUnitQuizzes = (unitId: string) => quizzes.filter(q => q.quiz_type === 'quiz' && q.unit_id === unitId)
    const generalQuizzes = quizzes.filter(q => q.quiz_type === 'quiz' && !q.unit_id)

    const getAssignmentUnitId = (a: PeerAssignment) => (typeof a.unitId === 'object' ? a.unitId?._id : a.unitId)
    const getUnitPeerAssignments = (unitId: string) => peerAssignments.filter(a => getAssignmentUnitId(a) === unitId)
    const generalPeerAssignments = peerAssignments.filter(a => !getAssignmentUnitId(a))
    const getSessionUnitId = (s: LiveSession) => (typeof s.unit_id === 'object' ? s.unit_id?._id : s.unit_id)
    const getUnitLiveSessions = (unitId: string) => liveSessions.filter(s => getSessionUnitId(s) === unitId)
    const generalLiveSessions = liveSessions.filter(s => !getSessionUnitId(s))

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                {units.map((unit, index) => {
                    const isExpanded = expandedUnitIds.has(unit._id)
                    const isLoading = loadingUnitIds.has(unit._id)
                    const unitQuizzes = getUnitQuizzes(unit._id)
                    const unitPeerAssignments = getUnitPeerAssignments(unit._id)
                    const unitLiveSessions = getUnitLiveSessions(unit._id)
                    const descTooLong = Boolean(unit.desc && unit.desc.length > 130)
                    const isDescExpanded = expandedDescIds.has(unit._id)

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
                                    {unit.desc && (
                                        <div style={{
                                            padding: '9px 16px',
                                            fontSize: 12,
                                            lineHeight: 1.7,
                                            color: 'rgba(255,255,255,0.5)',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                        }}>
                                            {isDescExpanded || !descTooLong ? unit.desc : truncateDesc(unit.desc)}
                                            {descTooLong && (
                                                <button
                                                    onClick={() => toggleDesc(unit._id)}
                                                    style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: 11.5, fontFamily: 'inherit', padding: 0, marginRight: 6 }}
                                                >
                                                    {isDescExpanded ? 'إخفاء' : 'عرض المزيد'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {isLoading ? (
                                        <div style={{ padding: '10px 16px', fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>جارٍ التحميل...</div>
                                    ) : (
                                        <>
                                            {(!unit.content || unit.content.length === 0) && unitQuizzes.length === 0 && unitPeerAssignments.length === 0 && unitLiveSessions.length === 0 && (
                                                <div style={{ padding: '10px 16px', fontSize: 12.5, color: 'rgba(255,255,255,0.35)' }}>لا يوجد محتوى بهذه الوحدة.</div>
                                            )}
                                            {unit.content?.map(item => {
                                                const isActive = activeContentId === item._id
                                                return (
                                                    <div
                                                        key={item._id}
                                                        onClick={() => onSelectContent(item, unit._id)}
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
                                                        {quiz.last_result && (
                                                            <span style={{ marginRight: 'auto', fontSize: 11.5, fontWeight: 700, color: quiz.last_result.passed ? '#34d399' : '#f87171' }}>
                                                                {quiz.last_result.passed ? '✓ ناجح' : '✗ راسب'}
                                                            </span>
                                                        )}
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
                                            {unitLiveSessions.map(s => {
                                                const isActive = activeSessionId === s._id
                                                const meta = SESSION_STATUS_META[s.status]
                                                return (
                                                    <div
                                                        key={s._id}
                                                        onClick={() => onSelectSession(s)}
                                                        style={{
                                                            padding: '9px 16px 9px 28px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6,
                                                            background: isActive ? 'rgba(239,68,68,0.15)' : 'transparent',
                                                            borderRight: isActive ? '3px solid #ef4444' : '3px solid transparent',
                                                            fontSize: 13, color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                                                        }}
                                                    >
                                                        <span>📡 {s.title}</span>
                                                        <span style={{ fontSize: 10, color: meta.color }}>{meta.label}</span>
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
                            style={{
                                padding: '10px 16px', cursor: 'pointer', fontSize: 13,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: activeQuizId === quiz._id ? 'rgba(124,58,237,0.15)' : 'transparent',
                                color: activeQuizId === quiz._id ? '#fff' : 'rgba(255,255,255,0.7)'
                            }}
                        >
                            <span>🎯 {quiz.title}</span>
                            {quiz.last_result && (
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: quiz.last_result.passed ? '#34d399' : '#f87171' }}>
                                    {quiz.last_result.passed ? '✓ ناجح' : '✗ راسب'}
                                </span>
                            )}
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
            {generalLiveSessions.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '11px 16px', background: 'rgba(239,68,68,0.08)', fontSize: 12.5, fontWeight: 700, color: '#f87171' }}>📡 حصص مباشرة عامة</div>
                    {generalLiveSessions.map(s => {
                        const meta = SESSION_STATUS_META[s.status]
                        return (
                            <div key={s._id} onClick={() => onSelectSession(s)}
                                style={{ padding: '10px 16px', cursor: 'pointer', fontSize: 13, display: 'flex', justifyContent: 'space-between', background: activeSessionId === s._id ? 'rgba(239,68,68,0.15)' : 'transparent', color: activeSessionId === s._id ? '#fff' : 'rgba(255,255,255,0.7)' }}
                            >
                                <span>📡 {s.title}</span>
                                <span style={{ fontSize: 10, color: meta.color }}>{meta.label}</span>
                            </div>
                        )
                    })}
                </div>
            )
            }
            {finalExams.length > 0 && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 16, overflow: 'hidden' }}>
                    <div style={{ padding: '11px 16px', background: 'rgba(239,68,68,0.1)', fontSize: 12.5, fontWeight: 700, color: '#f87171' }}>🏆 الامتحانات النهائية</div>
                    {finalExams.map(quiz => (
                        <div
                            key={quiz._id}
                            onClick={() => onSelectQuiz(quiz)}
                            style={{
                                padding: '10px 16px', cursor: 'pointer', fontSize: 13,
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: activeQuizId === quiz._id ? 'rgba(239,68,68,0.15)' : 'transparent',
                                color: activeQuizId === quiz._id ? '#fff' : 'rgba(255,255,255,0.7)'
                            }}
                        >
                            <span>🎓 {quiz.title}</span>
                            {quiz.last_result && (
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: quiz.last_result.passed ? '#34d399' : '#f87171' }}>
                                    {quiz.last_result.passed ? '✓ ناجح' : '✗ راسب'}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}