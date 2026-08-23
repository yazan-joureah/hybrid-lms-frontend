import { useState, useEffect } from 'react'
import { useNav } from '../../context/NavContext'
import { useToast } from '../../contexts/ToastContext'
import API from '../../config/api'
import { getErrorMessage } from '../../utils/errorMessages'
import type {
  InstructorCourseSummary, CoursePreview, Unit, ContentItem, ContentType,
} from '../../types'

type ManageTab = 'details' | 'units' | 'quizzes' | 'students'

interface CourseFormData {
  title: string
  description: string
  category: string
  course_type: string
  price: number
  is_synchronous: boolean
  max_students: number | string
  completion_threshold: number
}

interface NewContentState {
  contentType: ContentType
  url: string
  text: string
  file: File | null
}

const statusLabels: Record<string, string> = {
  draft: 'مسودة',
  pending_review: 'بانتظار المراجعة',
  needs_revision: 'يحتاج تعديلات',
  published: 'منشور',
  rejected: 'مرفوض',
  suspended: 'معلّق',
  archived: 'مؤرشف',
}

const statusBadgeClass: Record<string, string> = {
  draft: 'badge-neutral',
  pending_review: 'badge-info',
  needs_revision: 'badge-warning',
  published: 'badge-success',
  rejected: 'badge-danger',
  suspended: 'badge-danger',
  archived: 'badge-neutral',
}

