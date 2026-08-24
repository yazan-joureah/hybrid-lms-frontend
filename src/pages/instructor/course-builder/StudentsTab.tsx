// src/pages/instructor/course-builder/StudentsTab.tsx
import { useState, useMemo } from 'react'
import type { useCourseStudents } from '../../../hooks/course/useCourseStudents'
import { EmptyState } from '../../../components/common/EmptyState'
import { SkeletonLoader } from '../../../components/common/Loading'

type StudentsTabProps = ReturnType<typeof useCourseStudents>

const STATUS_META: Record<string, { label: string; color: string }> = {
    active: { label: 'نشط', color: '#34d399' },
    completed: { label: 'مكتمل', color: '#a855f7' },
    pending_payment: { label: 'بانتظار الدفع', color: '#fbbf24' },
    cancelled: { label: 'ملغى', color: '#94a3b8' },
}

export function StudentsTab({ students, loading }: StudentsTabProps) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<'all' | string>('all')

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase()
        return students.filter(s => {
            const matchesStatus = statusFilter === 'all' || s.status === statusFilter
            const matchesSearch = !term
                || s.student_id?.full_name?.toLowerCase().includes(term)
                || s.student_id?.email?.toLowerCase().includes(term)
            return matchesStatus && matchesSearch
        })
    }, [students, search, statusFilter])

    if (loading) return <SkeletonLoader type="row" count={4} />

    if (students.length === 0) {
        return <EmptyState icon="👥" title="لا يوجد طلاب مسجّلون بعد" description="بمجرد تسجيل أول طالب بهذا الكورس، سيظهر هنا." />
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                <input
                    className="form-input"
                    placeholder="🔍 ابحث بالاسم أو البريد الإلكتروني..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ flex: '1 1 240px' }}
                />
                <select className="form-input" style={{ width: 180 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">كل الحالات</option>
                    <option value="active">نشط</option>
                    <option value="completed">مكتمل</option>
                    <option value="pending_payment">بانتظار الدفع</option>
                    <option value="cancelled">ملغى</option>
                </select>
                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', marginRight: 'auto' }}>
                    {filtered.length} من {students.length} طالب
                </span>
            </div>

            {filtered.length === 0 ? (
                <div style={{ padding: '30px 0', textAlign: 'center', fontSize: 13.5, color: 'rgba(255,255,255,0.4)' }}>
                    لا يوجد طلاب مطابقون لبحثك.
                </div>
            ) : (
                <table className="data-table" style={{ width: '100%' }}>
                    <thead>
                        <tr>
                            <th>الطالب</th>
                            <th>البريد الإلكتروني</th>
                            <th>تاريخ التسجيل</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(s => {
                            const meta = STATUS_META[s.status] || { label: s.status, color: 'rgba(255,255,255,0.5)' }
                            return (
                                <tr key={s._id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                                                {(s.student_id?.full_name || '؟')[0]}
                                            </div>
                                            <span>{s.student_id?.full_name || 'طالب محذوف'}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{s.student_id?.email || '—'}</td>
                                    <td style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(s.enrolled_at).toLocaleDateString('ar')}</td>
                                    <td>
                                        <span className="badge" style={{ background: `${meta.color}22`, color: meta.color, border: `1px solid ${meta.color}44` }}>
                                            {meta.label}
                                        </span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            )}
        </div>
    )
}