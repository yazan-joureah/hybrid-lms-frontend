import { useState, useEffect } from 'react'
import API from '../../config/api'

// ==================== أنواع KYC ====================
type KycListItem = {
    _id: string
    user_id: { _id: string; full_name: string; email: string; role: string } | null
    status: string
    submitted_at: string
    applicant_role: string
}

const REJECTION_REASONS = [
    { value: 'UNCLEAR_IMAGE', label: 'صورة غير واضحة' },
    { value: 'DOCUMENT_EXPIRED', label: 'الوثيقة منتهية الصلاحية' },
    { value: 'DATA_MISMATCH', label: 'عدم تطابق البيانات' },
    { value: 'DOCUMENT_NOT_ACCEPTED', label: 'نوع الوثيقة غير مقبول' },
] as const

// ==================== أنواع مراجعة الكورسات ====================
type PendingCourse = {
    _id: string
    title: string
    description: string
    category: string
    course_type: string
    is_synchronous: boolean
    status: string
    updatedAt: string
    instructor_id: { full_name?: string } | string
}

type CourseUnit = {
    _id: string
    title: string
    content?: CourseContent[]
}

type CourseContent = {
    _id: string
    content_type: 'video' | 'document' | 'link' | 'text'
    mime_type?: string
    content_data?: { url?: string; text?: string }
}

function extractError(err: any): string {
    return err?.response?.data?.error?.message || err?.message || 'حدث خطأ غير متوقع.'
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'kyc' | 'courses'>('kyc')

    return (
        <div className="page-wrapper">
            <div style={{ marginBottom: 24 }}>
                <h2 className="section-title">لوحة تحكم الإدارة</h2>
            </div>

            <div className="tab-bar" style={{ marginBottom: 22, display: 'inline-flex' }}>
                <div className={`tab-item${activeTab === 'kyc' ? ' active' : ''}`} onClick={() => setActiveTab('kyc')}>
                    طلبات التوثيق (KYC)
                </div>
                <div className={`tab-item${activeTab === 'courses' ? ' active' : ''}`} onClick={() => setActiveTab('courses')}>
                    مراجعة الكورسات
                </div>
            </div>

            {activeTab === 'kyc' ? <KycTab /> : <CourseModerationTab />}
        </div>
    )
}