export default function InstructorDashboard() {
  const { navigate } = useNav()
  const { showMsg } = useToast()

  const [courses, setCourses] = useState<InstructorCourseSummary[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const [courseDetail, setCourseDetail] = useState<CoursePreview | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<ManageTab>('details')

  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<CourseFormData>({
    title: '', description: '', category: '', course_type: 'free',
    price: 0, is_synchronous: false, max_students: '', completion_threshold: 0.7,
  })
  const [coverUploading, setCoverUploading] = useState(false)

  const [newUnitTitle, setNewUnitTitle] = useState('')
  const [editingUnit, setEditingUnit] = useState<string | null>(null)
  const [editingUnitTitle, setEditingUnitTitle] = useState('')
  const [newContentUnitId, setNewContentUnitId] = useState<string | null>(null)
  const [newContentData, setNewContentData] = useState<NewContentState>({ contentType: 'video', url: '', text: '', file: null })
  const [expandedContent, setExpandedContent] = useState<Set<string>>(new Set())
  const [contentBlobUrls, setContentBlobUrls] = useState<Record<string, string>>({})

  const [quizzes, setQuizzes] = useState<any[]>([])
  const [quizzesLoading, setQuizzesLoading] = useState(false)

  const [students, setStudents] = useState<any[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  // ---------- Fetch course list ----------
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const res = await API.get('/courses/instructor/my-courses')
      setCourses(res.data?.data?.courses || [])
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboardData() }, [])

  const stats = {
    totalCourses: courses.length,
    totalStudents: courses.reduce((sum, c) => sum + (c.enrolledCount || 0), 0),
    avgRating: courses.length ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length) : 0,
    published: courses.filter((c) => c.status === 'published').length,
  }

  // ---------- Course selection / detail ----------
  const fetchCourseDetail = async (courseId: string) => {
    setDetailLoading(true)
    setCourseDetail(null)
    setActiveTab('details')
    setStudents([])
    setQuizzes([])
    Object.values(contentBlobUrls).forEach((u) => URL.revokeObjectURL(u))
    setContentBlobUrls({})
    setExpandedContent(new Set())
    try {
      const res = await API.get(`/courses/${courseId}/manage`)
      const data: CoursePreview | undefined = res.data?.data
      setCourseDetail(data ?? null)
      if (data?.course) {
        const c = data.course
        setFormData({
          title: c.title || '', description: c.description || '', category: c.category || '',
          course_type: c.course_type || 'free', price: c.price || 0, is_synchronous: c.is_synchronous || false,
          max_students: c.max_students ?? '', completion_threshold: c.completion_threshold ?? 0.7,
        })
        setEditMode(false)
      }
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSelectCourse = (courseId: string) => {
    if (selectedCourseId === courseId) {
      setSelectedCourseId(null)
      setCourseDetail(null)
      Object.values(contentBlobUrls).forEach((u) => URL.revokeObjectURL(u))
      setContentBlobUrls({})
      setExpandedContent(new Set())
      return
    }
    setSelectedCourseId(courseId)
    fetchCourseDetail(courseId)
  }

  const fetchQuizzes = async () => {
    if (!selectedCourseId) return
    setQuizzesLoading(true)
    try {
      const res = await API.get(`/quizzes?course_id=${selectedCourseId}`)
      setQuizzes(res.data?.data?.quizzes || [])
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setQuizzesLoading(false)
    }
  }

  const fetchStudents = async () => {
    if (!selectedCourseId) return
    setStudentsLoading(true)
    try {
      const res = await API.get(`/courses/${selectedCourseId}/students`)
      setStudents(res.data?.data?.students || [])
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setStudentsLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedCourseId) return
    if (activeTab === 'students') fetchStudents()
    if (activeTab === 'quizzes') fetchQuizzes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedCourseId])

  useEffect(() => {
    return () => { Object.values(contentBlobUrls).forEach((u) => URL.revokeObjectURL(u)) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- Course CRUD ----------
  const handleCreateCourse = async () => {
    try {
      await API.post('/courses', {
        title: 'كورس جديد', description: 'وصف الكورس', category: 'تقنية وحوسبة',
        course_type: 'free', price: 0, is_synchronous: false,
      })
      showMsg('تم إنشاء مسودة كورس جديدة!', 'success')
      fetchDashboardData()
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const handleSaveDetails = async () => {
    if (!selectedCourseId) return
    try {
      await API.put(`/courses/${selectedCourseId}`, formData)
      showMsg('تم تحديث الكورس بنجاح!', 'success')
      setEditMode(false)
      fetchCourseDetail(selectedCourseId)
      fetchDashboardData()
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const handleDeleteCourse = async () => {
    if (!selectedCourseId) return
    if (!window.confirm('هل أنت متأكد من حذف هذا الكورس؟ لا يمكن التراجع عن هذا الإجراء.')) return
    try {
      await API.delete(`/courses/${selectedCourseId}`)
      showMsg('تم حذف الكورس.', 'success')
      setSelectedCourseId(null)
      setCourseDetail(null)
      fetchDashboardData()
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedCourseId) return
    setCoverUploading(true)
    const uploadData = new FormData()
    uploadData.append('image', file)
    try {
      await API.patch(`/courses/${selectedCourseId}/cover-image`, uploadData, { headers: { 'Content-Type': 'multipart/form-data' } })
      showMsg('تم تحديث صورة الغلاف!', 'success')
      fetchCourseDetail(selectedCourseId)
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setCoverUploading(false)
      e.target.value = ''
    }
  }

  const handleReviewAction = async (courseId: string, action: 'submit' | 'cancel') => {
    const endpoint = action === 'submit' ? 'submit-review' : 'cancel-review'
    try {
      await API.post(`/courses/${courseId}/${endpoint}`)
      showMsg(action === 'submit' ? 'تم إرسال الكورس للمراجعة بنجاح!' : 'تم إلغاء طلب المراجعة.', 'success')
      fetchDashboardData()
      if (selectedCourseId === courseId) fetchCourseDetail(courseId)
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  // ---------- Units ----------
  const handleAddUnit = async () => {
    if (!newUnitTitle.trim() || !selectedCourseId) {
      showMsg('يرجى إدخال عنوان الوحدة.', 'error')
      return
    }
    try {
      await API.post(`/courses/${selectedCourseId}/units`, { title: newUnitTitle })
      showMsg('تمت إضافة الوحدة!', 'success')
      setNewUnitTitle('')
      fetchCourseDetail(selectedCourseId)
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const handleUpdateUnit = async (unitId: string) => {
    if (!editingUnitTitle.trim() || !selectedCourseId) return
    try {
      await API.put(`/courses/${selectedCourseId}/units/${unitId}`, { title: editingUnitTitle })
      showMsg('تم تحديث الوحدة.', 'success')
      setEditingUnit(null)
      fetchCourseDetail(selectedCourseId)
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const handleDeleteUnit = async (unitId: string) => {
    if (!selectedCourseId || !window.confirm('حذف هذه الوحدة وكل محتواها؟')) return
    try {
      await API.delete(`/courses/${selectedCourseId}/units/${unitId}`)
      showMsg('تم حذف الوحدة.', 'success')
      fetchCourseDetail(selectedCourseId)
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  // ---------- Content ----------
  const handleAddContent = async (unitId: string) => {
    if (!selectedCourseId) return
    const { contentType, url, text, file } = newContentData
    if (contentType === 'link' && !url) { showMsg('يرجى إدخال رابط.', 'error'); return }
    if (contentType === 'text' && !text) { showMsg('يرجى إدخال نص.', 'error'); return }
    if ((contentType === 'video' || contentType === 'document') && !file) { showMsg('يرجى اختيار ملف.', 'error'); return }

    const contentFormData = new FormData()
    contentFormData.append('content_type', contentType)
    if (url) contentFormData.append('url', url)
    if (text) contentFormData.append('text', text)
    if (file) contentFormData.append('file', file)

    try {
      await API.post(`/courses/${selectedCourseId}/units/${unitId}/content`, contentFormData, { headers: { 'Content-Type': 'multipart/form-data' } })
      showMsg('تمت إضافة المحتوى!', 'success')
      setNewContentData({ contentType: 'video', url: '', text: '', file: null })
      setNewContentUnitId(null)
      fetchCourseDetail(selectedCourseId)
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const handleDeleteContent = async (unitId: string, contentId: string) => {
    if (!selectedCourseId || !window.confirm('حذف عنصر المحتوى هذا؟')) return
    try {
      await API.delete(`/courses/${selectedCourseId}/units/${unitId}/content/${contentId}`)
      showMsg('تم حذف المحتوى.', 'success')
      fetchCourseDetail(selectedCourseId)
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const toggleContent = async (contentId: string, content: ContentItem) => {
    if (expandedContent.has(contentId)) {
      if (contentBlobUrls[contentId]) {
        URL.revokeObjectURL(contentBlobUrls[contentId])
        setContentBlobUrls((prev) => { const next = { ...prev }; delete next[contentId]; return next })
      }
      setExpandedContent((prev) => { const next = new Set(prev); next.delete(contentId); return next })
      return
    }
    if (!selectedCourseId) return
    if (content.content_type === 'video' || content.content_type === 'document') {
      try {
        const response = await API.get(`/courses/${selectedCourseId}/content/${contentId}/file`, { responseType: 'blob' })
        const url = URL.createObjectURL(response.data)
        setContentBlobUrls((prev) => ({ ...prev, [contentId]: url }))
      } catch (err) {
        showMsg(getErrorMessage(err), 'error')
        return
      }
    }
    setExpandedContent((prev) => new Set(prev).add(contentId))
  }

  // ---------- Render ----------
  if (loading) {
    return (
      <div className="page-wrapper">
        <div style={{ display: 'grid', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
            {[1, 2, 3, 4].map((i) => <div key={i} className="glass" style={{ height: 100, opacity: 0.5 }} />)}
          </div>
          <div className="glass" style={{ height: 240, opacity: 0.5 }} />
        </div>
      </div>
    )
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="section-title">لوحة تحكم المدرّس</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>إدارة كورساتك ومحتواها وطلابك</p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }} onClick={handleCreateCourse}>
          + إنشاء كورس جديد
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 28 }}>
        {[
          { icon: '📚', label: 'الكورسات', value: String(stats.totalCourses), color: '#7c3aed' },
          { icon: '👥', label: 'إجمالي الطلاب', value: String(stats.totalStudents), color: '#06b6d4' },
          { icon: '⭐', label: 'متوسط التقييم', value: stats.avgRating.toFixed(1), color: '#f59e0b' },
          { icon: '✅', label: 'كورسات منشورة', value: String(stats.published), color: '#10b981' },
        ].map((m) => (
          <div key={m.label} className="metric-card">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${m.color}22`, border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>{m.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Course list */}
      <div className="glass" style={{ padding: 22, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>كورساتي</h3>
        {courses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>🏗️</div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5, margin: '0 0 16px' }}>لم تنشئ أي كورس بعد.</p>
            <button className="btn-primary" onClick={handleCreateCourse}>+ إنشاء أول كورس</button>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>عنوان الكورس</th>
                <th>الحالة</th>
                <th>الطلاب</th>
                <th>التقييم</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id}>
                  <td>{c.title}</td>
                  <td><span className={`badge ${statusBadgeClass[c.status || 'draft'] || 'badge-neutral'}`}>{statusLabels[c.status || 'draft'] || c.status}</span></td>
                  <td>{c.enrolledCount || 0}</td>
                  <td>{c.rating ? c.rating.toFixed(1) : '—'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={() => handleSelectCourse(c._id)}>
                      {selectedCourseId === c._id ? 'إغلاق' : 'إدارة'}
                    </button>
                    {(c.status === 'draft' || c.status === 'needs_revision') && (
                      <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={() => handleReviewAction(c._id, 'submit')}>
                        إرسال للمراجعة
                      </button>
                    )}
                    {c.status === 'pending_review' && (
                      <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12.5, color: '#f87171', borderColor: 'rgba(239,68,68,0.4)' }} onClick={() => handleReviewAction(c._id, 'cancel')}>
                        إلغاء المراجعة
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Management panel */}
      {selectedCourseId && detailLoading && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>...جارِ التحميل</p>}

      {selectedCourseId && courseDetail && (
        <div className="glass" style={{ padding: 22, border: '1px solid var(--border-hover)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>إدارة: {courseDetail.course.title}</h3>
            <div className="tab-bar">
              {(['details', 'units', 'quizzes', 'students'] as ManageTab[]).map((tab) => (
                <div key={tab} className={`tab-item${activeTab === tab ? ' active' : ''}`} onClick={() => setActiveTab(tab)}>
                  {tab === 'details' && 'التفاصيل'}
                  {tab === 'units' && 'الوحدات'}
                  {tab === 'quizzes' && 'الاختبارات'}
                  {tab === 'students' && 'الطلاب'}
                </div>
              ))}
            </div>
          </div>

          {/* Details tab */}
          {activeTab === 'details' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
                {!editMode ? (
                  <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => setEditMode(true)}>تعديل</button>
                ) : (
                  <>
                    <button className="btn-ghost" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => setEditMode(false)}>إلغاء</button>
                    <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={handleSaveDetails}>حفظ التغييرات</button>
                  </>
                )}
                <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13, color: '#f87171', borderColor: 'rgba(239,68,68,0.4)' }} onClick={handleDeleteCourse}>حذف الكورس</button>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label className="form-label">صورة الغلاف</label>
                <input type="file" accept="image/*" onChange={handleUploadCover} disabled={coverUploading} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }} />
                {coverUploading && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginRight: 10 }}>...جارِ الرفع</span>}
              </div>

              {!editMode ? (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 13.5, margin: '0 0 8px' }}><strong>الوصف:</strong> {courseDetail.course.description || '—'}</p>
                  <p style={{ fontSize: 13.5, margin: '0 0 8px' }}><strong>التصنيف:</strong> {courseDetail.course.category || '—'}</p>
                  <p style={{ fontSize: 13.5, margin: '0 0 8px' }}><strong>النوع:</strong> {courseDetail.course.course_type}</p>
                  <p style={{ fontSize: 13.5, margin: '0 0 8px' }}><strong>السعر:</strong> {courseDetail.course.price || 0} ر.س</p>
                  <p style={{ fontSize: 13.5, margin: '0 0 8px' }}><strong>متزامن:</strong> {courseDetail.course.is_synchronous ? 'نعم' : 'لا'}</p>
                  <p style={{ fontSize: 13.5, margin: 0 }}><strong>الحالة:</strong> <span className={`badge ${statusBadgeClass[courseDetail.course.status || 'draft'] || 'badge-neutral'}`}>{statusLabels[courseDetail.course.status || 'draft'] || courseDetail.course.status}</span></p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">عنوان الكورس</label>
                    <input className="form-input" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">الوصف</label>
                    <textarea className="form-input" rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} style={{ resize: 'none' }} />
                  </div>
                  <div>
                    <label className="form-label">التصنيف</label>
                    <input className="form-input" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">نوع الكورس</label>
                    <select className="form-input" value={formData.course_type} onChange={(e) => setFormData({ ...formData, course_type: e.target.value })}>
                      <option value="free">مجاني</option>
                      <option value="paid">مدفوع</option>
                    </select>
                  </div>
                  {formData.course_type === 'paid' && (
                    <div>
                      <label className="form-label">السعر (ر.س)</label>
                      <input className="form-input" type="number" min={0} value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} />
                    </div>
                  )}
                  <div>
                    <label className="form-label">الحد الأقصى للطلاب</label>
                    <input className="form-input" type="number" min={0} value={formData.max_students} onChange={(e) => setFormData({ ...formData, max_students: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">نسبة إتمام النجاح (%)</label>
                    <input className="form-input" type="number" min={0} max={100} value={Math.round(formData.completion_threshold * 100)} onChange={(e) => setFormData({ ...formData, completion_threshold: Number(e.target.value) / 100 })} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <label className="form-label" style={{ margin: 0 }}>كورس متزامن (بث مباشر)</label>
                    <div className={`toggle${formData.is_synchronous ? ' on' : ''}`} onClick={() => setFormData({ ...formData, is_synchronous: !formData.is_synchronous })} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Units tab */}
          {activeTab === 'units' && (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
                <input className="form-input" placeholder="عنوان الوحدة الجديدة" value={newUnitTitle} onChange={(e) => setNewUnitTitle(e.target.value)} style={{ flex: 1 }} />
                <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }} onClick={handleAddUnit}>+ إضافة وحدة</button>
              </div>

              {(!courseDetail.units || courseDetail.units.length === 0) ? (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5 }}>لا توجد وحدات بعد.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {courseDetail.units.map((unit: Unit) => (
                    <div key={unit._id} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        {editingUnit === unit._id ? (
                          <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                            <input className="form-input" value={editingUnitTitle} onChange={(e) => setEditingUnitTitle(e.target.value)} style={{ flex: 1 }} />
                            <button className="btn-primary" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => handleUpdateUnit(unit._id)}>حفظ</button>
                            <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setEditingUnit(null)}>إلغاء</button>
                          </div>
                        ) : (
                          <>
                            <h5 style={{ fontSize: 13.5, fontWeight: 700, margin: 0 }}>{unit.title}</h5>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => { setEditingUnit(unit._id); setEditingUnitTitle(unit.title) }}>تعديل</button>
                              <button className="btn-ghost" style={{ fontSize: 12, color: '#f87171' }} onClick={() => handleDeleteUnit(unit._id)}>حذف</button>
                              <button className="btn-ghost" style={{ fontSize: 12, color: '#a855f7' }} onClick={() => setNewContentUnitId(newContentUnitId === unit._id ? null : unit._id)}>
                                + محتوى
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {newContentUnitId === unit._id && (
                        <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: 14, marginBottom: 12 }}>
                          <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                            <select className="form-input" style={{ flex: '0 0 160px' }} value={newContentData.contentType} onChange={(e) => setNewContentData({ ...newContentData, contentType: e.target.value as ContentType })}>
                              <option value="video">🎥 فيديو</option>
                              <option value="document">📄 مستند</option>
                              <option value="link">🔗 رابط</option>
                              <option value="text">📝 نص</option>
                            </select>
                            {(newContentData.contentType === 'video' || newContentData.contentType === 'document') && (
                              <input type="file" onChange={(e) => setNewContentData({ ...newContentData, file: e.target.files?.[0] || null })} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }} />
                            )}
                            {newContentData.contentType === 'link' && (
                              <input className="form-input" placeholder="https://..." value={newContentData.url} onChange={(e) => setNewContentData({ ...newContentData, url: e.target.value })} style={{ flex: 1 }} />
                            )}
                          </div>
                          {newContentData.contentType === 'text' && (
                            <textarea className="form-input" rows={3} placeholder="محتوى النص..." value={newContentData.text} onChange={(e) => setNewContentData({ ...newContentData, text: e.target.value })} style={{ resize: 'none', marginBottom: 10 }} />
                          )}
                          <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 12.5 }} onClick={() => handleAddContent(unit._id)}>إضافة</button>
                        </div>
                      )}

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
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => toggleContent(content._id, content)}>
                                      {isExpanded ? 'إخفاء' : 'معاينة'}
                                    </button>
                                    <button className="btn-ghost" style={{ fontSize: 12, color: '#f87171' }} onClick={() => handleDeleteContent(unit._id, content._id)}>حذف</button>
                                  </div>
                                </div>
                                {isExpanded && (
                                  <div style={{ marginTop: 8, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }}>
                                    {content.content_type === 'video' && (
                                      <video controls style={{ width: '100%', maxHeight: 320, borderRadius: 8 }}>
                                        <source src={blobUrl} type={content.mime_type || 'video/mp4'} />
                                      </video>
                                    )}
                                    {content.content_type === 'document' && (
                                      content.mime_type === 'application/pdf' && blobUrl ? (
                                        <embed src={blobUrl} type="application/pdf" width="100%" height="420px" />
                                      ) : blobUrl ? (
                                        <p style={{ fontSize: 12.5 }}>معاينة غير متوفرة. <a href={blobUrl} download style={{ color: '#a855f7' }}>تحميل</a></p>
                                      ) : <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>...جارِ التحميل</p>
                                    )}
                                    {content.content_type === 'link' && (
                                      <a href={content.content_data?.url} target="_blank" rel="noopener noreferrer" style={{ color: '#a855f7', fontSize: 12.5 }}>{content.content_data?.url}</a>
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
              )}
            </div>
          )}

          {/* Quizzes tab */}
          {activeTab === 'quizzes' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13.5, margin: 0 }}>اختبارات هذا الكورس</p>
                <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13 }} onClick={() => navigate('quiz-creator')}>+ اختبار جديد</button>
              </div>
              {quizzesLoading ? (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>...جارِ التحميل</p>
              ) : quizzes.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5 }}>لا توجد اختبارات لهذا الكورس بعد.</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>العنوان</th><th>عدد الأسئلة</th></tr></thead>
                  <tbody>
                    {quizzes.map((q: any) => (
                      <tr key={q._id}><td>{q.title || 'اختبار'}</td><td>{q.questions?.length ?? '—'}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Students tab */}
          {activeTab === 'students' && (
            <div>
              {studentsLoading ? (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>...جارِ التحميل</p>
              ) : students.length === 0 ? (
                <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13.5 }}>لا يوجد طلاب مسجّلون في هذا الكورس بعد.</p>
              ) : (
                <table className="data-table">
                  <thead><tr><th>الاسم</th><th>البريد الإلكتروني</th><th>نسبة التقدم</th></tr></thead>
                  <tbody>
                    {students.map((s: any) => (
                      <tr key={s._id}>
                        <td>{s.user_id?.full_name || s.full_name || '—'}</td>
                        <td>{s.user_id?.email || s.email || '—'}</td>
                        <td>{s.progress_percentage != null ? `${Math.round(s.progress_percentage * 100)}%` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
