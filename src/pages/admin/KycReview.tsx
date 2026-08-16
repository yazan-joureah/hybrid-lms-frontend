import { useState, useEffect, useCallback } from 'react'
import API from '../../config/api'

type KycListItem = {
    _id: string
    user_id: { _id: string; full_name: string; email: string; role: string } | null
    status: string
    submitted_at: string
    applicant_role: string
}

type KycDetail = {
    id: string
    applicant: { id: string; full_name: string; email: string; role: string; birth_date: string }
    applicant_role: string
    submitted_at: string
}

const REJECTION_REASONS = [
    { value: 'UNCLEAR_IMAGE', label: 'صورة غير واضحة' },
    { value: 'DOCUMENT_EXPIRED', label: 'الوثيقة منتهية الصلاحية' },
    { value: 'DATA_MISMATCH', label: 'عدم تطابق البيانات' },
    { value: 'DOCUMENT_NOT_ACCEPTED', label: 'نوع الوثيقة غير مقبول' },
] as const

function extractError(err: any): string {
    return err?.response?.data?.error?.message || err?.message || 'حدث خطأ غير متوقع.'
}

export default function KycReview() {
    const [requests, setRequests] = useState<KycListItem[]>([])
    const [listLoading, setListLoading] = useState(true)
    const [listError, setListError] = useState('')

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [detail, setDetail] = useState<KycDetail | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState('')

    const [idImageUrl, setIdImageUrl] = useState<string | null>(null)
    const [selfieImageUrl, setSelfieImageUrl] = useState<string | null>(null)
    const [imagesLoading, setImagesLoading] = useState(false)

    // فورم القبول
    const [documentBirthDate, setDocumentBirthDate] = useState('')
    const [optionalNote, setOptionalNote] = useState('')
    const [approveLoading, setApproveLoading] = useState(false)
    const [approveError, setApproveError] = useState('')
    const [approveOutcome, setApproveOutcome] = useState<string | null>(null)

    // فورم الرفض
    const [showRejectForm, setShowRejectForm] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')
    const [rejectLoading, setRejectLoading] = useState(false)
    const [rejectError, setRejectError] = useState('')

    const fetchList = useCallback(async () => {
        setListLoading(true)
        setListError('')
        try {
            const res = await API.get('/admin/kyc/requests')
            setRequests(res.data?.data?.requests || [])
        } catch (err) {
            setListError(extractError(err))
        } finally {
            setListLoading(false)
        }
    }, [])

    useEffect(() => { fetchList() }, [fetchList])

    // تنظيف روابط blob السابقة لمنع تسريب ذاكرة عند تغيير الطلب المحدد
    useEffect(() => {
        return () => {
            if (idImageUrl) URL.revokeObjectURL(idImageUrl)
            if (selfieImageUrl) URL.revokeObjectURL(selfieImageUrl)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId])

    const openDetail = async (id: string) => {
        setSelectedId(id)
        setDetail(null)
        setDetailError('')
        setIdImageUrl(null)
        setSelfieImageUrl(null)
        setApproveOutcome(null)
        setApproveError('')
        setRejectError('')
        setShowRejectForm(false)
        setRejectionReason('')
        setDocumentBirthDate('')
        setOptionalNote('')

        setDetailLoading(true)
        try {
            const res = await API.get(`/admin/kyc/requests/${id}`)
            setDetail(res.data?.data)
        } catch (err) {
            setDetailError(extractError(err))
            setDetailLoading(false)
            return
        }
        setDetailLoading(false)

        // تحميل الصورتين كـ blob (لازم Authorization header — ما بتشتغل بـ <img src> عادية)
        setImagesLoading(true)
        try {
            const [idRes, selfieRes] = await Promise.all([
                API.get(`/admin/kyc/requests/${id}/documents/id_document`, { responseType: 'blob' }),
                API.get(`/admin/kyc/requests/${id}/documents/selfie`, { responseType: 'blob' }),
            ])
            setIdImageUrl(URL.createObjectURL(idRes.data))
            setSelfieImageUrl(URL.createObjectURL(selfieRes.data))
        } catch (err) {
            setDetailError('تعذّر تحميل صور المستندات: ' + extractError(err))
        } finally {
            setImagesLoading(false)
        }
    }

    const closeDetail = () => {
        setSelectedId(null)
        setDetail(null)
    }

    const handleApprove = async () => {
        if (!selectedId) return
        if (!documentBirthDate) {
            setApproveError('أدخل تاريخ الميلاد كما هو مكتوب بالوثيقة')
            return
        }
        setApproveError('')
        setApproveLoading(true)
        try {
            const res = await API.post(`/admin/kyc/requests/${selectedId}/approve`, {
                documentBirthDate,
                optionalNote: optionalNote.trim() || undefined,
            })
            setApproveOutcome(res.data?.data?.outcome || 'verified')
            await fetchList() // إزالة الطلب من القائمة (ما عاد review_pending)
        } catch (err) {
            setApproveError(extractError(err))
        } finally {
            setApproveLoading(false)
        }
    }

    const handleReject = async () => {
        if (!selectedId) return
        if (!rejectionReason) {
            setRejectError('اختر سبب الرفض')
            return
        }
        setRejectError('')
        setRejectLoading(true)
        try {
            await API.post(`/admin/kyc/requests/${selectedId}/reject`, { rejectionReason })
            await fetchList()
            closeDetail()
        } catch (err) {
            setRejectError(extractError(err))
        } finally {
            setRejectLoading(false)
        }
    }

    return (
        <div className="page-wrapper">
            <div style={{ marginBottom: 24 }}>
                <h2 className="section-title">مراجعة طلبات التوثيق (KYC)</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>
                    طلبات قيد المراجعة: {requests.length}
                </p>
            </div>

            {listLoading && <div style={{ color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>}
            {listError && <div style={{ color: '#f87171', marginBottom: 16 }}>⚠️ {listError}</div>}

            {!listLoading && requests.length === 0 && !listError && (
                <div style={{ color: 'rgba(255,255,255,0.5)', padding: '2rem', textAlign: 'center' }}>
                    لا توجد طلبات بانتظار المراجعة حاليًا
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {requests.map((r) => (
                    <div
                        key={r._id}
                        onClick={() => openDetail(r._id)}
                        style={{
                            background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14,
                            padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', transition: 'border-color 0.15s',
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 14.5 }}>{r.user_id?.full_name || 'مستخدم محذوف'}</div>
                            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
                                {r.user_id?.email || '—'} · {r.applicant_role === 'Instructor' ? 'مدرّس' : 'طالب'}
                            </div>
                        </div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                            {new Date(r.submitted_at).toLocaleDateString('ar')}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal تفاصيل الطلب */}
            {selectedId && (
                <div
                    onClick={closeDetail}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'rgba(16,6,52,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
                            padding: '28px', maxWidth: 640, width: '100%', maxHeight: '85vh', overflowY: 'auto',
                        }}
                    >
                        {detailLoading && <div style={{ color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>}
                        {detailError && <div style={{ color: '#f87171', marginBottom: 16 }}>⚠️ {detailError}</div>}

                        {detail && (
                            <>
                                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{detail.applicant.full_name}</h3>
                                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
                                    {detail.applicant.email} · {detail.applicant_role === 'Instructor' ? 'مدرّس' : 'طالب'}
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20, fontSize: 13.5 }}>
                                    <div>
                                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>تاريخ الميلاد المسجّل بالحساب: </span>
                                        <span>{new Date(detail.applicant.birth_date).toLocaleDateString('ar')}</span>
                                    </div>
                                    <div>
                                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>تاريخ التقديم: </span>
                                        <span>{new Date(detail.submitted_at).toLocaleDateString('ar')}</span>
                                    </div>
                                </div>

                                {/* الصور */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
                                    <div>
                                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>صورة الوثيقة</div>
                                        {imagesLoading ? (
                                            <div style={{ height: 180, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }} />
                                        ) : idImageUrl ? (
                                            <img src={idImageUrl} alt="ID document" style={{ width: '100%', borderRadius: 10, maxHeight: 220, objectFit: 'contain', background: '#fff' }} />
                                        ) : (
                                            <div style={{ height: 180, background: 'rgba(255,255,255,0.04)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>تعذّر التحميل</div>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>صورة السيلفي</div>
                                        {imagesLoading ? (
                                            <div style={{ height: 180, background: 'rgba(255,255,255,0.04)', borderRadius: 10 }} />
                                        ) : selfieImageUrl ? (
                                            <img src={selfieImageUrl} alt="Selfie" style={{ width: '100%', borderRadius: 10, maxHeight: 220, objectFit: 'contain', background: '#fff' }} />
                                        ) : (
                                            <div style={{ height: 180, background: 'rgba(255,255,255,0.04)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>تعذّر التحميل</div>
                                        )}
                                    </div>
                                </div>

                                {approveOutcome ? (
                                    <div style={{ background: approveOutcome === 'verified' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${approveOutcome === 'verified' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`, borderRadius: 10, padding: 14, marginBottom: 10 }}>
                                        {approveOutcome === 'verified' ? (
                                            <span style={{ color: '#4ade80' }}>✅ تم توثيق الحساب بنجاح.</span>
                                        ) : (
                                            <span style={{ color: '#fbbf24' }}>⚠️ تم تصنيف الطلب كـ "تعارض بالعمر" تلقائيًا (فارق أكثر من سنتين بين تاريخ الحساب ووثيقة الهوية) — الحساب تم تعليقه تلقائيًا، لا يمكن تجاوز هذا التصنيف.</span>
                                        )}
                                        <div style={{ marginTop: 10 }}>
                                            <button className="btn-secondary" onClick={closeDetail}>إغلاق</button>
                                        </div>
                                    </div>
                                ) : !showRejectForm ? (
                                    <>
                                        <div style={{ marginBottom: 14 }}>
                                            <label className="form-label">تاريخ الميلاد كما هو مكتوب بالوثيقة (بعد المقارنة البصرية)</label>
                                            <input className="form-input" type="date" value={documentBirthDate} onChange={e => setDocumentBirthDate(e.target.value)} disabled={approveLoading} />
                                        </div>
                                        <div style={{ marginBottom: 14 }}>
                                            <label className="form-label">ملاحظة (اختياري)</label>
                                            <input className="form-input" value={optionalNote} onChange={e => setOptionalNote(e.target.value)} disabled={approveLoading} />
                                        </div>
                                        {approveError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠️ {approveError}</div>}
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button className="btn-primary" onClick={handleApprove} disabled={approveLoading}>
                                                {approveLoading ? '...جارٍ المعالجة' : '✓ قبول الطلب'}
                                            </button>
                                            <button className="btn-secondary" style={{ color: '#f87171' }} onClick={() => setShowRejectForm(true)} disabled={approveLoading}>
                                                ✗ رفض الطلب
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ marginBottom: 14 }}>
                                            <label className="form-label">سبب الرفض</label>
                                            <select className="form-input" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} disabled={rejectLoading}>
                                                <option value="">اختر...</option>
                                                {REJECTION_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                            </select>
                                        </div>
                                        {rejectError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠️ {rejectError}</div>}
                                        <div style={{ display: 'flex', gap: 10 }}>
                                            <button className="btn-primary" style={{ background: '#ef4444' }} onClick={handleReject} disabled={rejectLoading}>
                                                {rejectLoading ? '...جارٍ المعالجة' : 'تأكيد الرفض'}
                                            </button>
                                            <button className="btn-secondary" onClick={() => setShowRejectForm(false)} disabled={rejectLoading}>
                                                رجوع
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}