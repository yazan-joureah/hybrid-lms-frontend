// src/pages/payments/student/RefundRequestModal.tsx
import { useState } from 'react'
import { ModalPortal } from '../../../components/common/ModalPortal'
import { formatCurrency, type Payment } from '../../../services/payService'

interface Props {
    payment: Payment
    onClose: () => void
    onSubmit: (reason?: string) => void
    submitting: boolean
}

export function RefundRequestModal({ payment, onClose, onSubmit, submitting }: Props) {
    const [reason, setReason] = useState('')
    const courseTitle = typeof payment.course_id === 'object' ? payment.course_id.title : 'N/A'

    return (
        <ModalPortal>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 26, maxWidth: 440, width: '100%' }}>
                    <h3 style={{ marginTop: 0 }}>طلب استرداد</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13.5 }}>
                        كورس: <strong>{courseTitle}</strong> — المبلغ: {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    <div style={{ marginBottom: 16 }}>
                        <label className="form-label">سبب الاسترداد (اختياري)</label>
                        <textarea className="form-input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="اشرح باختصار سبب طلب الاسترداد..." disabled={submitting} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={onClose} disabled={submitting}>إلغاء</button>
                        <button className="btn-primary" onClick={() => onSubmit(reason.trim() || undefined)} disabled={submitting}>
                            {submitting ? '...جارٍ الإرسال' : 'إرسال الطلب'}
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}