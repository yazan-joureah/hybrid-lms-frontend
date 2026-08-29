// src/pages/payments/admin/AdminPayments.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNav } from '../../../context/NavContext'
import { useToast } from '../../../context/ToastContext'
import { payService, PLATFORM_CURRENCY, getCourseTitle, getStudentLabel, type Payment } from '../../../services/payService'
import { getErrorMessage } from '../../../utils/errorMessages'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { ADMIN_PAYMENT_DETAIL_PATH } from '../../../routes/dynamicRoutes'

const STATUS_COLORS: Record<string, string> = {
    paid: '#10b981',
    pending: '#fbbf24',
    failed: '#f87171',
    refunded: '#a78bfa',
}

const STATUS_LABELS: Record<string, string> = {
    all: 'كل الحالات',
    paid: 'مدفوع',
    pending: 'قيد الانتظار',
    failed: 'فشل',
    refunded: 'مسترد',
}

function formatAmount(value: number, currency = PLATFORM_CURRENCY) {
    return `${Number(value || 0).toLocaleString()} ${currency}`
}

function formatDate(dateString: string) {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return '—'
    return new Intl.DateTimeFormat('ar-EG', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

function SummaryCard({ label, value, detail, tone, icon }: { label: string; value: string; detail: string; tone: string; icon: string }) {
    const toneMap: Record<string, string> = {
        primary: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(168,85,247,0.12))',
        success: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(34,197,94,0.06))',
        warning: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(250,204,21,0.06))',
        danger: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(249,115,22,0.04))',
        purple: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(124,58,237,0.06))',
    }
    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16, minHeight: 130 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, background: toneMap[tone], marginBottom: 10 }}>{icon}</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12.5 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginTop: 4 }}>{value}</div>
            <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11.5, marginTop: 4 }}>{detail}</div>
        </div>
    )
}

