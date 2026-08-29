// src/services/liveService.ts
import API from '../config/api'

export type LiveSessionStatus = 'scheduled' | 'ongoing' | 'ended' | 'cancelled'

export interface LiveSession {
    _id: string
    courseId: string | { _id: string; title?: string }
    unit_id?: string | { _id: string; title?: string } | null
    instructorId?: string | { _id: string; full_name?: string }
    title: string
    startTime: string
    endTime: string
    status: LiveSessionStatus
    meetingLink?: string
    recordingUrl?: string
    moderatorPassword?: string
    studentsAllowed?: boolean
    lobbyEnabled?: boolean
}

export interface LiveSessionFormPayload {
    title: string
    unitId?: string
    startTime: string // ISO
    endTime: string // ISO
    meetingLink?: string
    lobbyEnabled?: boolean
}

export interface JoinSessionResult {
    meetingLink?: string
    joinToken?: string
}

export interface AttendanceRecord {
    _id: string
    studentId?: { _id: string; full_name?: string; email?: string }
    joinedAt?: string
    leftAt?: string
    durationSeconds?: number
    status: string
    correctionReason?: string
}

export interface SessionReport {
    session?: { _id: string; title: string }
    records: AttendanceRecord[]
}

export interface AttendanceSummaryRow {
    studentId: string
    studentName: string
    studentEmail: string
    attendedSessions: number
    totalDurationSeconds: number
    attendancePercentage: number
}

export interface CourseAttendanceSummary {
    totalSessions: number
    summary: AttendanceSummaryRow[]
}

export const liveService = {
    // ---------- عام (طالب + محاضر) ----------
    getSessions: async (params?: { courseId?: string }): Promise<LiveSession[]> => {
        const res = await API.get('/live/sessions', { params })
        return res.data?.data?.sessions || []
    },

    getSession: async (sessionId: string): Promise<LiveSession | null> => {
        const res = await API.get(`/live/sessions/${sessionId}`)
        return res.data?.data?.session || null
    },

    // ---------- المحاضر ----------
    createSession: async (courseId: string, payload: LiveSessionFormPayload, confirmConflict?: boolean): Promise<void> => {
        const body: Record<string, unknown> = {
            courseId,
            title: payload.title,
            startTime: payload.startTime,
            endTime: payload.endTime,
            unit_id: payload.unitId || undefined,
            lobbyEnabled: payload.lobbyEnabled ?? false,
        }
        if (payload.meetingLink) body.meetingLink = payload.meetingLink
        if (confirmConflict) body.confirmConflict = true
        await API.post('/live/sessions', body)
    },

    updateSession: async (sessionId: string, payload: Omit<LiveSessionFormPayload, 'unitId'>, confirmConflict?: boolean): Promise<void> => {
        const body: Record<string, unknown> = {
            title: payload.title,
            startTime: payload.startTime,
            endTime: payload.endTime,
            lobbyEnabled: payload.lobbyEnabled,
        }
        if (payload.meetingLink) body.meetingLink = payload.meetingLink
        if (confirmConflict) body.confirmConflict = true
        await API.put(`/live/sessions/${sessionId}`, body)
    },

    cancelSession: async (sessionId: string, reason?: string): Promise<void> => {
        await API.post(`/live/sessions/${sessionId}/cancel`, { reason })
    },

    startSession: async (sessionId: string): Promise<void> => {
        await API.post(`/live/sessions/${sessionId}/start`)
    },
    toggleStudentsAccess: async (sessionId: string, allowed: boolean): Promise<void> => {
        await API.post(`/live/sessions/${sessionId}/students-access`, { allowed })
    },
    endSession: async (sessionId: string): Promise<void> => {
        await API.post(`/live/sessions/${sessionId}/end`)
    },

    attachRecording: async (sessionId: string, recordingUrl: string): Promise<void> => {
        await API.post(`/live/sessions/${sessionId}/recording`, { recordingUrl })
    },

    // ---------- الطالب ----------
    joinSession: async (sessionId: string): Promise<JoinSessionResult> => {
        const res = await API.post(`/live/sessions/${sessionId}/join`)
        return res.data?.data || {}
    },

    leaveSession: async (sessionId: string): Promise<void> => {
        await API.post(`/live/sessions/${sessionId}/leave`)
    },
}

export const attendanceService = {
    getSessionReport: async (sessionId: string): Promise<SessionReport | null> => {
        const res = await API.get(`/attendance/sessions/${sessionId}/report`)
        return res.data?.data || null
    },

    exportSessionCSV: async (sessionId: string): Promise<Blob> => {
        const res = await API.get(`/attendance/sessions/${sessionId}/export.csv`, { responseType: 'blob' })
        return res.data
    },

    getCourseSummary: async (courseId: string): Promise<CourseAttendanceSummary | null> => {
        const res = await API.get(`/attendance/courses/${courseId}/summary`)
        return res.data?.data || null
    },

    correctAttendance: async (sessionId: string, studentId: string, reason: string): Promise<void> => {
        await API.patch(`/attendance/sessions/${sessionId}/students/${studentId}/correct`, { reason })
    },
}