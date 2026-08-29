// src/routes/dynamicRoutes.ts
// مسارات ديناميكية (بمعرّف حقيقي بالـ URL) لا تدخل ضمن خريطة Page الثابتة
// لأنها تحتاج param. الصفحات يلي بتحتاج تروح لهون بتستخدم useNavigate()
// من react-router مباشرة، مش useNav().navigate().

export const CHECKOUT_PATH = (enrollmentId: string) => `/checkout/${enrollmentId}`
export const ADMIN_PAYMENT_DETAIL_PATH = (paymentId: string) => `/admin/payments/${paymentId}`
export const MY_COURSES_LIST_PATH = '/my-courses'
export const MY_COURSES_DETAIL_PATH = (enrollmentId: string) => `/my-courses/${enrollmentId}`