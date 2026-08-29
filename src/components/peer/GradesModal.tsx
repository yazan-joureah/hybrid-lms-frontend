// src/components/peer/GradesModal.tsx
import { useState } from 'react'
import { ModalPortal } from '../common/ModalPortal'
import { useAssignmentGrades } from '../../hooks/peer/useAssignmentGrades'
import { OverrideGradeModal } from './OverrideGradeModal'
import type { PeerAssignment, InstructorGradeRow } from '../../services/peerService'

interface Props { assignment: PeerAssignment; onClose: () => void }

export function GradesModal({ assignment, onClose }: Props) {
    const { grades, loading, overrideGrade } = useAssignmentGrades(assignment._id)
    const [overrideTarget, setOverrideTarget] = useState<InstructorGradeRow | null>(null)

    return (
        <ModalPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }} onClick={onClose}>
                <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, width: '100%', maxWidth: 760, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>درجات: {assignment.title}</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ padding: 24, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ color: 'rgba(255,255,255,0.4)' }}>جارٍ التحميل...</div>
                        ) : grades.length === 0 ? (
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13.5 }}>لا توجد بيانات درجات حتى الآن.</div>
                        ) : (
                            <table className="data-table" style={{ width: '100%' }}>
                                <thead><tr><th>الطالب</th><th>الدرجة النهائية</th><th>الحالة</th><th>إجراء</th></tr></thead>
                                <tbody>
                                    {grades.map(row => (
                                        <tr key={row._id}>
                                            <td>{row.studentId?.full_name || 'N/A'}</td>
                                            <td>
                                                {row.finalScorePercentage != null ? `${row.finalScorePercentage}%` : '—'}
                                                {row.gradeOverridden && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}> (يدوي)</span>}
                                            </td>
                                            <td>
                                                {row.gradingFlagged && (
                                                    <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 10.5 }}>
                                                        {row.gradingFlagReason === 'NO_REVIEWER_COMPLETED' ? '⚠️ لم يقم أي مراجع بالتقييم' : '⚠️ تباين كبير'}
                                                    </span>
                                                )}
                                                {row.overrideReason && (
                                                    <div style={{ fontSize: 11, color: '#22d3ee', marginTop: 4 }}>سبب التعديل: {row.overrideReason}</div>
                                                )}
                                            </td>
                                            <td>
                                                <button className="btn-outline" style={{ padding: '5px 12px', fontSize: 11.5 }} onClick={() => setOverrideTarget(row)}>تعديل يدوي</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {overrideTarget && (
                    <OverrideGradeModal
                        row={overrideTarget}
                        onClose={() => setOverrideTarget(null)}
                        onSubmit={(score, reason) => overrideGrade(overrideTarget._id, score, reason)}
                    />
                )}
            </div>
        </ModalPortal>
    )
}