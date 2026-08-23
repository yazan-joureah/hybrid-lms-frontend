// src/types/index.ts
// Shared types used by the real backend integration (api config, auth context,
// dashboards). These model the actual API responses, separate from the
// legacy `Role` / `Page` UI types in `src/context/NavContext.tsx`.

export type ApiRole = 'Student' | 'Instructor' | 'Admin';

export type KycStatus =
    | 'not_submitted'
    | 'pending_review'
    | 'rejected'
    | 'verified';

export interface User {
    _id: string;
    full_name: string;
    email: string;
    role: ApiRole;
    birth_date?: string;
    phone?: string;
    bio?: string;
    gender?: 'male' | 'female';
    kyc_status?: KycStatus;
    verification_status?: KycStatus;
    [key: string]: unknown;
}

export interface RegisterPayload {
    full_name: string;
    email: string;
    password: string;
    birth_date: string;
    role: 'Student' | 'Instructor';
    guardian_email?: string;
    privacy_consent_version: string;
    // Extra profile fields collected by this project's signup wizard.
    // Adjust/remove if your backend's /auth/register doesn't accept these.
    phone?: string;
    bio?: string;
    gender?: 'male' | 'female';
}

export interface AuthActionResult {
    success?: boolean;
    mfaRequired?: boolean;
    user?: User;
    requires_guardian_approval?: boolean;
    nextStep?: 'login' | 'guardian_pending' | string;
    [key: string]: unknown;
}

export interface ProfileUpdatePayload {
    full_name?: string;
    phone?: string;
    bio?: string;
    gender?: 'male' | 'female';
    [key: string]: unknown;
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
    accessToken: string | null;
    login: (email: string, password: string) => Promise<AuthActionResult>;
    verifyMfa: (code: string) => Promise<AuthActionResult>;
    resetMfa: () => void;
    logout: () => Promise<void>;
    register: (data: Partial<RegisterPayload>) => Promise<AuthActionResult>;
    verifyEmail: (email: string, code: string) => Promise<AuthActionResult>;
    resendVerification: (email: string) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (email: string, code: string, newPassword: string) => Promise<void>;
    setupMfa: () => Promise<unknown>;
    confirmMfa: (code: string) => Promise<unknown>;
    mfaRequired: boolean;
    mfaTempToken: string | null;
    guardianApprove: (
        rawToken: string,
        decision: string,
        guardianFullName: string,
        relationship: string
    ) => Promise<unknown>;
    updateProfile: (data: ProfileUpdatePayload) => Promise<User | undefined>;
    uploadProfilePicture: (file: File) => Promise<unknown>;
    getProfilePictureUrl: (userId: string) => string;
    googleLogin: () => void;
    googleRegisterConfirm: (data: unknown) => Promise<unknown>;
    googleLinkConfirm: (data: unknown) => Promise<unknown>;
    googleGuardianEmail: (data: unknown) => Promise<unknown>;
    refreshSession: () => Promise<{ success: boolean; user?: User }>;
}

// ---------------- Toast ----------------

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastContextType {
    showMsg: (message: string, type?: ToastType) => void;
}

// ---------------- KYC (Admin) ----------------

export interface KycRequest {
    _id: string;
    user_id?: { _id: string; full_name?: string; email?: string };
    applicant_role?: string;
    submitted_at: string;
    [key: string]: unknown;
}

export interface ApprovalData {
    documentBirthDate: string;
    optionalNote: string;
}

export type RejectionReason =
    | 'UNCLEAR_IMAGE'
    | 'DOCUMENT_EXPIRED'
    | 'DATA_MISMATCH'
    | 'DOCUMENT_NOT_ACCEPTED';

export interface DocImages {
    idDoc: string;
    selfie: string;
}

// ---------------- Courses (shared shape) ----------------

export interface ContentData {
    url?: string;
    text?: string;
}

export type ContentType = 'video' | 'document' | 'link' | 'text';

export interface ContentItem {
    _id: string;
    content_type: ContentType;
    mime_type?: string;
    content_data?: ContentData;
    [key: string]: unknown;
}

export interface Unit {
    _id: string;
    title: string;
    content?: ContentItem[];
    [key: string]: unknown;
}

export interface CourseDetail {
    _id: string;
    title: string;
    description?: string;
    category?: string;
    course_type?: string;
    is_synchronous?: boolean;
    status?: string;
    price?: number;
    max_students?: number | string;
    completion_threshold?: number;
    [key: string]: unknown;
}

export interface CoursePreview {
    course: CourseDetail;
    units?: Unit[];
}

// ---------------- Admin: course moderation ----------------

export interface CourseSummaryAdmin {
    _id: string;
    title: string;
    instructor_id?: { full_name?: string } | string;
    updatedAt: string;
    [key: string]: unknown;
}

export type ReviewDecision = 'publish' | 'needs_revision' | 'reject';

export interface ReviewPayload {
    decision: ReviewDecision;
    reason: string;
}

export type CourseModerationStatus = 'suspended' | 'archived';

// ---------------- Student: enrollments ----------------

export interface EnrolledCourse {
    _id: string;
    title?: string;
    category?: string;
}

export interface Enrollment {
    _id: string;
    course_id?: EnrolledCourse;
}

export interface ProgressSummary {
    progress_percentage?: number;
    [key: string]: unknown;
}

// ---------------- Instructor dashboard ----------------

export interface InstructorCourseSummary {
    _id: string;
    title: string;
    enrolledCount?: number;
    rating?: number;
    status?: string;
    [key: string]: unknown;
}

export interface InstructorStatsData {
    totalCourses: number;
    totalStudents: number;
    avgRating: number;
    revenue: number;
}
