// src/pages/admin/kyc/KycReviewPanel.tsx
import { useState } from 'react'
import { useKycReviewDetail } from '../../../hooks/admin/useKycReviewDetail'

const REJECTION_REASONS = [
    { value: 'UNCLEAR_IMAGE', label: 'صورة غير واضحة' },
    { value: 'DOCUMENT_EXPIRED', label: 'الوثيقة منتهية الصلاحية' },
    { value: 'DATA_MISMATCH', label: 'عدم تطابق البيانات' },
    { value: 'DOCUMENT_NOT_ACCEPTED', label: 'نوع الوثيقة غير مقبول' },
] as const

interface Props {
    requestId: string
    onClose: () => void
    onDecided: () => void
}

export function KycReviewPanel({ requestId, onClose, onDecided }: Props) {
    const { applicant, idImageUrl, selfieImageUrl, loading, imagesLoading, actionLoading, approve, reject } =
        useKycReviewDetail(requestId, () => { onDecided(); onClose() })

    const [documentBirthDate, setDocumentBirthDate] = useState('')
    const [optionalNote, setOptionalNote] = useState('')
    const [rejectionReason, setRejectionReason] = useState<string>('UNCLEAR_IMAGE')

    return (
        <div style={{ background: 'var(--bg-card)', border: '2px solid #7c3aed', borderRadius: 18, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3>مراجعة: {applicant?.full_name || '...'}</h3>
                <button className="btn-secondary" onClick={onClose}>إغلاق</button>
            </div>

            {loading && <div style={{ color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>}

            {applicant && (
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
                    {applicant.email} · تاريخ الميلاد بالحساب: {new Date(applicant.birth_date).toLocaleDateString('ar')}
                </p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 600, marginBottom: 8 }}>صورة الوثيقة</p>
                    {imagesLoading ? (
                        <div style={{ height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
                    ) : idImageUrl ? (
                        <a href={idImageUrl} target="_blank" rel="noreferrer">
                            <img src={idImageUrl} alt="ID Document" style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8 }} />
                        </a>
                    ) : <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>تعذّر التحميل</p>}
                </div>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: 600, marginBottom: 8 }}>صورة السيلفي</p>
                    {imagesLoading ? (
                        <div style={{ height: 200, background: 'rgba(255,255,255,0.05)', borderRadius: 8 }} />
                    ) : selfieImageUrl ? (
                        <a href={selfieImageUrl} target="_blank" rel="noreferrer">
                            <img src={selfieImageUrl} alt="Selfie" style={{ maxWidth: '100%', maxHeight: 220, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 8 }} />
                        </a>
                    ) : <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>تعذّر التحميل</p>}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 18 }}>
                    <h4 style={{ marginBottom: 14 }}>قبول الطلب</h4>
                    <div className="field-group" style={{ marginBottom: 12 }}>
                        <label className="form-label">تاريخ الميلاد بالوثيقة</label>
                        <input className="form-input" type="date" value={documentBirthDate} onChange={e => setDocumentBirthDate(e.target.value)} disabled={actionLoading} />
                    </div>
                    <div className="field-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">ملاحظة (اختياري)</label>
                        <input className="form-input" value={optionalNote} onChange={e => setOptionalNote(e.target.value)} disabled={actionLoading} />
                    </div>
                    <button className="btn-primary" style={{ background: '#16a34a', width: '100%' }} disabled={actionLoading} onClick={() => approve(documentBirthDate, optionalNote)}>
                        {actionLoading ? '...' : 'قبول الطلب'}
                    </button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 18 }}>
                    <h4 style={{ marginBottom: 14 }}>رفض الطلب</h4>
                    <div className="field-group" style={{ marginBottom: 20 }}>
                        <label className="form-label">سبب الرفض</label>
                        <select className="form-input" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} disabled={actionLoading}>
                            {REJECTION_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                    <button className="btn-primary" style={{ background: '#dc2626', width: '100%' }} disabled={actionLoading} onClick={() => reject(rejectionReason)}>
                        {actionLoading ? '...' : 'رفض الطلب'}
                    </button>
                </div>
            </div>
        </div>
    )
}