export default function AdminPayments() {
    const { navigate } = useNav()
    const routerNavigate = useNavigate()
    const { error: toastError } = useToast()

    const [payments, setPayments] = useState<Payment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [search, setSearch] = useState('')
    const debouncedSearch = useDebouncedValue(search, 350)
    const [statusFilter, setStatusFilter] = useState('all')
    const [statusMenuOpen, setStatusMenuOpen] = useState(false)
    const statusMenuRef = useRef<HTMLDivElement | null>(null)

    const load = async () => {
        setLoading(true)
        setError(null)
        try {
            setPayments(await payService.adminListPayments())
        } catch (err) {
            setError(getErrorMessage(err))
            setPayments([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { void load() }, [])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) setStatusMenuOpen(false)
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const summary = useMemo(() => {
        const baseCurrency = payments.find(p => Number(p.amount) > 0)?.currency || PLATFORM_CURRENCY
        const sum = (status: string) => payments.filter(p => p.status === status).reduce((s, p) => s + Number(p.amount || 0), 0)
        const count = (status: string) => payments.filter(p => p.status === status).length
        return {
            currency: baseCurrency,
            totalRevenue: sum('paid'),
            paidTotal: sum('paid'), paidCount: count('paid'),
            pendingTotal: sum('pending'), pendingCount: count('pending'),
            refundedTotal: sum('refunded'), refundedCount: count('refunded'),
            failedTotal: sum('failed'), failedCount: count('failed'),
        }
    }, [payments])

    const filtered = useMemo(() => payments.filter(p => {
        const matchStatus = statusFilter === 'all' || p.status === statusFilter
        const courseTitle = getCourseTitle(p.course_id)
        const studentName = getStudentLabel(p.student_id)
        const searchText = `${studentName} ${courseTitle}`.toLowerCase()
        const matchSearch = searchText.includes(debouncedSearch.toLowerCase())
        return matchStatus && matchSearch
    }), [payments, statusFilter, debouncedSearch])

    const statusOptions = ['all', 'paid', 'pending', 'refunded', 'failed']

    const openDetail = (paymentId: string) => {
        routerNavigate(ADMIN_PAYMENT_DETAIL_PATH(paymentId))
    }

    return (
        <div className="page-wrapper" style={{ direction: 'rtl' }}>
            <style>{`
        @keyframes admin-payments-fade { from { opacity:0; transform: translateY(4px); } to { opacity:1; transform: translateY(0); } }
        .admin-payments-row { animation: admin-payments-fade 0.2s ease-out; }
        .admin-payments-dropdown-menu {
          position: absolute; top: calc(100% + 6px); z-index: 20; min-width: 200px;
          background: rgba(12,4,45,0.98); border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px; padding: 6px; box-shadow: 0 12px 32px rgba(0,0,0,0.4);
        }
        .admin-payments-dropdown-option {
          width: 100%; text-align: right; padding: 9px 12px; border-radius: 8px; border: none;
          background: transparent; color: #fff; font-size: 13px; cursor: pointer; font-family: inherit;
          display: flex; justify-content: space-between;
        }
        .admin-payments-dropdown-option:hover { background: rgba(124,58,237,0.15); }
      `}</style>

            <div style={{ marginBottom: 22 }}>
                <h2 className="section-title">إدارة المدفوعات</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>مراجعة جميع عمليات الدفع على المنصة</p>
            </div>

            <div className="admin-summary-grid">
                <SummaryCard label="إجمالي المدفوع" value={formatAmount(summary.totalRevenue, summary.currency)} detail={`${summary.paidCount} عملية`} tone="primary" icon="💰" />
                <SummaryCard label="قيد الانتظار" value={formatAmount(summary.pendingTotal, summary.currency)} detail={`${summary.pendingCount} بانتظار التأكيد`} tone="warning" icon="⏳" />
                <SummaryCard label="المسترد" value={formatAmount(summary.refundedTotal, summary.currency)} detail={`${summary.refundedCount} مستردة`} tone="purple" icon="↩️" />
                <SummaryCard label="الفاشلة" value={formatAmount(summary.failedTotal, summary.currency)} detail={`${summary.failedCount} فاشلة`} tone="danger" icon="⚠️" />
            </div>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, marginBottom: 18 }}>
                <input
                    className="form-input"
                    style={{ flex: '1 1 280px' }}
                    placeholder="🔍 ابحث عن طالب أو دورة..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />

                <div style={{ position: 'relative' }} ref={statusMenuRef}>
                    <button type="button" className="btn-outline" onClick={() => setStatusMenuOpen(o => !o)}>
                        {STATUS_LABELS[statusFilter]} ▾
                    </button>
                    {statusMenuOpen && (
                        <div className="admin-payments-dropdown-menu">
                            {statusOptions.map(opt => (
                                <button key={opt} className="admin-payments-dropdown-option" onClick={() => { setStatusFilter(opt); setStatusMenuOpen(false) }}>
                                    <span>{STATUS_LABELS[opt]}</span>{statusFilter === opt && <span>✓</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ display: 'grid', gap: 12 }}>
                    {[1, 2, 3].map(i => <div key={i} style={{ height: 56, borderRadius: 12, background: 'var(--bg-card)', border: '1px solid var(--border)' }} />)}
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.6)' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
                    <div style={{ marginBottom: 14 }}>{error}</div>
                    <button className="btn-primary" onClick={() => void load()}>إعادة المحاولة</button>
                </div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>📊</div>
                    <div>لا توجد نتائج تطابق البحث أو الفلتر الحالي.</div>
                </div>
            ) : (
                <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 8 }}>
                    <table className="data-table" style={{ width: '100%', minWidth: 800 }}>
                        <thead>
                            <tr><th>الطالب</th><th>الدورة</th><th>المبلغ</th><th>الحالة</th><th>التاريخ</th><th></th></tr>
                        </thead>
                        <tbody>
                            {filtered.map(p => {
                                const studentLabel = getStudentLabel(p.student_id)
                                const courseTitle = getCourseTitle(p.course_id)
                                const color = STATUS_COLORS[p.status] || '#a855f7'
                                return (
                                    <tr key={p._id} className="admin-payments-row">
                                        <td style={{ fontWeight: 600 }}>{studentLabel}</td>
                                        <td>{courseTitle}</td>
                                        <td style={{ fontWeight: 700 }}>{formatAmount(p.amount, p.currency)}</td>
                                        <td>
                                            <span className="badge" style={{ background: `${color}22`, color, border: `1px solid ${color}66` }}>
                                                {STATUS_LABELS[p.status] || p.status}
                                            </span>
                                        </td>
                                        <td style={{ color: 'rgba(255,255,255,0.55)' }}>{formatDate(p.createdAt)}</td>
                                        <td>
                                            <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12.5 }} onClick={() => openDetail(p._id)}>
                                                التفاصيل
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}