// ==================================================================
// تبويب KYC — نفس منطق KycReview.tsx بالضبط، مدمج هون كتبويب
// ==================================================================
function KycTab() {
    const [requests, setRequests] = useState<KycListItem[]>([])
    const [listLoading, setListLoading] = useState(true)
    const [listError, setListError] = useState('')

    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [applicant, setApplicant] = useState<{ full_name: string; email: string; birth_date: string; role: string } | null>(null)
    const [detailLoading, setDetailLoading] = useState(false)
    const [detailError, setDetailError] = useState('')

    const [idImageUrl, setIdImageUrl] = useState<string | null>(null)
    const [selfieImageUrl, setSelfieImageUrl] = useState<string | null>(null)
    const [imagesLoading, setImagesLoading] = useState(false)

    const [documentBirthDate, setDocumentBirthDate] = useState('')
    const [optionalNote, setOptionalNote] = useState('')
    const [rejectionReason, setRejectionReason] = useState<string>('UNCLEAR_IMAGE')
    const [actionLoading, setActionLoading] = useState(false)
    const [actionError, setActionError] = useState('')

    const fetchList = async () => {
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
    }

    useEffect(() => { fetchList() }, [])

    useEffect(() => {
        return () => {
            if (idImageUrl) URL.revokeObjectURL(idImageUrl)
            if (selfieImageUrl) URL.revokeObjectURL(selfieImageUrl)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedId])

    const handleSelectRequest = async (item: KycListItem) => {
        setSelectedId(item._id)
        setApplicant(null)
        setIdImageUrl(null)
        setSelfieImageUrl(null)
        setDocumentBirthDate('')
        setOptionalNote('')
        setActionError('')
        setDetailError('')

        setDetailLoading(true)
        try {
            const res = await API.get(`/admin/kyc/requests/${item._id}`)
            setApplicant(res.data?.data?.applicant)
        } catch (err) {
            setDetailError(extractError(err))
        } finally {
            setDetailLoading(false)
        }

        setImagesLoading(true)
        try {
            const [idRes, selfieRes] = await Promise.all([
                API.get(`/admin/kyc/requests/${item._id}/documents/id_document`, { responseType: 'blob' }),
                API.get(`/admin/kyc/requests/${item._id}/documents/selfie`, { responseType: 'blob' }),
            ])
            setIdImageUrl(URL.createObjectURL(idRes.data))
            setSelfieImageUrl(URL.createObjectURL(selfieRes.data))
        } catch (err) {
            setDetailError('تعذّر تحميل صور المستندات: ' + extractError(err))
        } finally {
            setImagesLoading(false)
        }
    }

    const handleApprove = async () => {
        if (!selectedId) return
        if (!documentBirthDate) {
            setActionError('أدخل تاريخ الميلاد كما هو مكتوب بالوثيقة')
            return
        }
        setActionError('')
        setActionLoading(true)
        try {
            await API.post(`/admin/kyc/requests/${selectedId}/approve`, {
                documentBirthDate,
                optionalNote: optionalNote.trim() || undefined,
            })
            setSelectedId(null)
            await fetchList()
        } catch (err) {
            setActionError(extractError(err))
        } finally {
            setActionLoading(false)
        }
    }

    const handleReject = async () => {
        if (!selectedId) return
        setActionError('')
        setActionLoading(true)
        try {
            await API.post(`/admin/kyc/requests/${selectedId}/reject`, { rejectionReason })
            setSelectedId(null)
            await fetchList()
        } catch (err) {
            setActionError(extractError(err))
        } finally {
            setActionLoading(false)
        }
    }

    if (listLoading) return <div style={{ color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>
    if (listError) return <div style={{ color: '#f87171' }}>⚠️ {listError}</div>

    if (!selectedId) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
                <h3 style={{ marginBottom: 16 }}>طلبات قيد المراجعة ({requests.length})</h3>
                {requests.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>لا توجد طلبات توثيق قيد المراجعة حاليًا.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {requests.map((r) => (
                            <div key={r._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: '1px solid var(--border)', borderRadius: 10 }}>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.user_id?.full_name || 'مستخدم غير معروف'} <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>({r.user_id?.email})</span></div>
                                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                                        {r.applicant_role === 'Instructor' ? 'مدرّس' : 'طالب'} · {new Date(r.submitted_at).toLocaleString('ar')}
                                    </div>
                                </div>
                                <button className="btn-primary" onClick={() => handleSelectRequest(r)}>مراجعة</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div style={{ background: 'var(--bg-card)', border: '2px solid #7c3aed', borderRadius: 18, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3>مراجعة: {applicant?.full_name || '...'}</h3>
                <button className="btn-secondary" onClick={() => setSelectedId(null)}>إغلاق</button>
            </div>

            {detailLoading && <div style={{ color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>}
            {detailError && <div style={{ color: '#f87171', marginBottom: 14 }}>⚠️ {detailError}</div>}

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

            {actionError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>⚠️ {actionError}</div>}

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
                    <button className="btn-primary" style={{ background: '#16a34a', width: '100%' }} onClick={handleApprove} disabled={actionLoading}>
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
                    <button className="btn-primary" style={{ background: '#dc2626', width: '100%' }} onClick={handleReject} disabled={actionLoading}>
                        {actionLoading ? '...' : 'رفض الطلب'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ==================================================================
// تبويب مراجعة الكورسات — منقول من الكود المرجعي، مصحّح على مسارات
// adminRoutes.js الحالية (/admin/courses/pending, /admin/courses/:id/review,
// /admin/courses/:id/status)
// ==================================================================
function CourseModerationTab() {
    const [pendingCourses, setPendingCourses] = useState<PendingCourse[]>([])
    const [courseLoading, setCourseLoading] = useState(true)
    const [listError, setListError] = useState('')

    const [selectedCourse, setSelectedCourse] = useState<{ course: PendingCourse; units: CourseUnit[] } | null>(null)
    const [reviewDecision, setReviewDecision] = useState<'publish' | 'needs_revision' | 'reject'>('publish')
    const [reviewReason, setReviewReason] = useState('')
    const [reviewError, setReviewError] = useState('')

    const [expandedContent, setExpandedContent] = useState<Set<string>>(new Set())
    const [contentBlobUrls, setContentBlobUrls] = useState<Record<string, string>>({})

    const fetchPendingCourses = async () => {
        setCourseLoading(true)
        setListError('')
        try {
            const res = await API.get('/admin/courses/pending')
            setPendingCourses(res.data?.data?.courses || [])
        } catch (err) {
            setListError(extractError(err))
        } finally {
            setCourseLoading(false)
        }
    }

    useEffect(() => {
        fetchPendingCourses()
        return () => {
            Object.values(contentBlobUrls).forEach((url) => URL.revokeObjectURL(url))
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handlePreviewCourse = async (courseId: string) => {
        setSelectedCourse(null)
        setExpandedContent(new Set())
        Object.values(contentBlobUrls).forEach((url) => URL.revokeObjectURL(url))
        setContentBlobUrls({})
        setReviewError('')
        setReviewDecision('publish')
        setReviewReason('')

        try {
            const courseRes = await API.get(`/courses/${courseId}`)
            const course = courseRes.data?.data?.course
            if (!course) throw new Error('الكورس غير موجود')

            const unitsRes = await API.get(`/courses/${courseId}/units`)
            const unitsList: CourseUnit[] = unitsRes.data?.data?.units || []

            const unitsWithContent = await Promise.all(
                unitsList.map(async (unit) => {
                    try {
                        const unitDetailRes = await API.get(`/courses/${courseId}/units/${unit._id}`)
                        return unitDetailRes.data?.data?.unit || unit
                    } catch {
                        return unit
                    }
                })
            )

            setSelectedCourse({ course, units: unitsWithContent })
        } catch (err) {
            setListError(extractError(err))
        }
    }

    const handleSubmitReview = async () => {
        if (!selectedCourse) return
        if (reviewDecision !== 'publish' && !reviewReason.trim()) {
            setReviewError('أدخل سبب الرفض/طلب التعديل')
            return
        }
        setReviewError('')
        setCourseLoading(true)
        try {
            const payload: { decision: string; reason?: string } = { decision: reviewDecision }
            if (reviewDecision !== 'publish') payload.reason = reviewReason.trim()

            await API.post(`/admin/courses/${selectedCourse.course._id}/review`, payload)
            setSelectedCourse(null)
            setReviewDecision('publish')
            setReviewReason('')
            await fetchPendingCourses()
        } catch (err) {
            setReviewError(extractError(err))
        } finally {
            setCourseLoading(false)
        }
    }

    const handleModerateCourse = async (courseId: string, status: 'suspended' | 'archived') => {
        if (!window.confirm(`هل أنت متأكد من وضع علامة "${status}" على هذا الكورس؟`)) return
        try {
            await API.patch(`/admin/courses/${courseId}/status`, { status })
            await fetchPendingCourses()
            if (selectedCourse?.course._id === courseId) setSelectedCourse(null)
        } catch (err) {
            setReviewError(extractError(err))
        }
    }

    const toggleContent = async (contentId: string, content: CourseContent) => {
        if (expandedContent.has(contentId)) {
            if (contentBlobUrls[contentId]) {
                URL.revokeObjectURL(contentBlobUrls[contentId])
                setContentBlobUrls((prev) => {
                    const next = { ...prev }
                    delete next[contentId]
                    return next
                })
            }
            setExpandedContent((prev) => {
                const next = new Set(prev)
                next.delete(contentId)
                return next
            })
            return
        }

        if ((content.content_type === 'video' || content.content_type === 'document') && selectedCourse) {
            try {
                const response = await API.get(`/courses/${selectedCourse.course._id}/content/${contentId}/file`, { responseType: 'blob' })
                const url = URL.createObjectURL(response.data)
                setContentBlobUrls((prev) => ({ ...prev, [contentId]: url }))
            } catch (err) {
                setReviewError(extractError(err))
                return
            }
        }
        setExpandedContent((prev) => new Set(prev).add(contentId))
    }

    if (courseLoading && !selectedCourse) return <div style={{ color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>
    if (listError && !selectedCourse) return <div style={{ color: '#f87171' }}>⚠️ {listError}</div>

    if (!selectedCourse) {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
                <h3 style={{ marginBottom: 16 }}>كورسات بانتظار المراجعة</h3>
                {pendingCourses.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.5)' }}>لا توجد كورسات بانتظار المراجعة حاليًا.</p>
                ) : (
                    <table className="data-table" style={{ width: '100%' }}>
                        <thead>
                            <tr><th>عنوان الكورس</th><th>المدرّس</th><th>تاريخ التحديث</th><th></th></tr>
                        </thead>
                        <tbody>
                            {pendingCourses.map((c) => (
                                <tr key={c._id}>
                                    <td>{c.title}</td>
                                    <td>{typeof c.instructor_id === 'object' ? c.instructor_id.full_name : c.instructor_id}</td>
                                    <td style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(c.updatedAt).toLocaleDateString('ar')}</td>
                                    <td><button className="btn-primary" onClick={() => handlePreviewCourse(c._id)}>معاينة ومراجعة</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        )
    }

    return (
        <div style={{ background: 'var(--bg-card)', border: '2px solid #7c3aed', borderRadius: 18, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3>مراجعة: {selectedCourse.course.title}</h3>
                <button className="btn-secondary" onClick={() => { setSelectedCourse(null); setExpandedContent(new Set()) }}>إلغاء</button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 10, marginBottom: 20, fontSize: 13.5 }}>
                <p><strong>الوصف:</strong> {selectedCourse.course.description}</p>
                <p><strong>الفئة:</strong> {selectedCourse.course.category}</p>
                <p><strong>النوع:</strong> {selectedCourse.course.course_type}</p>
                <p><strong>مباشر:</strong> {selectedCourse.course.is_synchronous ? 'نعم' : 'لا'}</p>
                <p><strong>الحالة:</strong> <span className="badge">{selectedCourse.course.status}</span></p>
            </div>

            <h4 style={{ marginBottom: 12 }}>محتوى الكورس</h4>
            {selectedCourse.units.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                    {selectedCourse.units.map((unit) => (
                        <div key={unit._id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 14 }}>
                            <h5 style={{ marginBottom: 10 }}>{unit.title}</h5>
                            {unit.content && unit.content.length > 0 ? (
                                <div style={{ paddingRight: 14, borderRight: '2px solid var(--border)' }}>
                                    {unit.content.map((content) => {
                                        const isExpanded = expandedContent.has(content._id)
                                        const blobUrl = contentBlobUrls[content._id]
                                        return (
                                            <div key={content._id} style={{ marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ cursor: 'pointer' }} onClick={() => toggleContent(content._id, content)}>
                                                        {content.content_type === 'video' && '🎥 '}
                                                        {content.content_type === 'document' && '📄 '}
                                                        {content.content_type === 'link' && '🔗 '}
                                                        {content.content_type === 'text' && '📝 '}
                                                        {content.content_type}
                                                    </span>
                                                    <button className="btn-secondary" onClick={() => toggleContent(content._id, content)}>
                                                        {isExpanded ? 'إخفاء' : 'معاينة'}
                                                    </button>
                                                </div>
                                                {isExpanded && (
                                                    <div style={{ marginTop: 10, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                                        {content.content_type === 'video' && (
                                                            <video controls style={{ width: '100%', maxHeight: 400 }}>
                                                                <source src={blobUrl} type={content.mime_type || 'video/mp4'} />
                                                            </video>
                                                        )}
                                                        {content.content_type === 'document' && (
                                                            content.mime_type === 'application/pdf' && blobUrl ? (
                                                                <embed src={blobUrl} type="application/pdf" width="100%" height="500px" />
                                                            ) : blobUrl ? (
                                                                <a href={blobUrl} download>تحميل الملف</a>
                                                            ) : <p>...جارٍ التحميل</p>
                                                        )}
                                                        {content.content_type === 'link' && content.content_data?.url && (
                                                            <a href={content.content_data.url} target="_blank" rel="noopener noreferrer">{content.content_data.url}</a>
                                                        )}
                                                        {content.content_type === 'text' && (
                                                            <div style={{ whiteSpace: 'pre-wrap', background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 6 }}>
                                                                {content.content_data?.text}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>لا يوجد محتوى بهذه الوحدة.</p>}
                        </div>
                    ))}
                </div>
            ) : <p style={{ color: 'rgba(255,255,255,0.4)' }}>لا توجد وحدات.</p>}

            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                <div className="field-group" style={{ marginBottom: 14 }}>
                    <label className="form-label">القرار</label>
                    <select className="form-input" value={reviewDecision} onChange={e => setReviewDecision(e.target.value as any)}>
                        <option value="publish">نشر الكورس</option>
                        <option value="needs_revision">يحتاج تعديل</option>
                        <option value="reject">رفض الكورس</option>
                    </select>
                </div>
                {reviewDecision !== 'publish' && (
                    <div className="field-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">سبب الرفض / التعديل</label>
                        <textarea className="form-input" rows={3} value={reviewReason} onChange={e => setReviewReason(e.target.value)} placeholder="اشرح ما يجب تعديله..." />
                    </div>
                )}
                {reviewError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠️ {reviewError}</div>}
                <button className="btn-primary" onClick={handleSubmitReview} disabled={courseLoading}>
                    تأكيد القرار النهائي
                </button>
            </div>

            <hr style={{ margin: '20px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
            <h4 style={{ marginBottom: 12 }}>إجراءات طارئة</h4>
            <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn-secondary" style={{ background: '#f59e0b', color: '#fff', border: 'none' }} onClick={() => handleModerateCourse(selectedCourse.course._id, 'suspended')}>
                    تعليق فوري
                </button>
                <button className="btn-secondary" style={{ background: '#dc2626', color: '#fff', border: 'none' }} onClick={() => handleModerateCourse(selectedCourse.course._id, 'archived')}>
                    أرشفة فورية
                </button>
            </div>
        </div>
    )
}