// src/pages/admin/accounts/AdminAccountsList.tsx
import { useState } from 'react'
import { useAdminAccounts } from '../../../hooks/admin/useAdminAccounts'
import { AccountReasonModal } from './AccountReasonModal'
import { CreateAdminModal } from './CreateAdminModal'
import { SkeletonLoader } from '../../../components/common/Loading'
import type { AdminAccountListItem, AccountStatusAction } from '../../../services/adminAccountService'

const ROLE_LABELS: Record<string, string> = {
    Student: 'طالب', Instructor: 'مدرّس', Admin: 'مشرف', SuperAdmin: 'مشرف عام',
}
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    active: { label: 'نشط', color: '#10b981' },
    suspended: { label: 'موقوف', color: '#f59e0b' },
    deleted: { label: 'محذوف', color: '#ef4444' },
    temporary_locked: { label: 'مقفل مؤقتاً', color: '#f59e0b' },
    pending_email_verification: { label: 'بانتظار تفعيل البريد', color: '#94a3b8' },
    guardian_pending: { label: 'بانتظار موافقة ولي الأمر', color: '#94a3b8' },
}

interface Props {
    currentUserId: string | null
    actorRole: 'Admin' | 'SuperAdmin'
}

type PendingAction = { type: 'suspend' | 'activate' | 'delete'; account: AdminAccountListItem } | null

