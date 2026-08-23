import { useEffect, useState } from 'react'
import API from '../../config/api'

interface PaymentTransaction {
  _id: string
  amount: number
  currency: string
  status: string
  createdAt: string
  provider: string
  courseId?: string
}

const statusColors: Record<string, string> = {
  paid: '#10b981',
  pending: '#fbbf24',
  failed: '#f87171',
  refunded: '#a78bfa',
  cancelled: '#f59e0b',
  processing: '#60a5fa',
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.get('/payments/my-transactions')
        setTransactions(res.data?.data || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const visibleTransactions = statusFilter === 'all'
    ? transactions
    : transactions.filter((payment) => payment.status === statusFilter)

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>معاملاتي</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', margin: '6px 0 0' }}>سجل المدفوعات والشراءات</p>
        </div>
        <select className="form-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="all">كل الحالات</option>
          <option value="paid">مدفوع</option>
          <option value="pending">قيد الانتظار</option>
          <option value="failed">فشل</option>
          <option value="refunded">مسترد</option>
        </select>
      </div>

      {loading ? (
        <div className="card-surface" style={{ padding: 20 }}>جارٍ تحميل المعاملات...</div>
      ) : visibleTransactions.length === 0 ? (
        <div className="card-surface" style={{ padding: 28, textAlign: 'center', color: 'rgba(255,255,255,0.6)' }}>
          لا توجد معاملات حتى الآن.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {visibleTransactions.map((item) => (
            <div key={item._id} className="card-surface" style={{ padding: 18, display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 0.8fr 0.8fr', gap: 14, alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16 }}>دورة رقم {item.courseId || item._id}</div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, marginTop: 6 }}>{new Date(item.createdAt).toLocaleString('ar-EG')}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>المبلغ</div>
                <div style={{ fontWeight: 700 }}>{Number(item.amount).toLocaleString()} {item.currency}</div>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>الحالة</div>
                <span className="badge" style={{ background: `${statusColors[item.status] || '#a855f7'}22`, color: statusColors[item.status] || '#a855f7', border: `1px solid ${statusColors[item.status] || '#a855f7'}66` }}>
                  {item.status}
                </span>
              </div>
              <div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12 }}>المعرف</div>
                <div style={{ fontSize: 12, wordBreak: 'break-all' }}>{item._id}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
