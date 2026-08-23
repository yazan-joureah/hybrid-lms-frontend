// src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import API from '../config/api';
import {
    AuthContextType,
    AuthActionResult,
    RegisterPayload,
    ProfileUpdatePayload,
    User,
} from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const SESSION_FLAG_KEY = 'session_active';

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [mfaRequired, setMfaRequired] = useState<boolean>(false);
    const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);

    // On mount, refresh if a session flag exists
    useEffect(() => {
        const initAuth = async () => {
            const hasSession = localStorage.getItem(SESSION_FLAG_KEY) === 'true';
            if (!hasSession) {
                setLoading(false);
                return;
            }
            try {
                const response = await API.post('/auth/refresh');
                const token: string | undefined = response.data?.data?.access_token;
                if (token) {
                    setAccessToken(token);
                    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const userData = await fetchUserProfile();
                    setUser(userData);
                } else {
                    localStorage.removeItem(SESSION_FLAG_KEY);
                }
            } catch {
                localStorage.removeItem(SESSION_FLAG_KEY);
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const fetchUserProfile = async (): Promise<User> => {
        const res = await API.get('/users/me');
        return res.data?.data;
    };

    const refreshSession = async (): Promise<{ success: boolean; user?: User }> => {
        try {
            const response = await API.post('/auth/refresh');
            const token: string | undefined = response.data?.data?.access_token;
            if (token) {
                setAccessToken(token);
                API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const userData = await fetchUserProfile();
                setUser(userData);
                localStorage.setItem(SESSION_FLAG_KEY, 'true');
                return { success: true, user: userData };
            }
            throw new Error('No token');
        } catch (err) {
            localStorage.removeItem(SESSION_FLAG_KEY);
            return { success: false };
        }
    };

    // ---------- Auth endpoints ----------
    const login = async (email: string, password: string): Promise<AuthActionResult> => {
        setLoading(true);
        try {
            const res = await API.post('/auth/login', { email, password });
            const data = res.data?.data;
            if (data?.mfa_required) {
                setMfaRequired(true);
                setMfaTempToken(data.mfa_temp_token);
                setLoading(false);
                return { mfaRequired: true };
            }
            const token = data?.access_token;
            if (token) {
                localStorage.setItem(SESSION_FLAG_KEY, 'true');
                setAccessToken(token);
                API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                const userData = await fetchUserProfile();
                setUser(userData);
                setLoading(false);
                return { success: true, user: userData };
            }
            throw new Error('No access token');
        } catch (err) {
            setLoading(false);
            throw err;
        }
    };

    const verifyMfa = async (code: string): Promise<AuthActionResult> => {
        if (!mfaTempToken) throw new Error('No MFA session');
        const res = await API.post('/auth/mfa/login/verify', { mfaTempToken, code });
        const token = res.data?.data?.access_token;
        if (token) {
            localStorage.setItem(SESSION_FLAG_KEY, 'true');
            setAccessToken(token);
            API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            const userData = await fetchUserProfile();
            setUser(userData);
            setMfaRequired(false);
            setMfaTempToken(null);
            return { success: true, user: userData };
        }
        throw new Error('No access token');
    };

    const resetMfa = (): void => {
        setMfaRequired(false);
        setMfaTempToken(null);
    };

    const logout = async (): Promise<void> => {
        try {
            await API.post('/auth/logout');
        } catch {
            // ignore
        }
        localStorage.removeItem(SESSION_FLAG_KEY);
        setAccessToken(null);
        setUser(null);
        delete API.defaults.headers.common.Authorization;
        setMfaRequired(false);
        setMfaTempToken(null);
    };

    const register = async (data: Partial<RegisterPayload>): Promise<AuthActionResult> => {
        const res = await API.post('/auth/register', data);
        return res.data?.data;
    };

    const verifyEmail = async (email: string, code: string): Promise<AuthActionResult> => {
        const res = await API.post('/auth/verify-email', { email, code });
        return res.data?.data;
    };

    const resendVerification = async (email: string): Promise<void> => {
        await API.post('/auth/resend-verification', { email });
    };

    const forgotPassword = async (email: string): Promise<void> => {
        await API.post('/auth/forgot-password', { email });
    };

    const resetPassword = async (email: string, code: string, newPassword: string): Promise<void> => {
        await API.post('/auth/reset-password', { email, code, new_password: newPassword });
    };

    const setupMfa = async (): Promise<unknown> => {
        const res = await API.post('/auth/mfa/totp/setup');
        return res.data?.data;
    };

    const confirmMfa = async (code: string): Promise<unknown> => {
        const res = await API.post('/auth/mfa/totp/verify', { code });
        return res.data?.data;
    };

    const guardianApprove = async (
        rawToken: string,
        decision: string,
        guardianFullName: string,
        relationship: string
    ): Promise<unknown> => {
        const res = await API.post('/auth/guardian/approve', {
            rawToken,
            decision,
            guardianFullName,
            relationship,
        });
        return res.data?.data;
    };

    // ---------- User profile endpoints ----------

    /**
     * Generic profile updater. Backs the `useNav()` compatibility setters
     * (setUserName, setUserPhone, ...) used by legacy pages such as Profile.tsx.
     * Assumes a PATCH /users/me endpoint mirroring the existing GET /users/me.
     */
    const updateProfile = async (data: ProfileUpdatePayload): Promise<User | undefined> => {
        try {
            const res = await API.patch('/users/me', data);
            const updated: User | undefined = res.data?.data;
            if (updated) {
                setUser(updated);
                return updated;
            }
            // Fall back to optimistic local update if the API doesn't echo the user back
            setUser((prev) => (prev ? { ...prev, ...data } as User : prev));
            return undefined;
        } catch (err) {
            // Optimistic local update so the UI still reflects the change even if the
            // backend route above doesn't exist yet in your API.
            setUser((prev) => (prev ? { ...prev, ...data } as User : prev));
            throw err;
        }
    };

    const uploadProfilePicture = async (file: File): Promise<unknown> => {
        const formData = new FormData();
        formData.append('image', file);
        const res = await API.patch('/users/me/profile-picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const updatedUser = await fetchUserProfile();
        setUser(updatedUser);
        return res.data?.data;
    };

    const getProfilePictureUrl = (userId: string): string => {
        return `${API.defaults.baseURL}/users/${userId}/profile-picture`;
    };

    // ---------- Google OAuth ----------
    const googleLogin = (): void => {
        window.location.href = `${API.defaults.baseURL}/auth/google`;
    };

    const googleRegisterConfirm = async (data: unknown): Promise<unknown> => {
        const res = await API.post('/auth/google/register/confirm', data);
        return res.data?.data;
    };

    const googleLinkConfirm = async (data: unknown): Promise<unknown> => {
        const res = await API.post('/auth/google/link/confirm', data);
        return res.data?.data;
    };

    const googleGuardianEmail = async (data: unknown): Promise<unknown> => {
        const res = await API.post('/auth/google/guardian-email', data);
        return res.data?.data;
    };

    const value: AuthContextType = {
        user,
        loading,
        accessToken,
        login,
        verifyMfa,
        resetMfa,
        logout,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        setupMfa,
        confirmMfa,
        mfaRequired,
        mfaTempToken,
        guardianApprove,
        updateProfile,
        uploadProfilePicture,
        getProfilePictureUrl,
        googleLogin,
        googleRegisterConfirm,
        googleLinkConfirm,
        googleGuardianEmail,
        refreshSession,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}



