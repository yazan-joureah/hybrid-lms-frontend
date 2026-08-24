// src/pages/admin/AdminDashboard.tsx
import { useState } from 'react'
import { KycTab } from './kyc/KycTab'
import { CourseModerationTab } from './course-moderation/CourseModerationTab'

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<'kyc' | 'courses'>('kyc')

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
            </div>

            {activeTab === 'kyc' ? <KycTab /> : <CourseModerationTab />}
        </div>
    )
}