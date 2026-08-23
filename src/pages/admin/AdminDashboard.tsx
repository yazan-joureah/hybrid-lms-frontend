import { useState, useEffect } from 'react'
import { useNav } from '../../context/NavContext'
import { useToast } from '../../contexts/ToastContext'
import API from '../../config/api'
import { getErrorMessage } from '../../utils/errorMessages'
import type {
  KycRequest, ApprovalData, RejectionReason, DocImages,
  CourseSummaryAdmin, CoursePreview, ReviewPayload, ReviewDecision,
  CourseModerationStatus, ContentItem,
} from '../../types'

type AdminTab = 'kyc' | 'courses'

const rejectionReasonLabels: Record<RejectionReason, string> = {
  UNCLEAR_IMAGE: 'صورة غير واضحة',
  DOCUMENT_EXPIRED: 'الوثيقة منتهية الصلاحية',
  DATA_MISMATCH: 'عدم تطابق البيانات',
  DOCUMENT_NOT_ACCEPTED: 'الوثيقة غير مقبولة',
}

export default function AdminDashboard() {
  const { userName } = useNav()
  const { showMsg } = useToast()

  const [activeTab, setActiveTab] = useState<AdminTab>('kyc')

  // --- KYC state ---
  const [pendingRequests, setPendingRequests] = useState<KycRequest[]>([])
  const [selectedReq, setSelectedReq] = useState<KycRequest | null>(null)
  const [docImages, setDocImages] = useState<DocImages>({ idDoc: '', selfie: '' })
  const [approvalData, setApprovalData] = useState<ApprovalData>({ documentBirthDate: '', optionalNote: '' })
  const [rejectionReason, setRejectionReason] = useState<RejectionReason>('UNCLEAR_IMAGE')
  const [loading, setLoading] = useState(false)

  // --- Course moderation state ---
  const [pendingCourses, setPendingCourses] = useState<CourseSummaryAdmin[]>([])
  const [selectedCourse, setSelectedCourse] = useState<CoursePreview | null>(null)
  const [reviewPayload, setReviewPayload] = useState<ReviewPayload>({ decision: 'publish', reason: '' })
  const [courseLoading, setCourseLoading] = useState(false)
  const [expandedContent, setExpandedContent] = useState<Set<string>>(new Set())
  const [contentBlobUrls, setContentBlobUrls] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchPendingKycRequests()
  }, [])

  const fetchPendingKycRequests = async () => {
    try {
      const res = await API.get('/kyc/requests')
      setPendingRequests(res.data?.data?.requests || [])
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const handleSelectRequest = async (req: KycRequest) => {
    setSelectedReq(req)
    setApprovalData({ documentBirthDate: '', optionalNote: '' })
    setDocImages({ idDoc: '', selfie: '' })
    try {
      const idDocRes = await API.get(`/kyc/requests/${req._id}/documents/id_document`, { responseType: 'blob' })
      const selfieRes = await API.get(`/kyc/requests/${req._id}/documents/selfie`, { responseType: 'blob' })
      setDocImages({
        idDoc: URL.createObjectURL(idDocRes.data),
        selfie: URL.createObjectURL(selfieRes.data),
      })
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const handleApproveKyc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq) return
    setLoading(true)
    try {
      await API.post(`/kyc/requests/${selectedReq._id}/approve`, approvalData)
      showMsg('تمت الموافقة على طلب التحقق بنجاح', 'success')
      setSelectedReq(null)
      fetchPendingKycRequests()
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRejectKyc = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq) return
    setLoading(true)
    try {
      await API.post(`/kyc/requests/${selectedReq._id}/reject`, { rejectionReason })
      showMsg('تم رفض طلب التحقق', 'info')
      setSelectedReq(null)
      fetchPendingKycRequests()
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'courses') fetchPendingCourses()
    return () => {
      Object.values(contentBlobUrls).forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const fetchPendingCourses = async () => {
    setCourseLoading(true)
    try {
      const res = await API.get('/admin/courses/pending')
      setPendingCourses(res.data?.data?.courses || [])
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setCourseLoading(false)
    }
  }

  const handlePreviewCourse = async (courseId: string) => {
    setSelectedCourse(null)
    setExpandedContent(new Set())
    Object.values(contentBlobUrls).forEach((url) => URL.revokeObjectURL(url))
    setContentBlobUrls({})
    try {
      const res = await API.get(`/admin/courses/${courseId}/preview`)
      setSelectedCourse(res.data?.data)
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCourse) return
    setCourseLoading(true)
    const payload: { decision: ReviewDecision; reason?: string } = { decision: reviewPayload.decision }
    if (reviewPayload.decision !== 'publish' && reviewPayload.reason?.trim()) {
      payload.reason = reviewPayload.reason.trim()
    }
    try {
      await API.post(`/admin/courses/${selectedCourse.course._id}/review`, payload)
      showMsg('تم إرسال قرار المراجعة بنجاح', 'success')
      setSelectedCourse(null)
      setReviewPayload({ decision: 'publish', reason: '' })
      fetchPendingCourses()
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setCourseLoading(false)
    }
  }

  const handleModerateCourse = async (courseId: string, status: CourseModerationStatus) => {
    const label = status === 'suspended' ? 'تعليق' : 'أرشفة'
    if (!window.confirm(`هل أنت متأكد من ${label} هذا الكورس؟`)) return
    try {
      await API.patch(`/admin/courses/${courseId}/status`, { status })
      showMsg(`تم ${label} الكورس`, 'info')
      fetchPendingCourses()
      if (selectedCourse && selectedCourse.course._id === courseId) setSelectedCourse(null)
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const toggleContent = async (contentId: string, content: ContentItem) => {
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
    if (!selectedCourse) return
    if (content.content_type === 'video' || content.content_type === 'document') {
      try {
        const response = await API.get(`/courses/${selectedCourse.course._id}/content/${contentId}/file`, { responseType: 'blob' })
        const url = URL.createObjectURL(response.data)
        setContentBlobUrls((prev) => ({ ...prev, [contentId]: url }))
      } catch (err) {
        showMsg(getErrorMessage(err), 'error')
        return
      }
    }
    setExpandedContent((prev) => new Set(prev).add(contentId))
  }

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">لوحة تحكم الإدارة</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>
          مرحباً {userName || 'مسؤول'}، راجع طلبات التحقق والكورسات المعلّقة
        </p>
      </div>

      <div className="tab-bar" style={{ marginBottom: 24, width: 'fit-content' }}>
        <div className={`tab-item${activeTab === 'kyc' ? ' active' : ''}`} onClick={() => setActiveTab('kyc')}>
          طلبات التحقق (KYC) {pendingRequests.length > 0 && `· ${pendingRequests.length}`}
        </div>
        <div className={`tab-item${activeTab === 'courses' ? ' active' : ''}`} onClick={() => setActiveTab('courses')}>
          مراجعة الكورسات {pendingCourses.length > 0 && `· ${pendingCourses.length}`}
        </div>
      </div>

      {activeTab === 'kyc' && (
        <div>
          {!selectedReq ? (
            <div className="glass" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>الطلبات المعلّقة</h3>
              {pendingRequests.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5 }}>لا توجد طلبات تحقق معلّقة حالياً.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {pendingRequests.map((req) => (
                    <div key={req._id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px', border: '1px solid var(--border)', borderRadius: 12,
                    }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{req.user_id?.full_name || 'غير معروف'}</div>
                        <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                          {req.user_id?.email} · {req.applicant_role} · {new Date(req.submitted_at).toLocaleString('ar')}
                        </div>
                      </div>
                      <button className="btn-primary" style={{ padding: '9px 18px', fontSize: 13 }} onClick={() => handleSelectRequest(req)}>
                        مراجعة
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass" style={{ padding: 22, border: '1px solid var(--border-hover)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>مراجعة: {selectedReq.user_id?.full_name}</h3>
                <button className="btn-outline" style={{ padding: '7px 16px', fontSize: 13 }} onClick={() => setSelectedReq(null)}>إغلاق</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 22 }}>
                <div style={{ textAlign: 'center' }}>
                  <p className="form-label">وثيقة الهوية</p>
                  {docImages.idDoc ? (
                    <a href={docImages.idDoc} target="_blank" rel="noreferrer">
                      <img src={docImages.idDoc} alt="وثيقة الهوية" style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)' }} />
                    </a>
                  ) : <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>...جارِ التحميل</p>}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p className="form-label">صورة السيلفي</p>
                  {docImages.selfie ? (
                    <a href={docImages.selfie} target="_blank" rel="noreferrer">
                      <img src={docImages.selfie} alt="سيلفي" style={{ maxWidth: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 12, border: '1px solid var(--border)' }} />
                    </a>
                  ) : <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>...جارِ التحميل</p>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <form onSubmit={handleApproveKyc} style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 14, padding: 18 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: '#34d399' }}>الموافقة على الطلب</h4>
                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label">تاريخ الميلاد (من الوثيقة)</label>
                    <input className="form-input" type="date" required
                      value={approvalData.documentBirthDate}
                      onChange={(e) => setApprovalData({ ...approvalData, documentBirthDate: e.target.value })} />
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">ملاحظة (اختياري)</label>
                    <input className="form-input" type="text" placeholder="ملاحظات التحقق..."
                      value={approvalData.optionalNote}
                      onChange={(e) => setApprovalData({ ...approvalData, optionalNote: e.target.value })} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #10b981, #059669)' }} disabled={loading}>
                    الموافقة على الطلب
                  </button>
                </form>

                <form onSubmit={handleRejectKyc} style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: 18 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px', color: '#f87171' }}>رفض الطلب</h4>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">سبب الرفض</label>
                    <select className="form-input" value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value as RejectionReason)}>
                      {(Object.entries(rejectionReasonLabels) as [RejectionReason, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #ef4444, #dc2626)', marginTop: 8 }} disabled={loading}>
                    رفض الطلب
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'courses' && (
        <div>
          {courseLoading && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>...جارِ التحميل</p>}
          {!selectedCourse ? (
            <div className="glass" style={{ padding: 22 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>قائمة انتظار المراجعة</h3>
              {pendingCourses.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5 }}>لا توجد كورسات بانتظار المراجعة حالياً.</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>عنوان الكورس</th>
                      <th>المدرّس</th>
                      <th>تاريخ التقديم</th>
                      <th>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingCourses.map((course) => (
                      <tr key={course._id}>
                        <td>{course.title}</td>
                        <td>{typeof course.instructor_id === 'object' ? course.instructor_id?.full_name : course.instructor_id}</td>
                        <td>{new Date(course.updatedAt).toLocaleDateString('ar')}</td>
                        <td>
                          <button className="btn-primary" style={{ padding: '6px 16px', fontSize: 12.5 }} onClick={() => handlePreviewCourse(course._id)}>
                            معاينة ومراجعة
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <div className="glass" style={{ padding: 22, border: '1px solid var(--border-hover)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>مراجعة: {selectedCourse.course.title}</h3>
                <button className="btn-outline" style={{ padding: '7px 16px', fontSize: 13 }}
                  onClick={() => { setSelectedCourse(null); setExpandedContent(new Set()) }}>إلغاء المراجعة</button>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ fontSize: 13.5, margin: '0 0 8px' }}><strong>الوصف:</strong> {selectedCourse.course.description}</p>
                <p style={{ fontSize: 13.5, margin: '0 0 8px' }}><strong>التصنيف:</strong> {selectedCourse.course.category}</p>
                <p style={{ fontSize: 13.5, margin: '0 0 8px' }}><strong>النوع:</strong> {selectedCourse.course.course_type}</p>
                <p style={{ fontSize: 13.5, margin: '0 0 8px' }}><strong>متزامن:</strong> {selectedCourse.course.is_synchronous ? 'نعم' : 'لا'}</p>
                <p style={{ fontSize: 13.5, margin: 0 }}><strong>الحالة:</strong> <span className="badge badge-info">{selectedCourse.course.status}</span></p>
              </div>

              <h4 style={{ fontSize: 14.5, fontWeight: 700, margin: '0 0 12px' }}>محتوى الكورس</h4>
              {selectedCourse.units && selectedCourse.units.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
                  {selectedCourse.units.map((unit) => (
                    <div key={unit._id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                      <h5 style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 10px' }}>{unit.title}</h5>
                      {unit.content && unit.content.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {unit.content.map((content) => {
                            const isExpanded = expandedContent.has(content._id)
                            const blobUrl = contentBlobUrls[content._id]
                            return (
                              <div key={content._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 8 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: 13, cursor: 'pointer' }} onClick={() => toggleContent(content._id, content)}>
                                    {content.content_type === 'video' && '🎥 '}
                                    {content.content_type === 'document' && '📄 '}
                                    {content.content_type === 'link' && '🔗 '}
                                    {content.content_type === 'text' && '📝 '}
                                    {content.content_type}
                                  </span>
                                  <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => toggleContent(content._id, content)}>
                                    {isExpanded ? 'إخفاء المعاينة' : 'معاينة'}
                                  </button>
                                </div>
                                {isExpanded && (
                                  <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                    {content.content_type === 'video' && (
                                      <video controls style={{ width: '100%', maxHeight: 360, borderRadius: 8 }}>
                                        <source src={blobUrl} type={content.mime_type || 'video/mp4'} />
                                      </video>
                                    )}
                                    {content.content_type === 'document' && (
                                      content.mime_type === 'application/pdf' && blobUrl ? (
                                        <embed src={blobUrl} type="application/pdf" width="100%" height="480px" />
                                      ) : blobUrl ? (
                                        <p style={{ fontSize: 12.5 }}>معاينة غير متوفرة لهذا النوع. <a href={blobUrl} download style={{ color: '#a855f7' }}>تحميل</a></p>
                                      ) : <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>...جارِ التحميل</p>
                                    )}
                                    {content.content_type === 'link' && (
                                      <a href={content.content_data?.url} target="_blank" rel="noopener noreferrer" style={{ color: '#a855f7', fontSize: 12.5 }}>
                                        {content.content_data?.url}
                                      </a>
                                    )}
                                    {content.content_type === 'text' && (
                                      <div style={{ whiteSpace: 'pre-wrap', fontSize: 12.5 }}>{content.content_data?.text}</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      ) : <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>لا يوجد محتوى في هذه الوحدة.</p>}
                    </div>
                  ))}
                </div>
              ) : <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>لا توجد وحدات.</p>}

              <form onSubmit={handleSubmitReview} style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">القرار</label>
                  <select className="form-input" value={reviewPayload.decision}
                    onChange={(e) => setReviewPayload({ ...reviewPayload, decision: e.target.value as ReviewDecision })}>
                    <option value="publish">نشر الكورس</option>
                    <option value="needs_revision">يحتاج تعديلات</option>
                    <option value="reject">رفض الكورس</option>
                  </select>
                </div>
                {reviewPayload.decision !== 'publish' && (
                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label">سبب الرفض / التعديلات المطلوبة</label>
                    <textarea className="form-input" required rows={3} placeholder="اشرح ما يجب تعديله..."
                      value={reviewPayload.reason} onChange={(e) => setReviewPayload({ ...reviewPayload, reason: e.target.value })}
                      style={{ resize: 'none' }} />
                  </div>
                )}
                <button type="submit" className="btn-primary" disabled={courseLoading}>إرسال القرار النهائي</button>
              </form>

              <div className="divider" style={{ marginBottom: 20 }} />
              <h4 style={{ fontSize: 14, fontWeight: 700, margin: '0 0 14px' }}>إجراءات طارئة</h4>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-outline" style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#fbbf24' }}
                  onClick={() => handleModerateCourse(selectedCourse.course._id, 'suspended')}>تعليق فوري</button>
                <button className="btn-outline" style={{ borderColor: 'rgba(239,68,68,0.4)', color: '#f87171' }}
                  onClick={() => handleModerateCourse(selectedCourse.course._id, 'archived')}>أرشفة فورية</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
