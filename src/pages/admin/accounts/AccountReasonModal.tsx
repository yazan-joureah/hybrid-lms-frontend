// src/pages/admin/accounts/AccountReasonModal.tsx
import { useState } from 'react'
import { ModalPortal } from '../../../components/common/ModalPortal'

interface Props {
    title: string
    description: string
    confirmLabel: string
    danger?: boolean
    submitting: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
}

export function AccountReasonModal({ title, description, confirmLabel, danger, submitting, onClose, onConfirm }: Props) {
    const [reason, setReason] = useState('')
    const [touched, setTouched] = useState(false)
    const isValid = reason.trim().length > 0

    return (
        <ModalPortal>
            <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 26, maxWidth: 440, width: '100%' }}>
                    <h3 style={{ marginTop: 0 }}>{title}</h3>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13.5 }}>{description}</p>
                    <div style={{ marginBottom: 16 }}>
                        <label className="form-label">السبب (إلزامي)</label>
                        <textarea
                            className="form-input"
                            rows={3}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            onBlur={() => setTouched(true)}
                            disabled={submitting}
                            placeholder="اكتب سبب هذا الإجراء..."
                        />
                        {touched && !isValid && <div style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>السبب إلزامي.</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button className="btn-secondary" onClick={onClose} disabled={submitting}>إلغاء</button>
                        <button
                            className="btn-primary"
                            style={danger ? { background: '#dc2626' } : undefined}
                            disabled={submitting || !isValid}
                            onClick={() => onConfirm(reason.trim())}
                        >
                            {submitting ? '...جارٍ التنفيذ' : confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}