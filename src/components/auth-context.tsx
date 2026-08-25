'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api, { handleApiError } from '@/lib/api-client';

export type AuthUser = {
  id: string;
  firstName: string;
  lastName: string;
  gender?: string;
  username: string;
  mobile?: string;
  countryCode?: string;
  email: string;
  role?: 'customer' | 'admin' | 'manager';
  avatarUrl?: string;
  emailVerified?: boolean;
  createdAt?: string;
};

export type AuthResponse = {
  success: boolean;
  message: string;
  role?: 'customer' | 'admin' | 'manager';
  requiresOtp?: boolean;
  maskedMobile?: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (
    identifier: string,
    password: string,
    role?: 'customer' | 'admin' | 'manager',
    method?: 'email' | 'username'
  ) => Promise<AuthResponse>;
  verifyLogin: (identifier: string, otp: string) => Promise<AuthResponse>;
  signup: (input: {
    firstName: string;
    lastName: string;
    gender: string;
    username: string;
    mobile: string;
    email: string;
    password: string;
    avatarUrl?: string;
    verificationCode?: string;
  }) => Promise<AuthResponse>;
  resendVerificationCode: (email: string) => Promise<AuthResponse>;
  verifyAccount: (email: string, code: string) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  recoverUsername: (email: string) => Promise<AuthResponse>;
  recoverPassword: (email: string) => Promise<AuthResponse>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const protectedRoutePrefixes = ['/dashboard', '/account'];
const publicRoutePaths = [
  '/',
  '/about',
  '/auth',
  '/checkout',
  '/contact',
  '/login',
  '/quiz',
  '/shop',
];
const publicRoutePrefixes = [
  '/about',
  '/checkout',
  '/quiz',
  '/shop',
  '/contact',
];
const publicAssetPrefixes = [
  '/_next',
  '/api',
  '/images',
  '/fonts',
  '/icons',
  '/favicon',
  '/robots.txt',
  '/sitemap.xml',
];

function isProtectedRoute(pathname: string) {
  return protectedRoutePrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

function isPublicRoute(pathname: string) {
  return (
    publicRoutePaths.includes(pathname) ||
    publicRoutePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  );
}

function isPublicAssetRoute(pathname: string) {
  return publicAssetPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

function getDashboardRedirectPath(role?: string) {
  if (role === 'manager') return '/dashboard/manager';
  if (role === 'admin') return '/dashboard/admin';
  return '/dashboard/customer';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ user?: AuthUser | null }>('/api/auth/me');
      setUser(data?.user ?? null);
    } catch (error) {
      const normalized = handleApiError(
        error,
        'Unable to verify your session.'
      );
      if (normalized.status === 401 || normalized.status === 403) {
        setUser(null);
      } else {
        setUser(null);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        await refreshSession();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [refreshSession]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const currentPath = pathname ?? '/';

    if (isPublicRoute(currentPath) || isPublicAssetRoute(currentPath)) {
      if ((currentPath === '/login' || currentPath === '/auth') && user) {
        router.replace(getDashboardRedirectPath(user.role));
      }
      return;
    }

    if (isProtectedRoute(currentPath) && !user) {
      router.replace('/login');
      return;
    }
  }, [loading, pathname, router, user]);

  const login = useCallback(
    async (
      identifier: string,
      password: string,
      role?: 'customer' | 'admin' | 'manager',
      method: 'email' | 'username' = 'email'
    ): Promise<AuthResponse> => {
      try {
        const data = await api.post<{
          requiresOtp?: boolean;
          maskedMobile?: string;
          user?: AuthUser;
        }>('/api/auth/login', { identifier, password, role, method });
        if (data?.requiresOtp) {
          return {
            success: true,
            requiresOtp: true,
            maskedMobile: data.maskedMobile,
            message: `A verification code was sent to ${data.maskedMobile ?? 'your mobile'}.`,
          };
        }
        const nextUser = data?.user ?? null;
        if (!nextUser) {
          return {
            success: false,
            message:
              'Unable to sign in. Please check your credentials and try again.',
          };
        }
        setUser(nextUser);
        return {
          success: true,
          message: `Welcome back, ${nextUser.firstName || 'friend'}`,
          role: nextUser.role,
        };
      } catch (error) {
        const normalized = handleApiError(error, 'Login failed');
        return { success: false, message: normalized.message };
      }
    },
    []
  );

  const verifyLogin = useCallback(
    async (identifier: string, otp: string): Promise<AuthResponse> => {
      try {
        const data = await api.post<{ user?: AuthUser }>(
          '/api/auth/verify-login',
          { identifier, otp }
        );
        if (data?.user) {
          setUser(data.user);
          return {
            success: true,
            message: `Welcome back, ${data.user.firstName || 'friend'}`,
            role: data.user.role,
          };
        }
        return {
          success: false,
          message: 'Verification could not be completed.',
        };
      } catch (error) {
        const normalized = handleApiError(error, 'Verification failed');
        return { success: false, message: normalized.message };
      }
    },
    []
  );

  const signup = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      gender: string;
      username: string;
      mobile: string;
      email: string;
      password: string;
      avatarUrl?: string;
      verificationCode?: string;
    }): Promise<AuthResponse> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      try {
        const resp = await api.post<{ user?: AuthUser }>(
          '/api/auth/signup',
          input,
          { signal: controller.signal }
        );
        if (resp && resp.user) {
          return {
            success: true,
            message: `Your account is ready, ${resp.user.firstName || 'friend'}.`,
          };
        }
        return {
          success: false,
          message: 'Unable to create your account. Please try again.',
        };
      } catch (error) {
        const normalized = handleApiError(error, 'Signup failed');
        return { success: false, message: normalized.message };
      } finally {
        clearTimeout(timeout);
      }
    },
    []
  );

  const resendVerificationCode = useCallback(
    async (email: string): Promise<AuthResponse> => {
      try {
        await api.post('/api/auth/resend-verification', { email });
        return {
          success: true,
          message: `A fresh verification code was sent to ${email}.`,
        };
      } catch {
        return { success: false, message: 'Unable to send verification code.' };
      }
    },
    []
  );

  const verifyAccount = useCallback(
    async (email: string, code: string): Promise<AuthResponse> => {
      try {
        const resp = await api.post<{ user?: AuthUser }>(
          '/api/auth/verify-account',
          { email, code }
        );
        if (resp?.user) {
          setUser(resp.user);
          return {
            success: true,
            message: 'Your account has been verified successfully.',
          };
        }
      } catch (error) {
        const normalized = handleApiError(error, 'Verification failed');
        return { success: false, message: normalized.message };
      }
      return {
        success: false,
        message: 'Verification could not be completed.',
      };
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignore
    }
    setUser(null);
    router.replace('/login');
  }, [router]);

  const recoverUsername = useCallback(
    async (email: string): Promise<AuthResponse> => {
      try {
        await api.post('/api/auth/forgot-username', { email });
        return {
          success: true,
          message: `If an account exists, recovery instructions have been sent to ${email}.`,
        };
      } catch {
        return { success: false, message: 'Unable to process request.' };
      }
    },
    []
  );

  const recoverPassword = useCallback(
    async (email: string): Promise<AuthResponse> => {
      try {
        await api.post('/api/auth/forgot-password', { email });
        return {
          success: true,
          message: `If an account exists, a reset link will be sent to ${email}.`,
        };
      } catch {
        return { success: false, message: 'Unable to process request.' };
      }
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      login,
      verifyLogin,
      signup,
      resendVerificationCode,
      verifyAccount,
      logout,
      refreshSession,
      recoverUsername,
      recoverPassword,
    }),
    [
      loading,
      user,
      login,
      verifyLogin,
      signup,
      resendVerificationCode,
      verifyAccount,
      logout,
      refreshSession,
      recoverUsername,
      recoverPassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
