// src/pages/instructor/course-builder/PeerTab.tsx
import { useState } from 'react'
import type { CourseUnit } from '../../../services/courseService'
import type { useInstructorPeerAssignments } from '../../../hooks/peer/useInstructorPeerAssignments'
import type { PeerAssignment, PeerAssignmentFormPayload } from '../../../services/peerService'
import { PeerAssignmentListItem } from '../../../components/peer/PeerAssignmentListItem'
import { PeerAssignmentFormModal } from '../../../components/peer/PeerAssignmentFormModal'
import { SubmissionsModal } from '../../../components/peer/SubmissionsModal'
import { GradesModal } from '../../../components/peer/GradesModal'
import { CalculateGradesModal } from '../../../components/peer/CalculateGradesModal'
import { ReviewQualityModal } from '../../../components/peer/ReviewQualityModal'
import { EmptyState } from '../../../components/common/EmptyState'
import { SkeletonLoader } from '../../../components/common/Loading'

type PeerTabProps = ReturnType<typeof useInstructorPeerAssignments> & { units: CourseUnit[] }

export function PeerTab({ assignments, loading, units, createAssignment, updateAssignment, deleteAssignment, distributeReviews, calculateGrades }: PeerTabProps) {
    const [modalOpen, setModalOpen] = useState(false)
    const [editingAssignment, setEditingAssignment] = useState<PeerAssignment | null>(null)
    const [busyId, setBusyId] = useState<string | null>(null)

    const [submissionsTarget, setSubmissionsTarget] = useState<PeerAssignment | null>(null)
    const [gradesTarget, setGradesTarget] = useState<PeerAssignment | null>(null)
    const [calcTarget, setCalcTarget] = useState<PeerAssignment | null>(null)
    const [qualityTarget, setQualityTarget] = useState<PeerAssignment | null>(null)

    const getUnitTitle = (unitId: PeerAssignment['unitId']) => {
        const id = typeof unitId === 'object' ? unitId?._id : unitId
        return id ? units.find(u => u._id === id)?.title : null
    }

    const openCreate = () => { setEditingAssignment(null); setModalOpen(true) }
    const openEdit = (a: PeerAssignment) => { setEditingAssignment(a); setModalOpen(true) }
    const handleFormSubmit = (form: PeerAssignmentFormPayload) => (editingAssignment ? updateAssignment(editingAssignment._id, form) : createAssignment(form))

    const handleDistribute = async (a: PeerAssignment) => {
        setBusyId(a._id)
        await distributeReviews(a)
        setBusyId(null)
    }

    if (loading) return <SkeletonLoader type="row" count={2} />

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                    إنشاء مهام يقيّم فيها الطلاب أعمال بعضهم البعض حسب معايير محددة.
                </p>
                <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5 }} onClick={openCreate}>+ إنشاء مهمة جديدة</button>
            </div>

            {assignments.length === 0 ? (
                <EmptyState icon="🤝" title="لا توجد مهام مراجعة جماعية بعد" description="أنشئ أول مهمة ليتبادل الطلاب فيها المراجعات." action={{ label: '+ إنشاء مهمة', onClick: openCreate }} />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {assignments.map(a => (
                        <PeerAssignmentListItem
                            key={a._id}
                            assignment={a}
                            unitTitle={getUnitTitle(a.unitId)}
                            busy={busyId === a._id}
                            onViewSubmissions={() => setSubmissionsTarget(a)}
                            onEdit={() => openEdit(a)}
                            onDelete={() => deleteAssignment(a)}
                            onDistribute={() => handleDistribute(a)}
                            onCalculateGrades={() => setCalcTarget(a)}
                            onViewGrades={() => setGradesTarget(a)}
                            onViewQuality={() => setQualityTarget(a)}
                        />
                    ))}
                </div>
            )}

            {modalOpen && (
                <PeerAssignmentFormModal editingAssignment={editingAssignment} units={units} onSubmit={handleFormSubmit} onClose={() => setModalOpen(false)} />
            )}
            {submissionsTarget && <SubmissionsModal assignment={submissionsTarget} onClose={() => setSubmissionsTarget(null)} />}
            {gradesTarget && <GradesModal assignment={gradesTarget} onClose={() => setGradesTarget(null)} />}
            {calcTarget && (
                <CalculateGradesModal
                    assignmentTitle={calcTarget.title}
                    onClose={() => setCalcTarget(null)}
                    onConfirm={lock => calculateGrades(calcTarget._id, lock)}
                />
            )}
            {qualityTarget && <ReviewQualityModal assignment={qualityTarget} onClose={() => setQualityTarget(null)} />}
        </div>
    )
}