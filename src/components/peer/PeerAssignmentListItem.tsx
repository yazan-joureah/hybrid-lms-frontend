// src/components/peer/PeerAssignmentListItem.tsx
import type { PeerAssignment } from '../../services/peerService'

const STATUS_META: Record<string, { label: string; color: string }> = {
    open: { label: 'مفتوحة للتسليم', color: '#22d3ee' },
    distributed: { label: 'تحت المراجعة', color: '#fbbf24' },
    completed: { label: 'مكتملة', color: '#34d399' },
}

interface Props {
    assignment: PeerAssignment
    unitTitle?: string | null
    busy: boolean
    onViewSubmissions: () => void
    onEdit: () => void
    onDelete: () => void
    onDistribute: () => void
    onCalculateGrades: () => void
    onViewGrades: () => void
    onViewQuality: () => void
}

export function PeerAssignmentListItem({
    assignment: a, unitTitle, busy,
    onViewSubmissions, onEdit, onDelete, onDistribute, onCalculateGrades, onViewGrades, onViewQuality,
}: Props) {
    const meta = STATUS_META[a.status] || STATUS_META.open

    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', background: 'rgba(255,255,255,0.02)' }}>
            {a.pendingIssue && (
                <div style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', padding: '6px 10px', borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                    ⚠️ جارٍ تحديث حالة هذه المهمة تلقائياً، حدّث الصفحة بعد قليل. ({a.pendingIssue})
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{a.title}</span>
                        <span className="badge" style={{ background: `${meta.color}22`, color: meta.color, fontSize: 10.5 }}>{meta.label}</span>
                        <span className="badge badge-neutral" style={{ fontSize: 10.5 }}>{unitTitle ? `وحدة: ${unitTitle}` : 'على مستوى الكورس'}</span>
                        <span className="badge" style={{ background: a.allowFileSubmission ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)', color: a.allowFileSubmission ? '#34d399' : '#fbbf24', fontSize: 10.5 }}>
                            {a.allowFileSubmission ? '📎 يقبل ملفات' : '📝 نص فقط'}
                        </span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>
                        🧑‍🤝‍🧑 مراجعين لكل تسليم: {a.reviewersPerSubmission} | 📋 معايير: {a.rubric.length} | 🔁 محاولات: {a.maxAttempts}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                        📅 التسليم: {a.submissionDeadline ? new Date(a.submissionDeadline).toLocaleString('ar') : 'غير محدد'} | المراجعة: {a.reviewDeadline ? new Date(a.reviewDeadline).toLocaleString('ar') : 'غير محدد'}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12 }} onClick={onViewSubmissions}>📄 التسليمات</button>

                    {a.status === 'open' && (
                        <>
                            <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12 }} onClick={onEdit}>✎ تعديل</button>
                            <button onClick={onDelete} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 14px', color: '#f87171', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>🗑 حذف</button>
                            <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 12 }} disabled={busy} onClick={onDistribute}>{busy ? 'جارٍ التوزيع...' : '🎲 توزيع المراجعات الآن'}</button>
                        </>
                    )}

                    {a.status === 'distributed' && (
                        <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 12 }} disabled={busy} onClick={onCalculateGrades}>{busy ? 'جارٍ الاحتساب...' : '🧮 احتساب الدرجات'}</button>
                    )}

                    {(a.status === 'distributed' || a.status === 'completed') && (
                        <>
                            <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12 }} onClick={onViewGrades}>🎯 الدرجات</button>
                            <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12 }} onClick={onViewQuality}>📊 جودة المراجعات</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}