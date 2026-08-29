// src/components/live/LiveMeetingRoom.tsx
import { useEffect, useRef, useState, useCallback } from 'react'
import { liveService, type LiveSession } from '../../services/liveService'
import { useLiveSessionSocket } from '../../hooks/live/useLiveSessionSocket'
import { useToast } from '../../context/ToastContext'
import { getErrorMessage } from '../../utils/errorMessages'

const JITSI_DOMAIN = 'meet.jit.si'

declare global {
    interface Window {
        JitsiMeetExternalAPI?: any
    }
}

interface Props {
    session: LiveSession
    role: 'student' | 'instructor'
    userName: string
    userEmail?: string
    onLeave: () => void
}

function getJitsiRoomName(meetingLink: string | undefined, sessionId: string) {
    if (!meetingLink) return `LMS-Session-${sessionId}`
    try {
        const url = new URL(meetingLink)
        const pathname = url.pathname.replace(/^\/+|\/+$/g, '')
        return pathname || `LMS-Session-${sessionId}`
    } catch {
        return String(meetingLink).replace(/^\/+|\/+$/g, '') || `LMS-Session-${sessionId}`
    }
}

function loadJitsiScript(): Promise<any> {
    if (window.JitsiMeetExternalAPI) return Promise.resolve(window.JitsiMeetExternalAPI)
    return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-lms-jitsi-external-api="true"]')
        if (existing) {
            existing.addEventListener('load', () => {
                window.JitsiMeetExternalAPI ? resolve(window.JitsiMeetExternalAPI) : reject(new Error('Jitsi API unavailable'))
            }, { once: true })
            existing.addEventListener('error', () => reject(new Error('فشل تحميل Jitsi')), { once: true })
            return
        }
        const script = document.createElement('script')
        script.src = `https://${JITSI_DOMAIN}/external_api.js`
        script.async = true
        script.dataset.lmsJitsiExternalApi = 'true'
        script.onload = () => window.JitsiMeetExternalAPI ? resolve(window.JitsiMeetExternalAPI) : reject(new Error('Jitsi API unavailable'))
        script.onerror = () => reject(new Error('فشل تحميل Jitsi'))
        document.body.appendChild(script)
    })
}

