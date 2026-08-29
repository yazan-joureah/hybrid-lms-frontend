// src/components/peer/SubmissionsModal.tsx
import { ModalPortal } from '../common/ModalPortal'
import { useAssignmentSubmissions } from '../../hooks/peer/useAssignmentSubmissions'
import type { PeerAssignment } from '../../services/peerService'

interface Props { assignment: PeerAssignment; onClose: () => void }

export function SubmissionsModal({ assignment, onClose }: Props) {
    const { submissions, loading } = useAssignmentSubmissions(assignment._id)

    return (
        <ModalPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }} onClick={onClose}>
                <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, width: '100%', maxWidth: 640, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>تسليمات: {assignment.title}</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ padding: 24, overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ color: 'rgba(255,255,255,0.4)' }}>جارٍ التحميل...</div>
                        ) : submissions.length === 0 ? (
                            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13.5 }}>لا يوجد تسليمات حتى الآن.</div>
                        ) : (
                            <>
                                <table className="data-table" style={{ width: '100%' }}>
                                    <thead><tr><th>الطالب</th><th>تاريخ التسليم</th><th>ملف مرفق؟</th></tr></thead>
                                    <tbody>
                                        {submissions.map(s => (
                                            <tr key={s._id}>
                                                <td>{s.studentId?.full_name || 'N/A'} ({s.studentId?.email})</td>
                                                <td>{new Date(s.submittedAt).toLocaleString('ar')}</td>
                                                <td>{s.fileId ? '✅' : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p style={{ marginTop: 14, fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>إجمالي التسليمات: {submissions.length}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}