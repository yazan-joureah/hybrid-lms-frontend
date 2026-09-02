// src/utils/errorMessages.ts
interface ApiErrorShape {
    response?: { data?: { error?: { code?: string; message?: string } } }
    message?: string
}

const ERROR_MESSAGES: Record<string, string> = {
    KYC_NOT_VERIFIED: 'يجب إكمال التحقق من الهوية (KYC) قبل تنفيذ هذا الإجراء. الرجاء التوجه إلى صفحة الإعدادات لرفع مستنداتك.',
    COURSE_NOT_FOUND: 'الكورس الذي تبحث عنه غير موجود.',
    FORBIDDEN: 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
    NOT_ENROLLED: 'أنت غير مسجّل في هذا الكورس.',
    ALREADY_ENROLLED: 'أنت مسجّل بالفعل في هذا الكورس.',
    COURSE_FULL: 'وصل هذا الكورس إلى الحد الأقصى لعدد المقاعد.',
    PREREQUISITES_NOT_MET: 'يجب إكمال الكورس (الكورسات) المتطلبة أولاً.',
    REVIEW_IN_PROGRESS: 'هناك مراجعة جارية لهذا الكورس بالفعل. الرجاء انتظار قرار الإدارة.',
    INVALID_CODE: 'رمز التحقق غير صحيح. حاول مرة أخرى.',
    CODE_EXPIRED: 'انتهت صلاحية رمز التحقق. اطلب رمزاً جديداً.',
    TOO_MANY_ATTEMPTS: 'محاولات فاشلة كثيرة جداً. اطلب رمزاً جديداً.',
    EMAIL_NOT_VERIFIED: 'الرجاء تفعيل بريدك الإلكتروني قبل المتابعة.',
    GUARDIAN_PENDING: 'حسابك بانتظار موافقة ولي الأمر.',
    ACCOUNT_LOCKED: 'تم قفل حسابك مؤقتاً. حاول مرة أخرى بعد دقائق أو أعد تعيين كلمة المرور.',
    ACCOUNT_SUSPENDED: 'تم تعليق حسابك. الرجاء التواصل مع الدعم.',
    VALIDATION_ERROR: 'البيانات المدخلة غير صحيحة. تحقق من الحقول وحاول مجدداً.',
    QUIZ_LOCKED: 'لا يمكن تعديل هذا الاختبار لأن أحد الطلاب بدأ محاولة بالفعل.',
    ALREADY_PUBLISHED: 'هذا الاختبار منشور بالفعل.',
    ATTEMPTS_EXHAUSTED: 'لقد استنفدت جميع المحاولات المسموحة لهذا الاختبار.',
    QUIZ_WINDOW_CLOSED: 'هذا الاختبار غير متاح حالياً خارج نافذة وقته المحددة.',
    ATTEMPT_TIMED_OUT: 'انتهى الوقت المسموح لهذه المحاولة.',
    PEER_REVIEW_IN_PROGRESS: 'لا يمكنك تعديل تسليمك الآن — بدأ أحد المراجعين تقييمه بالفعل. انتظر اكتمال التصحيح.',
    ASSIGNMENT_LOCKED: 'لا يمكن تعديل هذه المهمة بعد بدء توزيع المراجعات.',
    ASSIGNMENT_HAS_SUBMISSIONS: 'لا يمكن حذف مهمة يوجد بها تسليمات بالفعل. أغلقها بدلاً من ذلك.',
    INSUFFICIENT_SUBMISSIONS: 'عدد التسليمات غير كافٍ لتوزيع المراجعات (الحد الأدنى 3).',
    SUBMISSION_STILL_OPEN: 'موعد التسليم لم ينتهِ بعد.',
    REVIEW_STILL_OPEN: 'موعد المراجعة لم ينتهِ بعد.',
    NOT_DISTRIBUTED_YET: 'لم يتم توزيع المراجعات على هذه المهمة بعد.',
    INVALID_SUBMISSION_DEADLINE: 'موعد التسليم يجب أن يكون في المستقبل.',
    INVALID_REVIEW_DEADLINE: 'موعد المراجعة يجب أن يكون بعد موعد التسليم.',
    SUBMISSION_DEADLINE_PASSED: 'انتهى موعد تسليم هذه المهمة.',
    SUBMISSIONS_CLOSED: 'التسليم مغلق حالياً لهذه المهمة.',
    EMPTY_SUBMISSION: 'يجب إدخال نص أو ملف (إذا كان مسموحاً).',
    FILE_SUBMISSION_NOT_ALLOWED: 'هذه المهمة لا تقبل إرفاق ملفات، الرجاء إرسال النص فقط.',
    REVIEW_ALREADY_SUBMITTED: 'تم إرسال هذه المراجعة مسبقاً ولم تعد قابلة للوصول.',
    REVIEW_DEADLINE_PASSED: 'انتهى موعد إرسال المراجعات.',
    INCOMPLETE_RUBRIC: 'يجب تقييم كل معايير الرubric قبل الإرسال.',
    NOT_AGE_FLAGGED: 'هذا الإجراء غير متاح لحالتك الحالية.',
    CORRECTION_ALREADY_PENDING: 'لديك طلب تصحيح عمر قيد المراجعة من ولي الأمر بالفعل.',
    GUARDIAN_EMAIL_SAME_AS_STUDENT: 'يجب أن يكون بريد ولي الأمر مختلفاً عن بريدك.',
    ACCOUNT_NOT_ACTIVE: 'حسابك غير نشط حالياً.',
    BIRTH_DATE_LOCKED: 'لا يمكن تغيير تاريخ الميلاد بعد التحقق من الهوية (KYC).',
    STUDENT_HAS_ACTIVE_ENROLLMENTS: 'لا يمكن حذف حسابك لوجود تسجيلات نشطة. الرجاء إلغاء أو استرداد تسجيلاتك أولاً.',
    INSTRUCTOR_HAS_ACTIVE_COURSES: 'لا يمكن حذف حسابك لوجود كورسات غير مؤرشفة. الرجاء أرشفة جميع كورساتك أولاً.',
    ALREADY_DELETED: 'هذا الحساب محذوف بالفعل.',
    USER_NOT_FOUND: 'الحساب غير موجود.',
}

const DEFAULT_ERROR_MESSAGE = 'حدث خطأ ما. الرجاء المحاولة مرة أخرى.'

export function getErrorCode(err: unknown): string | undefined {
    return (err as ApiErrorShape)?.response?.data?.error?.code
}

export function getErrorMessage(err: unknown): string {
    const e = err as ApiErrorShape
    const code = e?.response?.data?.error?.code
    const backendMessage = e?.response?.data?.error?.message
    if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code]
    return backendMessage || e?.message || DEFAULT_ERROR_MESSAGE
}