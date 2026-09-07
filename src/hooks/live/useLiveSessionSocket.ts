// src/hooks/live/useLiveSessionSocket.ts
import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'

const SOCKET_URL = 'https://hybrid-lms-backend.onrender.com'

interface Options {
    joinToken: string | null
    onAccessChanged: (allowed: boolean) => void
    onSessionEnded?: () => void
}

// يستخدم فقط من طرف الطالب (بعد نجاح joinSession والحصول على joinToken)
// للاستماع للحظة قفل/فتح المحاضر لدخول الطلاب أثناء وجوده داخل الحصة.
export function useLiveSessionSocket({ joinToken, onAccessChanged, onSessionEnded }: Options) {
    const socketRef = useRef<Socket | null>(null)
    const callbackRef = useRef(onAccessChanged)
    callbackRef.current = onAccessChanged
    const endedCallbackRef = useRef(onSessionEnded)
    endedCallbackRef.current = onSessionEnded

    useEffect(() => {
        if (!joinToken) return

        const socket = io(`${SOCKET_URL}/live`, {
            auth: { joinToken },
            transports: ['websocket', 'polling'],
            reconnection: true,
        })
        socketRef.current = socket

        socket.on('students:access-changed', (payload: { allowed: boolean }) => {
            callbackRef.current(payload.allowed)
        })

        socket.on('session:ended', () => {
            endedCallbackRef.current?.()
        })

        socket.on('connect_error', (err: Error) => {
            console.warn('[Live Socket] connect_error:', err.message)
        })

        return () => {
            socket.disconnect()
            socketRef.current = null
        }
    }, [joinToken])
}