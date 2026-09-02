// src/services/securityAuditService.ts
import API from '../config/api'

export interface ActionBreakdownItem {
    action: string
    count: number
}

export interface DailyTimelinePoint {
    date: string
    count: number
}

export interface TopActorItem {
    actorId: string
    actorRole: 'Admin' | 'SuperAdmin'
    count: number
    fullName?: string | null
    email?: string | null
}

export interface SecurityAuditOverview {
    rangeDays: number
    totalEvents: number
    accountLockoutsCount: number
    actionBreakdown: ActionBreakdownItem[]
    dailyTimeline: DailyTimelinePoint[]
    topActors: TopActorItem[]
}

export interface AuditEventItem {
    _id: string
    action: string
    actor_id: { _id: string; full_name?: string; email?: string; role?: string } | null
    actor_role?: string
    resource_type?: string
    resource_id?: string
    metadata?: Record<string, unknown>
    ip_address?: string
    user_agent?: string
    created_at: string
}

export interface AuditEventsListParams {
    action?: string
    actorId?: string
    actorRole?: string
    resourceType?: string
    page?: number
    pageSize?: number
}

export interface AuditEventsListResult {
    items: AuditEventItem[]
    total: number
    page: number
    pageSize: number
}

export const securityAuditService = {
    /** GET /admin/security-audit/overview?days=30 */
    getOverview: async (days: number = 30): Promise<SecurityAuditOverview> => {
        const res = await API.get('/admin/security-audit/overview', { params: { days } })
        return res.data?.data
    },

    /** GET /admin/security-audit/events */
    listEvents: async (params: AuditEventsListParams = {}): Promise<AuditEventsListResult> => {
        const res = await API.get('/admin/security-audit/events', { params })
        const data = res.data?.data
        return {
            items: data?.items || [],
            total: data?.total || 0,
            page: data?.page || 1,
            pageSize: data?.pageSize || 20,
        }
    },

    /** GET /admin/security-audit/actions */
    listActions: async (): Promise<string[]> => {
        const res = await API.get('/admin/security-audit/actions')
        return res.data?.data?.actions || []
    },
}