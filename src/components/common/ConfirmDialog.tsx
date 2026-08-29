// src/components/common/ConfirmDialog.tsx
import { ModalPortal } from './ModalPortal'

interface Props {
    message: string
    title?: string
    danger?: boolean
    onConfirm: () => void
    onCancel: () => void
}

export function ConfirmDialog({ message, title, danger, onConfirm, onCancel }: Props) {
    return (
        <ModalPortal>
            <div
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
                onClick={onCancel}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18, padding: 26, maxWidth: 400, width: '100%', textAlign: 'center' }}
                >
                    <div style={{ fontSize: 30, marginBottom: 10 }}>{danger ? '⚠️' : '❓'}</div>
                    {title && <h4 style={{ fontSize: 16, fontWeight: 800, margin: '0 0 8px' }}>{title}</h4>}
                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '0 0 22px' }}>{message}</p>
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                        <button className="btn-outline" style={{ padding: '9px 22px', fontSize: 13.5 }} onClick={onCancel}>إلغاء</button>
                        <button
                            style={{
                                padding: '9px 24px', fontSize: 13.5, borderRadius: 9999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: '#fff', fontWeight: 600,
                                background: danger ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            }}
                            onClick={onConfirm}
                        >
                            تأكيد
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}