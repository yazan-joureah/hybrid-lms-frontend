// src/components/peer/OverrideGradeModal.tsx
import { useState } from 'react'
import { ModalPortal } from '../common/ModalPortal'
import type { InstructorGradeRow } from '../../services/peerService'

interface Props {
    row: InstructorGradeRow
    onClose: () => void
    onSubmit: (score: number, reason: string) => Promise<boolean | void>
}

export function OverrideGradeModal({ row, onClose, onSubmit }: Props) {
    const [score, setScore] = useState(row.finalScorePercentage != null ? String(row.finalScorePercentage) : '')
    const [reason, setReason] = useState(row.overrideReason || '')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async () => {
        const parsed = parseFloat(score)
        if (isNaN(parsed) || parsed < 0 || parsed > 100) { setError('الرجاء إدخال درجة صحيحة بين 0 و100.'); return }
        setError('')
        setSubmitting(true)
        const ok = await onSubmit(parsed, reason.trim())
        setSubmitting(false)
        if (ok !== false) onClose()
    }

    return (
        <ModalPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 310, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 24, maxWidth: 420, width: '100%' }}>
                    <h4 style={{ fontSize: 16, fontWeight: 800, marginTop: 0, marginBottom: 6 }}>تعديل درجة الطالب يدوياً</h4>
                    <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>الطالب: {row.studentId?.full_name || 'N/A'}</p>
                    <div style={{ marginBottom: 14 }}>
                        <label className="form-label">الدرجة الجديدة (%) *</label>
                        <input className="form-input" type="number" min={0} max={100} step={0.5} value={score} onChange={e => setScore(e.target.value)} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label className="form-label">سبب التعديل (اختياري)</label>
                        <textarea className="form-input" rows={2} value={reason} onChange={e => setReason(e.target.value)} style={{ resize: 'none' }} />
                    </div>
                    {error && <div style={{ color: '#f87171', fontSize: 12.5, marginBottom: 12 }}>{error}</div>}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13 }} onClick={onClose}>إلغاء</button>
                        <button className="btn-primary" style={{ padding: '8px 20px', fontSize: 13 }} disabled={submitting} onClick={handleSubmit}>
                            {submitting ? 'جارٍ الحفظ...' : 'تأكيد التعديل'}
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}