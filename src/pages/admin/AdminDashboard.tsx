// src/pages/admin/AdminDashboard.tsx
import { useState } from 'react'
import { useNav } from '../../context/NavContext'
import { KycTab } from './kyc/KycTab'
import { CourseModerationTab } from './course-moderation/CourseModerationTab'
import { SecurityAuditTab } from './security-audit/SecurityAuditTab'
import { AdminAnalyticsTab } from './analytics/AdminAnalyticsTab'

export default function AdminDashboard() {
    const { role } = useNav()
    const isSuperAdmin = role === 'superadmin'
    const [activeTab, setActiveTab] = useState<'kyc' | 'courses' | 'analytics' | 'security-audit'>('kyc')

    return (
        <div className="page-wrapper">
            <div style={{ marginBottom: 24 }}>
                <h2 className="section-title">لوحة تحكم الإدارة</h2>
            </div>

            <div className="tab-bar" style={{ marginBottom: 22, display: 'inline-flex' }}>
                <div className={`tab-item${activeTab === 'kyc' ? ' active' : ''}`} onClick={() => setActiveTab('kyc')}>
                    طلبات التوثيق (KYC)
                </div>
                <div className={`tab-item${activeTab === 'courses' ? ' active' : ''}`} onClick={() => setActiveTab('courses')}>
                    مراجعة الكورسات
                </div>
                <div className={`tab-item${activeTab === 'analytics' ? ' active' : ''}`} onClick={() => setActiveTab('analytics')}>
                    📊 إحصائيات المنصة
                </div>
                {isSuperAdmin && (
                    <div className={`tab-item${activeTab === 'security-audit' ? ' active' : ''}`} onClick={() => setActiveTab('security-audit')}>
                        🛡️ إحصائيات التدقيق الأمني
                    </div>
                )}
            </div>

            {activeTab === 'kyc' ? <KycTab />
                : activeTab === 'courses' ? <CourseModerationTab />
                    : activeTab === 'analytics' ? <AdminAnalyticsTab />
                        : isSuperAdmin ? <SecurityAuditTab /> : <KycTab />}
        </div>
    )
}