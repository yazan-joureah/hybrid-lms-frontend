import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import API from '../../config/api'

interface CourseSummary {
  _id: string
  title: string
  description?: string
  thumbnail?: string
  instructor_name?: string
  instructor_id?: string
  price?: number
  currency?: string
  isPaid?: boolean
}

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [course, setCourse] = useState<CourseSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const courseId = searchParams.get('courseId') || 'course_paid_1'

  useEffect(() => {
    const loadCourse = async () => {
      try {
        const res = await API.get(`/courses/${courseId}`)
        setCourse(res.data?.data || null)
      } catch (err: any) {
        setError(err?.response?.data?.message || 'تعذر تحميل تفاصيل الدورة.')
      } finally {
        setLoading(false)
      }
    }

    void loadCourse()
  }, [courseId])

  const discount = 0
  const subtotal = Number(course?.price || 0)
  const finalAmount = subtotal - discount

  const paymentMethods = useMemo(() => [
    { name: 'بطاقة ائتمان/خصم', type: 'card', enabled: true },
    { name: 'Apple Pay', type: 'wallet', enabled: false },
    { name: 'بطاقة مدى', type: 'card', enabled: false },
  ], [])

  const handlePayNow = async () => {
    if (!course) return
    setSubmitting(true)
    setError('')

    try {
      const res = await API.post('/payments/create-checkout-session', { courseId: course._id })
      const data = res.data?.data
      if (data?.url) {
        window.location.href = data.url
        return
      }
      navigate('/student/payments/success', { replace: true })
    } catch (err: any) {
      setError(err?.response?.data?.message || 'فشل إنشاء جلسة الدفع.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="page-wrapper"><div className="card-surface" style={{ padding: 24 }}>جارٍ تحميل تفاصيل الدفع...</div></div>
  }

  if (!course) {
    return <div className="page-wrapper"><div className="card-surface" style={{ padding: 24 }}>تعذر العثور على الدورة.</div></div>
  }

  return (
    <div className="page-wrapper" style={{ maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 26 }}>
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button className="btn-outline" onClick={() => navigate('/student/courses')} style={{ padding: '8px 14px' }}>
              ← العودة للمتجر
            </button>
            <h2 className="section-title" style={{ margin: 0 }}>إتمام الدفع</h2>
          </div>

          <div style={{ display: 'flex', gap: 18, marginBottom: 22, alignItems: 'center' }}>
            <img src={course.thumbnail || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=180&h=130&fit=crop'} alt={course.title} style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 12 }} />
            <div>
              <div className="badge badge-primary" style={{ marginBottom: 8 }}>دورة مدفوعة</div>
              <h3 style={{ margin: 0, fontSize: 22 }}>{course.title}</h3>
              <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>المدرس: {course.instructor_name || 'مدرس غير محدد'}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14, marginBottom: 18 }}>
            <div className="field-label">معلومات الطالب</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="field-label">اسم الطالب</label>
                <input className="form-input" value="محمد الطالب" readOnly />
              </div>
              <div className="form-group">
                <label className="field-label">البريد الإلكتروني</label>
                <input className="form-input" value="student@lms.test" readOnly />
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div className="field-label" style={{ marginBottom: 10 }}>طريقة الدفع</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {paymentMethods.map((method) => (
                              <label key={`${method.type}-${method.name}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 14px', opacity: method.enabled ? 1 : 0.5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="radio" checked={method.type === 'card'} readOnly />
                    <span>{method.name}</span>
                  </div>
                  {method.enabled ? <span className="badge badge-success">متاح</span> : <span className="badge badge-neutral">قريباً</span>}
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ color: '#fca5a5', marginBottom: 12, background: 'rgba(127,29,29,0.35)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 10, padding: '10px 12px' }}>
              {error}
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px 18px', fontSize: 16 }} onClick={handlePayNow} disabled={submitting}>
            {submitting ? 'جاري تجهيز الدفع...' : 'إكمال الشراء الآن'}
          </button>
        </div>

        <aside className="card-surface" style={{ padding: 20, height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, marginBottom: 18 }}>ملخص الطلب</h3>
          <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>سعر الدورة</span><strong>{subtotal.toLocaleString()} {course.currency || 'SAR'}</strong></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>الخصم</span><strong>-{discount.toLocaleString()} {course.currency || 'SAR'}</strong></div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800 }}>
              <span>الإجمالي</span>
              <span style={{ color: '#a855f7' }}>{finalAmount.toLocaleString()} {course.currency || 'SAR'}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 12 }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>الطلب</div>
            <div style={{ fontWeight: 700 }}>{course.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>{course.description}</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
