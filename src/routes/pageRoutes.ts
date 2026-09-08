// src/routes/pageRoutes.ts
import type { Page } from '../context/NavContext'

// خريطة Page -> path حقيقي بالـ URL.
// ⚠️ 'verify-certificate' متعامل معها خاص (route ديناميكي /verify/:certificateId) فمش موجودة هون كـ path ثابت.
export const PAGE_TO_PATH: Record<Exclude<Page, 'verify-certificate'>, string> & { 'verify-certificate'?: string } = {
    'landing': '/',
    'login': '/login',
    'register': '/register',
    'forgot-password': '/forgot-password',
    'guardian-manage': '/auth/guardian/manage',

    'student-dashboard': '/dashboard',
    'course-catalog': '/courses',
    'my-courses': '/my-courses',
    'live-class': '/live',
    'certificates': '/certificates',
    'ai-assistant': '/ai-assistant',
    'profile': '/profile',

    'checkout': '/checkout',
    'payment-success': '/payment/success',
    'payment-cancelled': '/payment/cancelled',
    'admin-payments': '/admin/payments',
    'admin-payment-detail': '/admin/payments/detail',
    'admin-accounts': '/admin/accounts',

    'instructor-dashboard': '/instructor',
    'instructor-setup': '/instructor/setup',
    'course-builder': '/instructor/courses',
    'instructor-ai-assistant': '/instructor/ai-assistant',

    'admin-dashboard': '/admin',
    'admin-setup': '/admin/setup',
    'refunds': '/admin/refunds',

    'privacy-policy': '/privacy-policy',
} as any

export const PATH_TO_PAGE: Partial<Record<string, Page>> = Object.fromEntries(
    Object.entries(PAGE_TO_PATH).map(([page, path]) => [path, page as Page])
)