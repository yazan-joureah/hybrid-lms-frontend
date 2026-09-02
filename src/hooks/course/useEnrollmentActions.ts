// src/hooks/course/useEnrollmentActions.ts
import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { courseService } from '../../services/courseService'
import { payService, type Payment } from '../../services/payService'
import { getErrorCode, getErrorMessage } from '../../utils/errorMessages'

export function useEnrollmentActions() {
    const { success, error: toastError } = useToast()
    const [cancellingId, setCancellingId] = useState<string | null>(null)
    const [findingPaymentId, setFindingPaymentId] = useState<string | null>(null)
    const [submittingRefund, setSubmittingRefund] = useState(false)

    /**
     * إلغاء تسجيل ذاتي — يعمل فقط لكورس مجاني (active) أو كورس مدفوع
     * لسا pending_payment. لو الباك اند رجّع REFUND_REQUIRED معناها في
     * مبلغ فعلي مدفوع ولازم المرور عبر طلب استرداد بدل الإلغاء المباشر.
     */
    const cancelEnrollment = async (enrollmentId: string): Promise<'cancelled' | 'refund_required' | 'error'> => {
        setCancellingId(enrollmentId)
        try {
            await courseService.cancelEnrollment(enrollmentId)
            success('تم إلغاء التسجيل بنجاح.')
            return 'cancelled'
        } catch (err) {
            if (getErrorCode(err) === 'REFUND_REQUIRED') {
                return 'refund_required'
            }
            toastError(getErrorMessage(err))
            return 'error'
        } finally {
            setCancellingId(null)
        }
    }

    /** يلاقي الدفعة (Payment) المرتبطة بتسجيل معيّن من سجل مدفوعات الطالب. */
    const findPaymentForEnrollment = async (enrollmentId: string): Promise<Payment | null> => {
        setFindingPaymentId(enrollmentId)
        try {
            const payments = await payService.getMyPayments({ limit: 100 })
            return payments.find(p => p.enrollment_id === enrollmentId) || null
        } catch (err) {
            toastError(getErrorMessage(err))
            return null
        } finally {
            setFindingPaymentId(null)
        }
    }

    const requestRefund = async (paymentId: string, reason?: string): Promise<boolean> => {
        setSubmittingRefund(true)
        try {
            await payService.requestRefund(paymentId, reason)
            success('تم إرسال طلب الاسترداد بنجاح. سيتم مراجعته من قبل الإدارة قريباً.')
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        } finally {
            setSubmittingRefund(false)
        }
    }

    return {
        cancelEnrollment,
        cancellingId,
        findPaymentForEnrollment,
        findingPaymentId,
        requestRefund,
        submittingRefund,
    }
}