export function AdminAccountsList({ currentUserId, actorRole }: Props) {
    const {
        items, total, page, pageSize, loading, actingId,
        roleFilter, setRoleFilter, statusFilter, setStatusFilter, search, setSearch,
        goToPage, setStatus, deleteAccount, restoreAccount, createAdmin,
    } = useAdminAccounts()

    const [pendingAction, setPendingAction] = useState<PendingAction>(null)
    const [createOpen, setCreateOpen] = useState(false)
    const [creating, setCreating] = useState(false)

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    // ⚠️ يعكس بالضبط منطق assertCanManageTarget بالباك اند (manageAccounts.service.js):
    // ما حدا فيه يدير حساب SuperAdmin، وما حدا غير SuperAdmin فيه يدير حساب Admin،
    // وما حدا فيه يدير حسابه هو نفسه من هالصفحة.
    const canManage = (account: AdminAccountListItem) => {
        if (account._id === currentUserId) return false
        if (account.role === 'SuperAdmin') return false
        if (account.role === 'Admin' && actorRole !== 'SuperAdmin') return false
        return true
    }

    const handleConfirmAction = async (reason: string) => {
        if (!pendingAction) return
        const { type, account } = pendingAction
        const ok = type === 'delete'
            ? await deleteAccount(account._id, reason)
            : await setStatus(account._id, type as AccountStatusAction, reason)
        if (ok) setPendingAction(null)
    }

    const handleCreateAdmin = async (email: string, fullName: string) => {
        setCreating(true)
        const result = await createAdmin(email, fullName)
        setCreating(false)
        return result
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
                <input
                    className="form-input"
                    style={{ flex: '1 1 240px' }}
                    placeholder="🔍 ابحث بالاسم أو البريد الإلكتروني..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select className="form-input" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                    <option value="">كل الأدوار</option>
                    <option value="Student">طالب</option>
                    <option value="Instructor">مدرّس</option>
                    <option value="Admin">مشرف</option>
                    <option value="SuperAdmin">مشرف عام</option>
                </select>
                <select className="form-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">كل الحالات</option>
                    <option value="active">نشط</option>
                    <option value="suspended">موقوف</option>
                    <option value="deleted">محذوف</option>
                    <option value="temporary_locked">مقفل مؤقتاً</option>
                </select>
                {actorRole === 'SuperAdmin' && (
                    <button className="btn-primary" onClick={() => setCreateOpen(true)}>➕ إنشاء حساب مشرف</button>
                )}
            </div>

            {loading ? (
                <SkeletonLoader type="row" count={5} />
            ) : items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.4)' }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
                    <div>لا توجد حسابات تطابق البحث أو الفلتر الحالي.</div>
                </div>
            ) : (
                <div style={{ overflowX: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 8 }}>
                    <table className="data-table" style={{ width: '100%', minWidth: 900 }}>
                        <thead>
                            <tr>
                                <th>الاسم</th><th>البريد الإلكتروني</th><th>الدور</th><th>الحالة</th>
                                <th>MFA</th><th>تاريخ الإنشاء</th><th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(acc => {
                                const statusMeta = STATUS_LABELS[acc.status] || { label: acc.status, color: '#94a3b8' }
                                const manageable = canManage(acc)
                                const isActing = actingId === acc._id
                                return (
                                    <tr key={acc._id}>
                                        <td style={{ fontWeight: 600 }}>{acc.full_name}</td>
                                        <td>{acc.email}</td>
                                        <td>{ROLE_LABELS[acc.role] || acc.role}</td>
                                        <td>
                                            <span className="badge" style={{ background: `${statusMeta.color}22`, color: statusMeta.color, border: `1px solid ${statusMeta.color}44` }}>
                                                {statusMeta.label}
                                            </span>
                                        </td>
                                        <td>{acc.mfa_enabled ? '✅' : '—'}</td>
                                        <td style={{ color: 'rgba(255,255,255,0.55)' }}>{new Date(acc.created_at).toLocaleDateString('ar')}</td>
                                        <td>
                                            {!manageable ? (
                                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>—</span>
                                            ) : acc.status === 'deleted' ? (
                                                <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 12 }} disabled={isActing} onClick={() => restoreAccount(acc._id)}>
                                                    {isActing ? '...' : '♻️ استعادة'}
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                    {acc.status === 'active' ? (
                                                        <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 12, color: '#fbbf24' }} disabled={isActing} onClick={() => setPendingAction({ type: 'suspend', account: acc })}>
                                                            تعليق
                                                        </button>
                                                    ) : acc.status === 'suspended' ? (
                                                        <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 12, color: '#34d399' }} disabled={isActing} onClick={() => setPendingAction({ type: 'activate', account: acc })}>
                                                            تفعيل
                                                        </button>
                                                    ) : null}
                                                    <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 12, color: '#f87171' }} disabled={isActing} onClick={() => setPendingAction({ type: 'delete', account: acc })}>
                                                        حذف
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                    <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12.5 }} disabled={page <= 1} onClick={() => goToPage(page - 1)}>السابق</button>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', alignSelf: 'center' }}>صفحة {page} من {totalPages}</span>
                    <button className="btn-outline" style={{ padding: '6px 14px', fontSize: 12.5 }} disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>التالي</button>
                </div>
            )}

            {pendingAction && (
                <AccountReasonModal
                    title={
                        pendingAction.type === 'suspend' ? `تعليق حساب ${pendingAction.account.full_name}`
                            : pendingAction.type === 'activate' ? `تفعيل حساب ${pendingAction.account.full_name}`
                                : `حذف حساب ${pendingAction.account.full_name}`
                    }
                    description={
                        pendingAction.type === 'delete'
                            ? 'سيتم إلغاء جميع جلساته النشطة فوراً. يمكن استعادة الحساب خلال 30 يوماً من هذه الصفحة.'
                            : 'سيتم تسجيل هذا الإجراء في سجل التدقيق (Audit Log).'
                    }
                    confirmLabel={pendingAction.type === 'suspend' ? 'تعليق' : pendingAction.type === 'activate' ? 'تفعيل' : 'حذف'}
                    danger={pendingAction.type === 'delete' || pendingAction.type === 'suspend'}
                    submitting={actingId === pendingAction.account._id}
                    onClose={() => setPendingAction(null)}
                    onConfirm={handleConfirmAction}
                />
            )}

            {createOpen && (
                <CreateAdminModal submitting={creating} onClose={() => setCreateOpen(false)} onSubmit={handleCreateAdmin} />
            )}
        </div>
    )
}