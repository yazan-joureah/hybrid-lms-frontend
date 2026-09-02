// src/services/adminAnalyticsService.ts
import API from '../config/api'

export type AlertType = 'LOW_PERFORMANCE' | 'LOW_ATTENDANCE'
export type AlertSeverity = 'high' | 'medium'

export interface PlatformAlert {
    type: AlertType
    courseId: string
    courseTitle: string
    value: number
    threshold: number
    severity: AlertSeverity
}

export interface EnrollmentDistribution {
    free: number
    paid: number
}

export interface SuperAdminRevenue {
    totalAmount: number
    paidTransactionCount: number
}

export interface AdminRevenueShare {
    paidSharePercent: number | null
}

export type AdminAnalyticsRevenue = SuperAdminRevenue | AdminRevenueShare

export interface AdminAnalyticsOverview {
    platformCompletionRate: number | null
    platformAttendanceRate: number | null
    enrollmentDistribution: EnrollmentDistribution
    revenue: AdminAnalyticsRevenue
    activeAlerts: PlatformAlert[]
}

/** SuperAdmin فقط بيشوف الأرقام المطلقة (totalAmount) — Admin بيشوف النسبة فقط */
export function isSuperAdminRevenue(revenue: AdminAnalyticsRevenue): revenue is SuperAdminRevenue {
    return 'totalAmount' in revenue
}

export const adminAnalyticsService = {
    /** GET /admin/analytics/overview — UC-REPORT-01 (Admin و SuperAdmin) */
    getOverview: async (): Promise<AdminAnalyticsOverview> => {
        const res = await API.get('/admin/analytics/overview')
        return res.data?.data
    },
}