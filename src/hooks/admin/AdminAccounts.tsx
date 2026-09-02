// src/pages/admin/AdminAccounts.tsx
import { useState, useEffect } from 'react'
import { useNav } from '../../context/NavContext'
import { userService } from '../../services/userService'
import { AdminAccountsList } from '../../pages/admin/accounts/AdminAccountsList'
import { DeletionRequestsList } from '../../pages/admin/accounts/DeletionRequestsList'

export default function AdminAccounts() {
    const { role } = useNav()
    const actorRole = role === 'superadmin' ? 'SuperAdmin' : 'Admin'
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'accounts' | 'deletion-requests'>('accounts')

    useEffect(() => {
        userService.getMe().then(u => setCurrentUserId(u.id)).catch(() => { })
    }, [])

    return (
        <div className="page-wrapper">
            <div style={{ marginBottom: 24 }}>
                <h2 className="section-title">إدارة الحسابات</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>
                    استعراض جميع حسابات المنصة، وتعليقها أو حذفها أو استعادتها.
                </p>
            </div>

            {actorRole === 'SuperAdmin' && (
                <div className="tab-bar" style={{ marginBottom: 22, display: 'inline-flex' }}>
                    <div className={`tab-item${activeTab === 'accounts' ? ' active' : ''}`} onClick={() => setActiveTab('accounts')}>
                        كل الحسابات
                    </div>
                    <div className={`tab-item${activeTab === 'deletion-requests' ? ' active' : ''}`} onClick={() => setActiveTab('deletion-requests')}>
                        طلبات حذف الحسابات
                    </div>
                </div>
            )}

            {activeTab === 'accounts' ? (
                <AdminAccountsList currentUserId={currentUserId} actorRole={actorRole} />
            ) : (
                <DeletionRequestsList />
            )}
        </div>
    )
}