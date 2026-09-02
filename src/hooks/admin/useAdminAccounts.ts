// src/hooks/admin/useAdminAccounts.ts
import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../context/ToastContext'
import {
    adminAccountService,
    type AdminAccountListItem, type AccountListParams, type AccountStatusAction,
} from '../../services/adminAccountService'
import { getErrorMessage } from '../../utils/errorMessages'

export function useAdminAccounts() {
    const { success, error: toastError } = useToast()
    const [items, setItems] = useState<AdminAccountListItem[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [pageSize] = useState(20)
    const [loading, setLoading] = useState(true)
    const [actingId, setActingId] = useState<string | null>(null)

    const [roleFilter, setRoleFilter] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [search, setSearch] = useState('')

    const fetchAccounts = useCallback(async (targetPage = 1) => {
        setLoading(true)
        try {
            const params: AccountListParams = {
                page: targetPage, pageSize,
                role: roleFilter || undefined,
                status: statusFilter || undefined,
                search: search || undefined,
            }
            const result = await adminAccountService.list(params)
            setItems(result.items)
            setTotal(result.total)
            setPage(result.page)
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleFilter, statusFilter, search])

    useEffect(() => { void fetchAccounts(1) }, [fetchAccounts])

    const setStatus = async (userId: string, action: AccountStatusAction, reason: string) => {
        setActingId(userId)
        try {
            await adminAccountService.setStatus(userId, action, reason)
            success(action === 'suspend' ? 'تم تعليق الحساب.' : 'تم تفعيل الحساب.')
            await fetchAccounts(page)
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        } finally {
            setActingId(null)
        }
    }

    const deleteAccount = async (userId: string, reason: string) => {
        setActingId(userId)
        try {
            await adminAccountService.deleteAccount(userId, reason)
            success('تم حذف الحساب. يمكن استعادته خلال 30 يوماً.')
            await fetchAccounts(page)
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        } finally {
            setActingId(null)
        }
    }

    const restoreAccount = async (userId: string) => {
        setActingId(userId)
        try {
            await adminAccountService.restoreAccount(userId)
            success('تم استعادة الحساب بنجاح.')
            await fetchAccounts(page)
            return true
        } catch (err) {
            toastError(getErrorMessage(err))
            return false
        } finally {
            setActingId(null)
        }
    }

    const createAdmin = async (email: string, fullName: string) => {
        try {
            const result = await adminAccountService.createAdmin(email, fullName)
            success('تم إنشاء حساب المشرف. تم إرسال رمز تفعيل إلى بريده الإلكتروني.')
            await fetchAccounts(page)
            return result
        } catch (err) {
            toastError(getErrorMessage(err))
            return null
        }
    }

    return {
        items, total, page, pageSize, loading, actingId,
        roleFilter, setRoleFilter, statusFilter, setStatusFilter, search, setSearch,
        goToPage: (p: number) => fetchAccounts(p),
        setStatus, deleteAccount, restoreAccount, createAdmin,
        refetch: () => fetchAccounts(page),
    }
}