// src/components/peer/CalculateGradesModal.tsx
import { useState } from 'react'
import { ModalPortal } from '../common/ModalPortal'

interface Props {
    assignmentTitle: string
    onClose: () => void
    onConfirm: (lockAssignment: boolean) => Promise<boolean | void>
}

export function CalculateGradesModal({ assignmentTitle, onClose, onConfirm }: Props) {
    const [lockAssignment, setLockAssignment] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    const handleConfirm = async () => {
        setSubmitting(true)
        const ok = await onConfirm(lockAssignment)
        setSubmitting(false)
        if (ok !== false) onClose()
    }

    return (
        <ModalPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 24, maxWidth: 420, width: '100%' }}>
                    <h4 style={{ fontSize: 16, fontWeight: 800, marginTop: 0 }}>احتساب الدرجات النهائية</h4>
                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>هل ترغب بإغلاق المهمة "{assignmentTitle}" بعد الاحتساب؟</p>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '10px 0', fontSize: 13, cursor: 'pointer' }}>
                        <input type="radio" checked={lockAssignment} onChange={() => setLockAssignment(true)} style={{ marginTop: 3 }} />
                        <span>نعم، إغلاق المهمة (للكورسات المتزامنة أو الإغلاق النهائي)</span>
                    </label>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', margin: '10px 0', fontSize: 13, cursor: 'pointer' }}>
                        <input type="radio" checked={!lockAssignment} onChange={() => setLockAssignment(false)} style={{ marginTop: 3 }} />
                        <span>لا، إبقِ المهمة مفتوحة (للكورسات غير المتزامنة — للطلاب المتأخرين)</span>
                    </label>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
                        <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13 }} onClick={onClose}>إلغاء</button>
                        <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }} disabled={submitting} onClick={handleConfirm}>
                            {submitting ? 'جارٍ الاحتساب...' : 'تأكيد'}
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}