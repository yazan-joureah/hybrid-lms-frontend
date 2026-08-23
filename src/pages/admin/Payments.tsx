import { useEffect, useMemo, useRef, useState } from 'react'
import API from '../../config/api'

interface PaymentRecord {
  _id: string
  userId: string
  courseId: string
  amount: number
  currency: string
  status: string
  provider: string
  createdAt: string
}

const statusColors: Record<string, string> = {
  paid: '#10b981',
  pending: '#fbbf24',
  failed: '#f87171',
  refunded: '#a78bfa',
  cancelled: '#f59e0b',
  processing: '#60a5fa',
}

const statusLabels: Record<string, string> = {
  all: 'كل الحالات',
  paid: 'مدفوع',
  pending: 'قيد الانتظار',
  failed: 'فشل',
  refunded: 'مسترد',
  cancelled: 'ملغي',
  processing: 'قيد المعالجة',
}

const mockPayments: PaymentRecord[] = [
  {
    _id: 'mock_pay_1',
    userId: 'user_student_1',
    courseId: 'React المتقدم وإدارة الحالة',
    amount: 349,
    currency: 'SAR',
    status: 'paid',
    provider: 'stripe',
    createdAt: '2026-08-18T10:15:00.000Z',
  },
  {
    _id: 'mock_pay_2',
    userId: 'user_student_2',
    courseId: 'Python للتحليل المالي',
    amount: 299,
    currency: 'SAR',
    status: 'pending',
    provider: 'stripe',
    createdAt: '2026-08-18T09:40:00.000Z',
  },
  {
    _id: 'mock_pay_3',
    userId: 'user_student_3',
    courseId: 'أساسيات البرمجة',
    amount: 0,
    currency: 'SAR',
    status: 'refunded',
    provider: 'mock',
    createdAt: '2026-08-17T14:20:00.000Z',
  },
  {
    _id: 'mock_pay_4',
    userId: 'user_student_4',
    courseId: 'تطوير REST APIs',
    amount: 599,
    currency: 'SAR',
    status: 'failed',
    provider: 'stripe',
    createdAt: '2026-08-16T08:05:00.000Z',
  },
  {
    _id: 'mock_pay_5',
    userId: 'user_student_5',
    courseId: 'الذكاء الاصطناعي للمبتدئين',
    amount: 450,
    currency: 'SAR',
    status: 'processing',
    provider: 'stripe',
    createdAt: '2026-08-15T18:55:00.000Z',
  },
]

