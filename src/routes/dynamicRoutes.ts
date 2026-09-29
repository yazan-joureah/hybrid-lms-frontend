// src/routes/dynamicRoutes.ts


export const CHECKOUT_PATH = (enrollmentId: string) => `/checkout/${enrollmentId}`
export const ADMIN_PAYMENT_DETAIL_PATH = (paymentId: string) => `/admin/payments/${paymentId}`
export const MY_COURSES_LIST_PATH = '/my-courses'
export const MY_COURSES_DETAIL_PATH = (enrollmentId: string) => `/my-courses/${enrollmentId}`


export const COURSE_BUILDER_TAB_PATH = (courseId: string, tab: string) =>
    `/instructor/courses?courseId=${encodeURIComponent(courseId)}&tab=${encodeURIComponent(tab)}`