export function LiveMeetingRoom({ session, role, userName, userEmail, onLeave }: Props) {
    const { error: toastError, success: toastSuccess } = useToast()
    const containerRef = useRef<HTMLDivElement>(null)
    const apiRef = useRef<any>(null)
    const intentionalDisposeRef = useRef(false)
    const initializedRef = useRef(false)
    const joiningRef = useRef(false)
    const mountedRef = useRef(true)

    const [joined, setJoined] = useState(false)
    const [connecting, setConnecting] = useState(false)
    const [started, setStarted] = useState(false)
    const [sessionEnded, setSessionEnded] = useState(false)

    // ---------- طالب: التوكن الخاص بالانضمام + إشعار القفل ----------
    const [joinToken, setJoinToken] = useState<string | null>(null)
    const [lockedNotice, setLockedNotice] = useState(false)

    // ---------- محاضر: حالة قفل/فتح دخول الطلاب ----------
    const [studentsAllowed, setStudentsAllowed] = useState(Boolean(session.studentsAllowed))
    const [togglingAccess, setTogglingAccess] = useState(false)
    const [endingSession, setEndingSession] = useState(false)

    useEffect(() => {
        mountedRef.current = true
        return () => { mountedRef.current = false }
    }, [])

    // ---------- تفكيك جلسة Jitsi فقط (بدون قطع اتصال الـ socket) ----------
    const disposeJitsi = useCallback(() => {
        const api = apiRef.current
        if (!api) return
        intentionalDisposeRef.current = true
        try { api.dispose() } catch { /* ignore */ }
        apiRef.current = null
        initializedRef.current = false
        joiningRef.current = false
        if (mountedRef.current) { setJoined(false); setStarted(false) }
    }, [])

    // ✅ استماع الطالب للحظة قفل/فتح المحاضر لدخول الطلاب — يبقى نشطًا طوال بقاء
    // الطالب داخل الصفحة، بغض النظر عن حالة Jitsi نفسها، ليتمكن من معرفة لحظة
    // إعادة الفتح حتى لو طُرد للتو.
    useLiveSessionSocket({
        joinToken: role === 'student' ? joinToken : null,
        onAccessChanged: (allowed) => {
            if (allowed) {
                setLockedNotice(false)
            } else {
                setLockedNotice(true)
                disposeJitsi() // طرد فوري من الغرفة الفعلية
            }
        },
        onSessionEnded: () => {
            // عند انتهاء المحاضرة من قبل المحاضر
            setSessionEnded(true)
            disposeJitsi()
            toastError('انتهت المحاضرة من قبل المحاضر.')
        },
    })

    const handleJoinSession = useCallback(async () => {
        if (joiningRef.current || initializedRef.current) return
        joiningRef.current = true
        setConnecting(true)

        try {
            let activeLink = session.meetingLink

            if (role === 'student') {
                try {
                    const result = await liveService.joinSession(session._id)
                    if (result.meetingLink) activeLink = result.meetingLink
                    if (result.joinToken) setJoinToken(result.joinToken)
                } catch (err) {
                    const code = (err as any)?.response?.data?.error?.code
                    const friendly =
                        code === 'SESSION_NOT_STARTED' ? 'لم يبدأ المحاضر الجلسة بعد.' :
                            code === 'SESSION_ENDED' ? 'انتهت هذه الجلسة.' :
                                code === 'SESSION_NOT_LIVE' ? 'الجلسة غير متاحة للانضمام حاليًا.' :
                                    code === 'STUDENTS_NOT_ALLOWED_YET' ? 'لم يفتح المحاضر الحصة للطلاب بعد. انتظر قليلًا.' :
                                        getErrorMessage(err)
                    toastError(friendly)
                    joiningRef.current = false
                    setConnecting(false)
                    return
                }
            }

            const roomName = getJitsiRoomName(activeLink, session._id)
            const container = containerRef.current
            if (container) container.querySelectorAll('iframe').forEach(el => el.remove())

            const JitsiAPI = await loadJitsiScript()
            if (!mountedRef.current || !container || apiRef.current) return

            const api = new JitsiAPI(JITSI_DOMAIN, {
                roomName,
                width: '100%',
                height: '100%',
                parentNode: container,
                userInfo: { displayName: userName, email: userEmail },
                configOverwrite: {
                    startWithAudioMuted: true,
                    prejoinPageEnabled: false,
                    disablePrejoinPage: true,
                    enableWelcomePage: false,
                    enableLobby: false,
                    hideLobbyButton: true,
                },
                interfaceConfigOverwrite: {
                    SHOW_PREJOIN_PAGE: false,
                    TOOLBAR_BUTTONS: [
                        'microphone', 'camera', 'desktop', 'chat', 'raisehand',
                        'participants-pane', 'tileview', 'fullscreen', 'hangup',
                        'settings', 'videoquality', 'filmstrip', 'security', 'mute-everyone', 'invite',
                    ],
                },
            })

            apiRef.current = api
            initializedRef.current = true
            joiningRef.current = false
            intentionalDisposeRef.current = false
            setStarted(true)

            api.addEventListener('videoConferenceJoined', () => { if (mountedRef.current) setJoined(true) })
            api.addEventListener('videoConferenceLeft', () => { if (!intentionalDisposeRef.current && mountedRef.current) setJoined(false) })
        } catch (err) {
            toastError(err instanceof Error ? err.message : 'تعذّر الاتصال بالحصة المباشرة.')
            initializedRef.current = false
            joiningRef.current = false
        } finally {
            setConnecting(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role, session._id, session.meetingLink, userName, userEmail, toastError])

    // ✅ انضمام تلقائي وفوري للمحاضر — هو ملزم يدخل أول واحد بما إنه الطلاب أصلاً
    // مقفول عليهم الباب افتراضيًا لحد ما يفتحه هو بنفسه.
    useEffect(() => {
        if (role === 'instructor') void handleJoinSession()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => () => disposeJitsi(), [disposeJitsi])

    // ---------- محاضر: فتح/قفل دخول الطلاب ----------
    const handleToggleAccess = async () => {
        setTogglingAccess(true)
        try {
            const next = !studentsAllowed
            await liveService.toggleStudentsAccess(session._id, next)
            setStudentsAllowed(next)
            toastSuccess(next ? 'تم فتح الحصة للطلاب.' : 'تم قفل دخول الطلاب.')
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setTogglingAccess(false)
        }
    }

    // ---------- محاضر: إنهاء المحاضرة للجميع ----------
    const handleEndSession = async () => {
        if (endingSession) return
        setEndingSession(true)
        try {
            await liveService.endSession(session._id)
            toastSuccess('تم إنهاء المحاضرة بنجاح.')
            setSessionEnded(true)
            disposeJitsi()
            // لا نغادر الصفحة فوراً، بل نعرض رسالة انتهاء
        } catch (err) {
            toastError(getErrorMessage(err))
        } finally {
            setEndingSession(false)
        }
    }

    // ---------- مغادرة الحصة ----------
    const handleLeaveClick = async () => {
        // ✅ المحاضر آخر واحد يطلع: قفل الباب تلقائيًا قبل خروجه المقصود، فما
        // حدا يضل بالحصة بدون مشرف — وهاد بيطرد فورًا أي طالب موجود فعليًا.
        if (role === 'instructor' && studentsAllowed) {
            try { await liveService.toggleStudentsAccess(session._id, false) } catch { /* best effort */ }
        }
        try { await liveService.leaveSession(session._id) } catch { /* لا نمنع الخروج عند فشل تسجيل المغادرة */ }
        disposeJitsi()
        setJoinToken(null) // إنهاء اتصال الـ socket فعليًا عند الخروج المقصود فقط
        onLeave()
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ position: 'relative', width: '100%', height: 520, background: '#000', borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

                {!started && !sessionEnded && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, textAlign: 'center', padding: 20 }}>
                        {role === 'student' && lockedNotice ? (
                            <>
                                <div style={{ fontSize: 32 }}>🔒</div>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 320 }}>
                                    أوقف المحاضر دخول الطلاب مؤقتًا لمعالجة مشكلة بالاتصال. سيُعاد فتح الحصة تلقائيًا فور جاهزيته — تابع من هنا.
                                </p>
                                <button className="btn-outline" style={{ padding: '10px 24px' }} disabled>بانتظار إعادة الفتح...</button>
                            </>
                        ) : (
                            <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={handleJoinSession} disabled={connecting}>
                                {connecting ? '...جارٍ الاتصال' : role === 'instructor' ? 'بدء البث' : 'انضمام الآن'}
                            </button>
                        )}
                    </div>
                )}

                {sessionEnded && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, textAlign: 'center', padding: 20, background: 'rgba(0,0,0,0.8)' }}>
                        <div style={{ fontSize: 48 }}>⏹️</div>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18 }}>انتهت المحاضرة</p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
                            {role === 'instructor' ? 'لقد أنهيت المحاضرة بنجاح.' : 'قام المحاضر بإنهاء المحاضرة.'}
                        </p>
                        <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={handleLeaveClick}>
                            مغادرة
                        </button>
                    </div>
                )}

                <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 5 }}>
                    <span className="badge" style={{ background: joined ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.1)', color: joined ? '#34d399' : 'rgba(255,255,255,0.6)' }}>
                        {joined ? '● متصل' : 'بانتظار الاتصال'}
                    </span>
                </div>
            </div>

            {!sessionEnded && (
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button className="btn-outline" style={{ padding: '10px 24px' }} onClick={handleLeaveClick}>
                        مغادرة الحصة
                    </button>

                    {role === 'instructor' && (
                        <>
                            <button
                                className="btn-primary"
                                style={{ padding: '10px 24px', background: studentsAllowed ? 'linear-gradient(135deg, #ef4444, #dc2626)' : undefined }}
                                onClick={handleToggleAccess}
                                disabled={!joined || togglingAccess}
                                title={!joined ? 'انتظر حتى تتصل بالحصة أولاً' : undefined}
                            >
                                {togglingAccess ? '...جارٍ الحفظ' : studentsAllowed ? '🔒 قفل دخول الطلاب' : '🔓 فتح الحصة للطلاب'}
                            </button>

                            <button
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: 9999,
                                    border: '1px solid rgba(239,68,68,0.4)',
                                    background: 'rgba(239,68,68,0.12)',
                                    color: '#f87171',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    cursor: endingSession ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit'
                                }}
                                onClick={handleEndSession}
                                disabled={endingSession}
                            >
                                {endingSession ? '...جارٍ الإنهاء' : '⏹ إنهاء المحاضرة للجميع'}
                            </button>
                        </>
                    )}
                </div>
            )}

            {role === 'instructor' && !joined && !sessionEnded && (
                <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>
                    لا يمكنك فتح الحصة للطلاب أو إنهاء المحاضرة قبل أن يتأكد اتصالك بالغرفة فعليًا.
                </p>
            )}
        </div>
    )
}