function formatAmount(value: number, currency = 'SAR') {
  const safeValue = Number(value || 0)
  return `${currency} ${safeValue.toLocaleString('en-US')}`
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('ar-EG', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function getProviderLabel(provider: string) {
  const value = provider?.toLowerCase?.() || ''
  if (value.includes('stripe')) return 'Stripe'
  if (value.includes('mock')) return 'Mock'
  return provider || '—'
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'paid':
      return 'badge badge-success'
    case 'pending':
      return 'badge badge-warning'
    case 'failed':
      return 'badge badge-danger'
    case 'refunded':
      return 'badge badge-primary'
    case 'processing':
      return 'badge badge-info'
    case 'cancelled':
      return 'badge badge-neutral'
    default:
      return 'badge badge-neutral'
  }
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
  icon,
}: {
  label: string
  value: string
  detail: string
  tone: 'primary' | 'success' | 'warning' | 'info' | 'danger' | 'purple'
  icon: string
}) {
  const toneMap: Record<string, string> = {
    primary: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(168,85,247,0.12))',
    success: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(34,197,94,0.06))',
    warning: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(250,204,21,0.06))',
    info: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(34,211,238,0.04))',
    danger: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.04))',
    purple: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(124,58,237,0.06))',
  }

  return (
    <div className="metric-card payments-summary-card" style={{ minHeight: 148 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div className="summary-icon" style={{ background: toneMap[tone] }}>{icon}</div>
      </div>
      <div className="summary-label">{label}</div>
      <div className="summary-value">{value}</div>
      <div className="summary-detail">{detail}</div>
    </div>
  )
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [providerFilter, setProviderFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusMenuOpen, setStatusMenuOpen] = useState(false)
  const statusMenuRef = useRef<HTMLDivElement | null>(null)

  const load = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await API.get('/admin/payments')
      setPayments(res.data?.data || [])
    } catch (err) {
      if (import.meta.env.DEV) {
        setPayments(mockPayments)
      } else {
        setError('تعذّر تحميل بيانات المدفوعات. حاول مرة أخرى.')
        setPayments([])
      }
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  const summary = useMemo(() => {
    const baseCurrency = payments.find((payment) => Number(payment.amount) > 0)?.currency || 'SAR'
    const paidTotal = payments.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const pendingTotal = payments.filter((payment) => payment.status === 'pending').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const refundedTotal = payments.filter((payment) => payment.status === 'refunded').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const failedTotal = payments.filter((payment) => payment.status === 'failed').reduce((sum, payment) => sum + Number(payment.amount || 0), 0)
    const totalRevenue = payments.filter((payment) => ['paid', 'processing'].includes(payment.status)).reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

    return {
      totalRevenue,
      paidTotal,
      pendingTotal,
      refundedTotal,
      failedTotal,
      paidCount: payments.filter((payment) => payment.status === 'paid').length,
      pendingCount: payments.filter((payment) => payment.status === 'pending').length,
      refundedCount: payments.filter((payment) => payment.status === 'refunded').length,
      failedCount: payments.filter((payment) => payment.status === 'failed').length,
      currency: baseCurrency,
    }
  }, [payments])

  const filtered = payments.filter((payment) => {
    const matchStatus = statusFilter === 'all' || payment.status === statusFilter
    const providerMatch = providerFilter === 'all' || payment.provider?.toLowerCase() === providerFilter
    const searchText = `${payment.userId} ${payment.courseId} ${getProviderLabel(payment.provider)}`.toLowerCase()
    const matchSearch = searchText.includes(search.toLowerCase())
    return matchStatus && providerMatch && matchSearch
  })

  const providerOptions = Array.from(new Set(payments.map((payment) => (payment.provider || '').toLowerCase()))).filter(Boolean)
  const providerOptionsList = ['all', ...providerOptions]
  const statusOptions = [
    { value: 'all', label: statusLabels.all },
    { value: 'paid', label: statusLabels.paid },
    { value: 'pending', label: statusLabels.pending },
    { value: 'refunded', label: statusLabels.refunded },
    { value: 'failed', label: statusLabels.failed },
    { value: 'processing', label: statusLabels.processing },
  ]

  const [providerMenuOpen, setProviderMenuOpen] = useState(false)
  const providerMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setStatusMenuOpen(false)
      }
      if (providerMenuRef.current && !providerMenuRef.current.contains(event.target as Node)) {
        setProviderMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="page-wrapper payments-admin-page" style={{ direction: 'rtl' }}>
      <style>{`
        /* Payments page visual polish - dark space theme */
        .payments-admin-page { --card-bg: rgba(18, 10, 42, 0.9); }
        .payments-admin-page .payments-shell {
          background: linear-gradient(180deg, rgba(10,4,30,0.72), rgba(8,3,30,0.6));
          border: 1px solid rgba(124, 58, 237, 0.16);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 20px 48px rgba(6, 3, 26, 0.6);
        }

        /* Header */
        .payments-admin-page .payments-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding-bottom: 14px;
          margin-bottom: 18px;
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .payments-admin-page .payments-header__title { display:flex; gap:14px; align-items:center }
        .payments-admin-page .payments-header__icon {
          width: 56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center;
          background: linear-gradient(135deg, rgba(124,58,237,0.24), rgba(168,85,247,0.12));
          border: 1px solid rgba(168,85,247,0.28); color:#efe6ff; box-shadow: 0 8px 24px rgba(124,58,237,0.12);
        }
        .payments-admin-page .payments-header__meta { margin-top:6px; color:var(--text-muted); font-size:13px }

        /* Summary grid */
        .payments-admin-page .payments-summary-grid { display:grid; grid-template-columns: repeat(5, minmax(160px, 1fr)); gap:14px; margin-bottom:20px }
        .payments-admin-page .payments-summary-card { padding: 14px; border-radius:14px; min-height:136px; background: rgba(22,8,54,0.72); border:1px solid rgba(124,58,237,0.08); }
        .payments-admin-page .summary-icon { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:18px; border:1px solid rgba(255,255,255,0.04); }
        .payments-admin-page .summary-label { color:var(--text-muted); font-size:13px; margin-top:8px }
        .payments-admin-page .summary-value { font-size:26px; font-weight:800; color:#fff; margin-top:6px }
        .payments-admin-page .summary-detail { color:rgba(255,255,255,0.5); font-size:12px; margin-top:6px }

        /* Toolbar */
        .payments-admin-page .payments-toolbar { display:flex; align-items:center; gap:12px; justify-content:space-between; flex-wrap:wrap; padding:12px; border-radius:12px; background:rgba(255,255,255,0.02); border:1px solid rgba(255,255,255,0.03) }
        .payments-admin-page .payments-toolbar__search { flex:1 1 320px; max-width:520px }
        .payments-admin-page .payments-toolbar__filters { display:flex; gap:10px; align-items:center; margin-inline-start:auto }

        /* Custom select / dropdown */
        .payments-admin-page .payments-status-trigger { padding:12px 16px; border-radius:12px; background:rgba(255,255,255,0.03); border:1.2px solid rgba(124,58,237,0.28); color:#fff; display:flex; gap:10px; align-items:center }
        .payments-admin-page .payments-status-trigger__arrow { font-size:12px; color:rgba(255,255,255,0.7); transition: transform .18s }
        .payments-admin-page .payments-status-trigger[aria-expanded='true'] .payments-status-trigger__arrow { transform:rotate(180deg) }
        .payments-admin-page .payments-status-menu { min-width:220px }
        .payments-admin-page .payments-status-option { text-align:right }

        /* Table / list */
        .payments-admin-page .payments-table-wrap { background: rgba(11,8,22,0.5); border-radius:16px; padding:8px; border:1px solid rgba(255,255,255,0.04); overflow:auto }
        .payments-admin-page .data-table { width:100%; border-collapse:collapse; min-width:900px }
        .payments-admin-page .data-table th { background: rgba(124,58,237,0.04); text-align:right; padding:12px 14px; font-size:12px; color:var(--text-muted) }
        .payments-admin-page .data-table td { padding:14px 14px; vertical-align:middle }
        .payments-admin-page .data-table tbody tr:hover td { background: rgba(124,58,237,0.035) }

        /* Provider badge */
        .payments-admin-page .payments-provider-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 12px; border-radius:999px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.04); color:var(--text-muted); font-weight:700 }
        .payments-admin-page .payments-provider-dot { width:9px; height:9px; border-radius:50%; box-shadow:0 0 0 4px rgba(168,85,247,0.08) }

        /* Amount */
        .payments-admin-page .payments-amount { font-weight:800; color:#fff }

        /* Action button */
        .payments-admin-page .payments-action-btn { padding:8px 14px; border-radius:10px; font-size:13px }

        /* Empty / error / loading */
        .payments-admin-page .payments-empty-state { padding:36px; border-radius:16px; text-align:center }
        .payments-admin-page .payments-empty-state__icon { width:56px; height:56px; border-radius:14px; display:flex; align-items:center; justify-content:center; background:rgba(124,58,237,0.12); border:1px solid rgba(124,58,237,0.24); font-size:26px }
        .payments-admin-page .payments-skeleton { display:grid; gap:12px; padding:8px }

        /* Responsive */
        @media (max-width:1100px) { .payments-admin-page .payments-summary-grid { grid-template-columns: repeat(2, minmax(160px, 1fr)) } }
        @media (max-width:760px) {
          .payments-admin-page .payments-shell { padding:14px }
          .payments-admin-page .payments-header { flex-direction:column; align-items:flex-start }
          .payments-admin-page .payments-toolbar { padding:10px }
          .payments-admin-page .payments-summary-grid { grid-template-columns: 1fr }
          .payments-admin-page .data-table { min-width:720px }
        }

      `}</style>

      <div className="payments-shell">
        <div className="payments-header">
          <div className="payments-header__title">
            <div className="payments-header__icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7.5C4 6.67 4.67 6 5.5 6H18.5C19.33 6 20 6.67 20 7.5V16.5C20 17.33 19.33 18 18.5 18H5.5C4.67 18 4 17.33 4 16.5V7.5Z" stroke="currentColor" strokeWidth="1.6"/>
                <path d="M4 10H20M8 14H12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h2 className="section-title" style={{ margin: 0 }}>إدارة المدفوعات</h2>
              <p className="payments-header__meta">مراجعة جميع عمليات الدفع وطلبات الاسترداد</p>
            </div>
          </div>
        </div>

        <div className="payments-summary-grid">
          <SummaryCard label="إجمالي المدفوعات" value={formatAmount(summary.totalRevenue, summary.currency)} detail={`${payments.length} عمليات`} tone="primary" icon="💰" />
          <SummaryCard label="المدفوع" value={formatAmount(summary.paidTotal, summary.currency)} detail={`${summary.paidCount} دفعة`} tone="success" icon="✅" />
          <SummaryCard label="قيد الانتظار" value={formatAmount(summary.pendingTotal, summary.currency)} detail={`${summary.pendingCount} في الانتظار`} tone="warning" icon="⏳" />
          <SummaryCard label="المسترد" value={formatAmount(summary.refundedTotal, summary.currency)} detail={`${summary.refundedCount} مستردة`} tone="purple" icon="↩️" />
          <SummaryCard label="الفاشلة" value={formatAmount(summary.failedTotal, summary.currency)} detail={`${summary.failedCount} فاشلة`} tone="danger" icon="⚠️" />
        </div>

        <div className="payments-toolbar">
          <div className="payments-toolbar__search">
            <input
              className="form-input"
              placeholder="ابحث عن الطالب أو الدورة..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="بحث عن الطالب أو الدورة"
            />
          </div>

          <div className="payments-toolbar__filters">
            <div className="payments-status-dropdown" ref={statusMenuRef}>
              <button
                type="button"
                className="payments-status-trigger"
                aria-haspopup="listbox"
                aria-expanded={statusMenuOpen}
                aria-label="فلتر الحالة"
                onClick={() => setStatusMenuOpen((open) => !open)}
              >
                <span className="payments-status-trigger__label">{statusLabels[statusFilter] || statusLabels.all}</span>
                <span className="payments-status-trigger__arrow">▾</span>
              </button>

              {statusMenuOpen && (
                <div className="payments-status-menu" role="listbox" aria-label="حالات الدفع">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="option"
                      aria-selected={statusFilter === option.value}
                      className={`payments-status-option ${statusFilter === option.value ? 'payments-status-option--selected' : ''}`}
                      onClick={() => {
                        setStatusFilter(option.value)
                        setStatusMenuOpen(false)
                      }}
                    >
                      <span>{option.label}</span>
                      <span className="payments-status-option__check">{statusFilter === option.value ? '✓' : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="payments-status-dropdown" ref={providerMenuRef}>
              <button
                type="button"
                className="payments-status-trigger"
                aria-haspopup="listbox"
                aria-expanded={providerMenuOpen}
                aria-label="فلتر المزود"
                onClick={() => setProviderMenuOpen((open) => !open)}
              >
                <span className="payments-status-trigger__label">{providerFilter === 'all' ? 'جميع مزودي الدفع' : getProviderLabel(providerFilter)}</span>
                <span className="payments-status-trigger__arrow">▾</span>
              </button>

              {providerMenuOpen && (
                <div className="payments-status-menu" role="listbox" aria-label="مزودو الدفع">
                  {providerOptionsList.map((provider) => (
                    <button
                      key={provider}
                      type="button"
                      role="option"
                      aria-selected={providerFilter === provider}
                      className={`payments-status-option ${providerFilter === provider ? 'payments-status-option--selected' : ''}`}
                      onClick={() => {
                        setProviderFilter(provider)
                        setProviderMenuOpen(false)
                      }}
                    >
                      <span>{provider === 'all' ? 'جميع مزودي الدفع' : getProviderLabel(provider)}</span>
                      <span className="payments-status-option__check">{providerFilter === provider ? '✓' : ''}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="payments-skeleton" aria-live="polite">
            <div className="payments-skeleton__row" />
            <div className="payments-skeleton__row" />
            <div className="payments-skeleton__row" />
          </div>
        ) : error ? (
          <div className="payments-empty-state" role="alert">
            <div className="payments-empty-state__icon" aria-hidden="true">⚠️</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>تعذّر تحميل البيانات</div>
            <div style={{ color: 'rgba(255,255,255,0.65)', maxWidth: 420 }}>{error}</div>
            <button className="btn-primary" onClick={() => void load()} style={{ marginTop: 10 }}>إعادة المحاولة</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="payments-empty-state">
            <div className="payments-empty-state__icon" aria-hidden="true">📊</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>لا توجد عمليات دفع</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 420 }}>لا توجد نتائج تطابق البحث أو فلتر الحالة الحالي.</div>
          </div>
        ) : (
          <div className="payments-table-wrap">
            <table className="data-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>الطالب</th>
                  <th>الدورة</th>
                  <th>المبلغ</th>
                  <th>مزود الدفع</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => (
                  <tr key={payment._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{payment.userId}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{payment.courseId}</div>
                    </td>
                    <td>
                      <div className="payments-amount">{formatAmount(payment.amount, payment.currency)}</div>
                    </td>
                    <td>
                      <span className="payments-provider-badge">
                        <span className="payments-provider-dot" aria-hidden="true" />
                        {getProviderLabel(payment.provider)}
                      </span>
                    </td>
                    <td>
                      <span className={getStatusBadgeClass(payment.status)} style={{ background: `${statusColors[payment.status] || '#a855f7'}22`, color: statusColors[payment.status] || '#c4b5fd' }}>
                        {statusLabels[payment.status] || payment.status}
                      </span>
                    </td>
                    <td style={{ color: 'rgba(255,255,255,0.7)' }}>{formatDate(payment.createdAt)}</td>
                    <td>
                      <button
                        className="payments-action-btn btn-outline"
                        onClick={() => {
                          window.location.href = `/admin/payments/${payment._id}`
                        }}
                      >
                        التفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
