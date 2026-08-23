import { useEffect, useState } from 'react'
import API from '../../config/api'

interface PaymentTransaction {
  _id: string
  amount: number
  currency: string
  status: string
  createdAt: string
}

export default function BillingPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [payments, courses] = await Promise.all([
          API.get('/payments/my-transactions'),
          API.get('/courses/enrollments/my-courses'),
        ])
        setTransactions(payments.data?.data || [])
        setEnrolledCourses(courses.data?.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <div className="page-wrapper">
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>
        <div>
          <div className="card-surface" style={{ padding: 20, marginBottom: 20 }}>
            <h3 style={{ marginTop: 0 }}>طريقة الدفع</h3>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700 }}>بطاقة Stripe</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>يدير Stripe بيانات الدفع عبر صفحة عميلة آمنة، ولا يتم تخزين أي بيانات بطاقات داخل التطبيق.</div>
            </div>
          </div>

          <div className="card-surface" style={{ padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>المعاملات الأخيرة</h3>
            {loading ? 'جارٍ التحميل...' : transactions.length === 0 ? 'لا توجد معاملات.' : (
              <div style={{ display: 'grid', gap: 12 }}>
                {transactions.slice(0, 5).map((payment) => (
                  <div key={payment._id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{payment._id}</div>
                      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>{new Date(payment.createdAt).toLocaleString('ar-EG')}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontWeight: 700 }}>{Number(payment.amount).toLocaleString()} {payment.currency}</div>
                      <div style={{ color: payment.status === 'paid' ? '#10b981' : '#fbbf24' }}>{payment.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card-surface" style={{ padding: 20 }}>
          <h3 style={{ marginTop: 0 }}>الدورات المشتراة</h3>
          {loading ? 'جارٍ التحميل...' : enrolledCourses.length === 0 ? 'لا توجد دورات مفعلة.' : (
            <div style={{ display: 'grid', gap: 12 }}>
              {enrolledCourses.map((course) => (
                <div key={course._id} style={{ background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 10 }}>
                  <div style={{ fontWeight: 700 }}>{course.course_id?.title || 'دورة'}</div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{course.course_id?.category || 'دورة'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
