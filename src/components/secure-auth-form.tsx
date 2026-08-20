"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  loginSchema,
  normalizePhoneNumber,
  signupSchema,
  type LoginFormValues,
  type SignupFormValues,
  isPhoneNumberValid,
  isSignupFormReady,
} from "@/lib/auth-validation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Camera,
  LoaderCircle,
  UploadCloud,
  Check,
  X,
} from "lucide-react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { useAuth } from "@/components/auth-context";
import { ForgotPasswordModal, ForgotUsernameModal } from "@/components/ForgotModals";
import OtpInput from "@/components/otp-input";

const genderOptions = ["Male", "Female", "Non-binary", "Prefer not to say", "Another identity"];

const loginModeOptions = [
  { id: "email", label: "Email + Password" },
  { id: "username", label: "Username + Password" },
] as const;

const loginRoleOptions = [
  { id: "customer", label: "Customer" },
  { id: "manager", label: "Manager" },
  { id: "admin", label: "Admin" },
] as const;

// LoginMode and LoginRole are defined in shared validation module; use those types there.

type AuthView = "login" | "signup" | "recover-username" | "recover-password";

type AvailabilityState = "idle" | "checking" | "available" | "taken" | "invalid";

const defaultLoginValues: LoginFormValues = {
  loginMode: "email",
  role: "customer",
  identifier: "",
  password: "",
};

const defaultSignupValues: SignupFormValues = {
  firstName: "",
  lastName: "",
  gender: "",
  username: "",
  mobile: "",
  email: "",
  password: "",
  confirmPassword: "",
  avatarUrl: "",
};

const generateVerificationCode = () => String(Math.floor(100000 + Math.random() * 900000)).padStart(6, "0");

export default function SecureAuthForm({ onAuthenticated }: { onAuthenticated?: (role?: string) => void } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') ?? undefined;
  const shouldReduceMotion = useReducedMotion();
  const { login, signup, resendVerificationCode, verifyAccount } = useAuth();
  const [view, setView] = useState<AuthView>("login");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showForgotUsernameModal, setShowForgotUsernameModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "success">("idle");
  const [verificationStep, setVerificationStep] = useState<"form" | "verification">("form");
  const [pendingEmail, setPendingEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState("");
  const [activeVerificationCode, setActiveVerificationCode] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<AvailabilityState>("idle");
  const [emailStatus, setEmailStatus] = useState<AvailabilityState>("idle");
  const [firstNameStatus, setFirstNameStatus] = useState<AvailabilityState>("idle");
  const [lastNameStatus, setLastNameStatus] = useState<AvailabilityState>("idle");
  const [mobileStatus, setMobileStatus] = useState<AvailabilityState>("idle");

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    control: loginControl,
    formState: { errors: loginErrors, isSubmitting: loginSubmitting },
    setValue: setLoginValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: defaultLoginValues,
    mode: "onChange",
  });

  const {
    register: registerSignup,
    handleSubmit: handleSignupSubmit,
    setValue: setSignupValue,
    control: signupControl,
    formState: { errors: signupErrors, isValid: signupIsValid, isSubmitting: signupSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: defaultSignupValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const loginMode = useWatch({ control: loginControl, name: "loginMode", defaultValue: defaultLoginValues.loginMode });
  const loginRole = useWatch({ control: loginControl, name: "role", defaultValue: defaultLoginValues.role });
  const signupValues = useWatch({ control: signupControl, defaultValue: defaultSignupValues }) as SignupFormValues;
  const signupPassword = signupValues.password ?? defaultSignupValues.password;
  const signupConfirmPassword = signupValues.confirmPassword ?? defaultSignupValues.confirmPassword;

  const passwordStrength = useMemo(() => {
    const value = signupPassword ?? "";
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    const percent = Math.min((score / 4) * 100, 100);
    if (score <= 1) return { label: "Weak", tone: "text-[#e76f51]", percent, bar: "bg-[#e76f51]", score };
    if (score <= 2) return { label: "Fair", tone: "text-[#c9854d]", percent, bar: "bg-[#c9854d]", score };
    if (score <= 3) return { label: "Good", tone: "text-[#d4a373]", percent, bar: "bg-[#d4a373]", score };
    return { label: "Very Strong", tone: "text-[#2f7d4a]", percent, bar: "bg-[#2f7d4a]", score };
  }, [signupPassword]);

  const usernameRequirements = useMemo(() => {
    const value = signupValues.username ?? "";
    return [
      { label: "At least 4 characters", valid: value.length >= 4 },
      { label: "One uppercase letter", valid: /[A-Z]/.test(value) },
      { label: "One lowercase letter", valid: /[a-z]/.test(value) },
      { label: "One digit", valid: /\d/.test(value) },
    ];
  }, [signupValues.username]);

  const passwordRequirements = useMemo(() => {
    const value = signupPassword ?? "";
    return [
      { label: "At least 8 characters", valid: value.length >= 8 },
      { label: "One uppercase letter", valid: /[A-Z]/.test(value) },
      { label: "One lowercase letter", valid: /[a-z]/.test(value) },
      { label: "One number", valid: /\d/.test(value) },
      { label: "One special character", valid: /[^A-Za-z0-9]/.test(value) },
    ];
  }, [signupPassword]);

  const confirmPasswordState = useMemo(() => {
    if (!signupConfirmPassword) return "idle";
    return signupConfirmPassword === signupPassword ? "match" : "mismatch";
  }, [signupConfirmPassword, signupPassword]);

  const isSignupReady = useMemo(() => {
    const values = signupValues;
    const readiness = isSignupFormReady({
      firstName: values.firstName ?? '',
      lastName: values.lastName ?? '',
      gender: values.gender ?? '',
      username: values.username ?? '',
      mobile: values.mobile ?? '',
      email: values.email ?? '',
      password: values.password ?? '',
      confirmPassword: values.confirmPassword ?? '',
      avatarUrl: values.avatarUrl ?? '',
    });

    // Removed unused debugDisabledState variable

    // debug log removed to avoid leaking internal state in dev

    return readiness && signupIsValid;
  }, [signupIsValid, signupValues]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const firstNameValue = (signupValues.firstName ?? "").trim();
      if (!firstNameValue) {
        setFirstNameStatus("idle");
      } else {
        setFirstNameStatus("available");
      }

      const lastNameValue = (signupValues.lastName ?? "").trim();
      if (!lastNameValue) {
        setLastNameStatus("idle");
      } else {
        setLastNameStatus("available");
      }

      const usernameValue = (signupValues.username ?? "").trim();
      if (!usernameValue) {
        setUsernameStatus("idle");
      } else if (!usernameRequirements.every((rule) => rule.valid)) {
        setUsernameStatus("invalid");
      } else {
        // mark as checking then call server to confirm availability
        setUsernameStatus("checking");
        (async (value) => {
          try {
            const resp = await fetch(`/api/auth/check-username?username=${encodeURIComponent(value)}`);
            const json = await resp.json();
            if ((signupValues.username ?? "").trim() === value) {
              setUsernameStatus(json?.ok && json.data && json.data.available ? "available" : "taken");
            }
          } catch {
            if ((signupValues.username ?? "").trim() === value) setUsernameStatus("invalid");
          }
        })(usernameValue);
      }

      const emailValue = (signupValues.email ?? "").trim();
      if (!emailValue) {
        setEmailStatus("idle");
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
        setEmailStatus("invalid");
      } else {
        setEmailStatus("checking");
        (async (value) => {
          try {
            const resp = await fetch(`/api/auth/check-email?email=${encodeURIComponent(value)}`);
            const json = await resp.json();
            if ((signupValues.email ?? "").trim() === value) {
              setEmailStatus(json?.ok && json.data && json.data.available ? "available" : "taken");
            }
          } catch {
            if ((signupValues.email ?? "").trim() === value) setEmailStatus("invalid");
          }
        })(emailValue);
      }

      const mobileValue = (signupValues.mobile ?? "").trim();
      if (!mobileValue) {
        setMobileStatus("idle");
      } else if (!isPhoneNumberValid(mobileValue)) {
        setMobileStatus("invalid");
      } else {
        setMobileStatus("checking");
        (async (value) => {
          try {
            const resp = await fetch(`/api/auth/check-mobile?mobile=${encodeURIComponent(value)}`);
            const json = await resp.json();
            if ((signupValues.mobile ?? "").trim() === value) {
              setMobileStatus(json?.ok && json.data && json.data.available ? "available" : "taken");
            }
          } catch {
            if ((signupValues.mobile ?? "").trim() === value) setMobileStatus("invalid");
          }
        })(mobileValue);
      }
    }, 450);

    return () => window.clearTimeout(timeout);
  }, [signupValues.email, signupValues.firstName, signupValues.lastName, signupValues.mobile, signupValues.username, usernameRequirements]);

  const onLogin = async (values: LoginFormValues) => {
    setSubmitState('loading');
    setIsSubmitting(true);
    setMessage(null);
    const result = await login(values.identifier, values.password, values.role);
    await new Promise((resolve) => window.setTimeout(resolve, 650));
    setMessage({ type: result.success ? 'success' : 'error', text: result.message });
    setSubmitState(result.success ? 'success' : 'idle');
    setIsSubmitting(false);
    if (result.success) {
      const nextPath = callbackUrl && callbackUrl.startsWith('/')
        ? callbackUrl
        : result.role === 'manager'
          ? '/dashboard/manager'
          : result.role === 'admin'
            ? '/dashboard/admin'
            : '/dashboard/customer';

      if (onAuthenticated) {
        try {
          onAuthenticated(result.role);
        } catch {
          // ignore
        }
      }

      router.replace(nextPath);
    }
  };

  const onSignup = async (values: SignupFormValues) => {
    if (!isSignupReady) {
      setMessage({ type: "error", text: "Please complete every required field before creating your account." });
      return;
    }

    setSubmitState("loading");
    setIsSubmitting(true);
    setMessage(null);
    setVerificationError("");
    if (process.env.NODE_ENV !== 'production') {
      console.debug('[auth][signup][submit]', {
        firstName: values.firstName,
        lastName: values.lastName,
        username: values.username,
        email: values.email,
        mobile: normalizePhoneNumber(values.mobile),
        avatarUrl: values.avatarUrl || null,
        isValid: signupIsValid,
        isReady: isSignupReady,
      });
    }

    try {
      const result = await signup({
        ...values,
        avatarUrl: values.avatarUrl || undefined,
      });
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      if (result.success) {
        setPendingEmail(values.email.toLowerCase());
        setActiveVerificationCode(result.verificationCode ?? '');
        setVerificationStep("verification");
        setSubmitState("success");
        setMessage({ type: "success", text: "Your secure verification code is ready. Enter it to activate your account." });
        return;
      }
      setMessage({ type: "error", text: result.message });
      setSubmitState("idle");
    } catch (err) {
      setMessage({ type: "error", text: (err instanceof Error && err.message) ? err.message : 'Signup failed' });
      setSubmitState("idle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!/^\d{6}$/.test(verificationCode)) {
      setVerificationError("Enter the exact 6-digit verification code.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await verifyAccount(pendingEmail, verificationCode);
      await new Promise((resolve) => window.setTimeout(resolve, 700));
      if (result.success) {
          const nextPath = callbackUrl && callbackUrl.startsWith('/')
            ? callbackUrl
            : result.role === "manager"
              ? "/dashboard/manager"
              : result.role === "admin"
                ? "/dashboard/admin"
                : "/dashboard/customer";

          if (onAuthenticated) {
            onAuthenticated(result.role);
          }

          router.replace(nextPath);
          router.refresh();
          return;
        }
      setVerificationError(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail) return;
    setIsSubmitting(true);
    const nextCode = generateVerificationCode();
    setActiveVerificationCode(nextCode);
    const result = await resendVerificationCode(pendingEmail, nextCode);
    await new Promise((resolve) => window.setTimeout(resolve, 600));
    setMessage({ type: result.success ? "success" : "error", text: result.message });
    setIsSubmitting(false);
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    (async () => {
      try {
        const formData = new FormData();
        formData.append('avatar', file);

        const controller = new AbortController();
        const to = window.setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), 15000);
        const resp = await fetch('/api/auth/upload-avatar', { method: 'POST', body: formData, signal: controller.signal });
        clearTimeout(to);
        const json = await resp.json();
        if (json?.ok && json.data && json.data.url) {
          setAvatarPreview(json.data.url);
          setSignupValue('avatarUrl', json.data.url);
        } else {
          setSignupValue('avatarUrl', '');
        }
      } catch {
        setSignupValue('avatarUrl', '');
      }
    })();
  };

  const renderMessage = () => {
    if (!message) return null;
    const isSuccess = message.type === "success";
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`mt-4 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${isSuccess ? "border-[#2f7d4a]/20 bg-[#f3fbf6] text-[#2f7d4a]" : "border-[#e76f51]/20 bg-[#fff7f5] text-[#b24c33]"}`}
      >
        {isSuccess ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
        <span>{message.text}</span>
      </motion.div>
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-4xl border border-[#d4a373]/20 bg-[#f9f6f0] p-6 shadow-[0_12px_40px_-24px_rgba(43,29,23,0.35)] sm:p-8 lg:p-10 dark:bg-[#23110c]"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d4a373]/25 bg-white/70 px-3 py-1.5 text-sm font-medium text-[#b56e3b] dark:bg-[#2b1a13]">
            <Sparkles size={16} />
            Crafted for calm, confident shopping
          </div>
          <h1 className="mt-6 font-serif text-4xl text-[#1a0f0a] dark:text-[#f6e5d1] sm:text-5xl">
            Welcome to your secure AromaCraft account.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#6e4b33] dark:text-[#e8d8c0]">
            Sign in or create an account to save favorites, track orders, and experience a more personal coffee ritual.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Secure checkout",
              "Personalized roasts",
              "Favorites saved instantly",
              "Early access to exclusives",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-[#d4a373]/20 bg-white/70 p-4 text-sm text-[#5f473d] dark:bg-[#29130d]">
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-4xl border border-[#d4a373]/20 bg-white/80 p-5 shadow-[0_18px_50px_-24px_rgba(43,29,23,0.35)] sm:p-8 dark:bg-[#1a0f0a]"
        >
          <div className="relative flex gap-2 rounded-full border border-[#d4a373]/20 bg-[#f9f6f0] p-1 dark:bg-[#23110c]">
            <motion.div
              layout
              transition={{ type: "spring", stiffness: 260, damping: 28 }}
              className={`absolute left-1 top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] rounded-full bg-[#1a0f0a] shadow-[0_10px_24px_-14px_rgba(0,0,0,0.45)] dark:bg-[#f6e5d1] ${view === "signup" ? "translate-x-full" : "translate-x-0"}`}
            />
            {[{ id: "login", label: "Login" }, { id: "signup", label: "Sign Up" }].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setView(tab.id as AuthView);
                  setMessage(null);
                  setSubmitState("idle");
                  setVerificationStep("form");
                  setVerificationError("");
                }}
                className={`relative z-10 flex-1 rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-200 ${view === tab.id ? "text-[#f9f6f0] dark:text-[#1a0f0a]" : "text-[#6e4b33] dark:text-[#f6e5d1]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {view === "login" && verificationStep === "form" ? (
              <motion.div
                key="login-view"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                className="mt-6"
              >
                <div className="mb-4 grid gap-3">
                  {loginModeOptions.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setLoginValue("loginMode", mode.id)}
                      className={`rounded-[1.25rem] border px-4 py-3 text-left transition ${loginMode === mode.id ? "border-[#c9854d] bg-[#f7ebdb] text-[#1a0f0a] shadow-[0_10px_20px_-16px_rgba(43,29,23,0.45)]" : "border-[#d4a373]/25 bg-[#f9f6f0] text-[#6e4b33] dark:bg-[#23110c] dark:text-[#f6e5d1]"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold">{mode.label}</span>
                        {loginMode === mode.id ? <CheckCircle2 size={16} className="text-[#2f7d4a]" /> : null}
                      </div>
                      <p className="mt-1 text-sm opacity-80">{mode.id === "email" ? "Use your email address and password to continue." : "Use your username and password to continue."}</p>
                    </button>
                  ))}
                </div>

                <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]">Login as</label>
                    <div className="flex flex-wrap gap-2">
                      {loginRoleOptions.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setLoginValue("role", option.id)}
                          className={`rounded-full border px-3 py-2 text-sm transition ${loginRole === option.id ? "border-[#c9854d] bg-[#f7ebdb] text-[#1a0f0a]" : "border-[#d4a373]/25 bg-[#f9f6f0] text-[#6e4b33] dark:bg-[#23110c]"}`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]" htmlFor="login-identifier">
                      {loginMode === "email" ? "Email" : "Username"}
                    </label>
                    <div className="flex items-center rounded-[1.25rem] border border-[#d4a373]/25 bg-[#f9f6f0] px-3 py-3 dark:bg-[#23110c]">
                      <User size={16} className="mr-2 text-[#b56e3b]" />
                      <input
                        id="login-identifier"
                        placeholder={loginMode === "email" ? "name@example.com" : "Enter your username"}
                        className="w-full bg-transparent text-sm outline-none"
                        {...registerLogin("identifier")}
                      />
                    </div>
                    {loginErrors.identifier ? <p className="mt-2 text-sm text-[#e76f51]">{loginErrors.identifier.message}</p> : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]" htmlFor="login-password">
                      Password
                    </label>
                    <div className="flex items-center rounded-[1.25rem] border border-[#d4a373]/25 bg-[#f9f6f0] px-3 py-3 dark:bg-[#23110c]">
                      <Lock size={16} className="mr-2 text-[#b56e3b]" />
                      <input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="w-full bg-transparent text-sm outline-none"
                        {...registerLogin("password")}
                      />
                      <button type="button" onClick={() => setShowPassword((value) => !value)} className="ml-2 text-[#b56e3b]">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {loginErrors.password ? <p className="mt-2 text-sm text-[#e76f51]">{loginErrors.password.message}</p> : null}
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 text-[#6e4b33] dark:text-[#e8d8c0]">
                      <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe((value) => !value)} className="rounded border-[#d4a373]" />
                      Remember me
                    </label>
                    <div className="flex gap-3 text-[#b56e3b]">
                      <button type="button" onClick={() => setShowForgotUsernameModal(true)} className="font-medium hover:text-[#e76f51]">
                        Forgot Username?
                      </button>
                      <button type="button" onClick={() => setShowForgotPasswordModal(true)} className="font-medium hover:text-[#e76f51]">
                        Forgot Password?
                      </button>
                    </div>
                  </div>

                  {renderMessage()}
                  <motion.button
                    type="submit"
                    whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    disabled={isSubmitting || loginSubmitting}
                    className="flex w-full items-center justify-center rounded-full bg-[#1a0f0a] px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#c7b39a]"
                  >
                    {isSubmitting || loginSubmitting ? (
                      <span className="flex items-center gap-2">
                        <LoaderCircle size={16} className="animate-spin" />
                        Signing in...
                      </span>
                    ) : submitState === "success" ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 size={16} />
                        Signed in
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In
                        <ArrowRight size={16} />
                      </span>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : view === "signup" && verificationStep === "form" ? (
              <motion.div
                key="signup-view"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                className="mt-6"
              >
                <div className="mb-4 rounded-[1.25rem] border border-[#d4a373]/20 bg-[#f9f6f0] p-4 dark:bg-[#23110c]">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b56e3b]">Create account</p>
                  <p className="mt-1 text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
                    A secure, polished profile for your next coffee ritual.
                  </p>
                </div>

                <form onSubmit={handleSignupSubmit(onSignup)} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]" htmlFor="first-name">First name</label>
                    <div className="flex items-center rounded-[1.25rem] border border-[#d4a373]/25 bg-[#f9f6f0] px-3 py-3 dark:bg-[#23110c]">
                      <input id="first-name" className="w-full bg-transparent text-sm outline-none" placeholder="First name" {...registerSignup("firstName")} />
                      {firstNameStatus === "available" ? <CheckCircle2 size={16} className="text-[#2f7d4a]" /> : null}
                      {firstNameStatus === "taken" ? <X size={16} className="text-[#e76f51]" /> : null}
                    </div>
                    {signupErrors.firstName ? <p className="mt-2 text-sm text-[#e76f51]">{signupErrors.firstName.message}</p> : null}
                    {firstNameStatus === "taken" ? <p className="mt-2 text-sm text-[#e76f51]">That first name is already registered.</p> : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]" htmlFor="last-name">Last name</label>
                    <div className="flex items-center rounded-[1.25rem] border border-[#d4a373]/25 bg-[#f9f6f0] px-3 py-3 dark:bg-[#23110c]">
                      <input id="last-name" className="w-full bg-transparent text-sm outline-none" placeholder="Last name" {...registerSignup("lastName")} />
                      {lastNameStatus === "available" ? <CheckCircle2 size={16} className="text-[#2f7d4a]" /> : null}
                      {lastNameStatus === "taken" ? <X size={16} className="text-[#e76f51]" /> : null}
                    </div>
                    {signupErrors.lastName ? <p className="mt-2 text-sm text-[#e76f51]">{signupErrors.lastName.message}</p> : null}
                    {lastNameStatus === "taken" ? <p className="mt-2 text-sm text-[#e76f51]">That last name is already registered.</p> : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]">Gender</label>
                    <div className="flex flex-wrap gap-2">
                      {genderOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSignupValue("gender", option)}
                          className={`rounded-full border px-3 py-2 text-sm transition ${signupValues.gender === option ? "border-[#c9854d] bg-[#f7ebdb] text-[#1a0f0a]" : "border-[#d4a373]/25 bg-[#f9f6f0] text-[#6e4b33] dark:bg-[#23110c]"}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {signupErrors.gender ? <p className="mt-2 text-sm text-[#e76f51]">{signupErrors.gender.message}</p> : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]" htmlFor="signup-username">Username</label>
                    <div className="flex items-center rounded-[1.25rem] border border-[#d4a373]/25 bg-[#f9f6f0] px-3 py-3 dark:bg-[#23110c]">
                      <User size={16} className="mr-2 text-[#b56e3b]" />
                      <input
                        id="signup-username"
                        className="w-full bg-transparent text-sm outline-none"
                        placeholder="Choose a username"
                        onPaste={(event) => event.preventDefault()}
                        {...registerSignup("username")}
                      />
                      {usernameStatus === "available" ? <CheckCircle2 size={16} className="text-[#2f7d4a]" /> : null}
                      {usernameStatus === "taken" ? <X size={16} className="text-[#e76f51]" /> : null}
                    </div>
                    {signupErrors.username ? <p className="mt-2 text-sm text-[#e76f51]">{signupErrors.username.message}</p> : null}
                    {usernameStatus === "taken" ? <p className="mt-2 text-sm text-[#e76f51]">That username is already registered.</p> : null}
                    {usernameStatus === "available" ? <p className="mt-2 text-sm text-[#2f7d4a]">Username is available.</p> : null}
                    {signupValues.username && usernameStatus !== "available" && usernameStatus !== "idle" && usernameStatus !== "checking" ? (
                      <ul className="mt-2 space-y-1 text-sm text-[#e76f51]">
                        {usernameRequirements.map((rule) => (
                          <li key={rule.label} className="flex items-center gap-2">
                            {rule.valid ? <Check size={14} className="text-[#2f7d4a]" /> : <X size={14} className="text-[#e76f51]" />}
                            {rule.label}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]" htmlFor="signup-email">Email</label>
                    <div className="flex items-center rounded-[1.25rem] border border-[#d4a373]/25 bg-[#f9f6f0] px-3 py-3 dark:bg-[#23110c]">
                      <Mail size={16} className="mr-2 text-[#b56e3b]" />
                      <input id="signup-email" className="w-full bg-transparent text-sm outline-none" placeholder="you@example.com" {...registerSignup("email")} />
                      {emailStatus === "available" ? <CheckCircle2 size={16} className="text-[#2f7d4a]" /> : null}
                      {emailStatus === "taken" ? <X size={16} className="text-[#e76f51]" /> : null}
                    </div>
                    {signupErrors.email ? <p className="mt-2 text-sm text-[#e76f51]">{signupErrors.email.message}</p> : null}
                    {emailStatus === "taken" ? <p className="mt-2 text-sm text-[#e76f51]">That email is already registered.</p> : null}
                    {emailStatus === "available" ? <p className="mt-2 text-sm text-[#2f7d4a]">Email is available.</p> : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]">Mobile</label>
                    <Controller
                      control={signupControl}
                      name="mobile"
                      render={({ field }) => (
                        <div className="rounded-[1.25rem] border border-[#d4a373]/25 bg-[#f9f6f0] p-3 dark:bg-[#23110c]">
                          <PhoneInput
                            international
                            defaultCountry="US"
                            countryCallingCodeEditable={false}
                            limitMaxLength
                            value={field.value ?? ""}
                            onChange={(value) => field.onChange(normalizePhoneNumber(value ?? ""))}
                            className="w-full"
                            numberInputProps={{ className: "w-full bg-transparent text-sm outline-none" }}
                            onBlur={field.onBlur}
                          />
                        </div>
                      )}
                    />
                    {signupErrors.mobile ? <p className="mt-2 text-sm text-[#e76f51]">{signupErrors.mobile.message}</p> : null}
                    {mobileStatus === "available" ? <p className="mt-2 flex items-center gap-2 text-sm text-[#2f7d4a]"><CheckCircle2 size={14} /> Mobile number is available.</p> : null}
                    {mobileStatus === "taken" ? <p className="mt-2 text-sm text-[#e76f51]">That mobile number is already registered.</p> : null}
                    {mobileStatus === "invalid" ? <p className="mt-2 text-sm text-[#e76f51]">Enter a valid phone number for the selected country.</p> : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]" htmlFor="signup-password">Password</label>
                    <div className="flex items-center rounded-[1.25rem] border border-[#d4a373]/25 bg-[#f9f6f0] px-3 py-3 dark:bg-[#23110c]">
                      <Lock size={16} className="mr-2 text-[#b56e3b]" />
                      <input
                        id="signup-password"
                        type={showSignupPassword ? "text" : "password"}
                        className="w-full bg-transparent text-sm outline-none"
                        placeholder="Create a password"
                        onPaste={(event) => event.preventDefault()}
                        {...registerSignup("password")}
                      />
                      <button type="button" onClick={() => setShowSignupPassword((value) => !value)} className="ml-2 text-[#b56e3b]">
                        {showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {signupErrors.password ? <p className="mt-2 text-sm text-[#e76f51]">{signupErrors.password.message}</p> : null}
                    {signupPassword ? (
                      <div className="mt-3">
                        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-[#7a5b45] dark:text-[#d8b59a]">
                          <span>Password strength</span>
                          <span className={passwordStrength.tone}>{passwordStrength.label}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[#efe2d2]">
                          <div className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.bar}`} style={{ width: `${passwordStrength.percent}%` }} />
                        </div>
                        <ul className="mt-3 space-y-1 text-sm text-[#e76f51]">
                          {passwordRequirements.map((rule) => (
                            <li key={rule.label} className="flex items-center gap-2">
                              {rule.valid ? <Check size={14} className="text-[#2f7d4a]" /> : <X size={14} className="text-[#e76f51]" />}
                              {rule.label}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]" htmlFor="confirm-password">Confirm password</label>
                    <div className="flex items-center rounded-[1.25rem] border border-[#d4a373]/25 bg-[#f9f6f0] px-3 py-3 dark:bg-[#23110c]">
                      <Lock size={16} className="mr-2 text-[#b56e3b]" />
                      <input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        className="w-full bg-transparent text-sm outline-none"
                        placeholder="Repeat password"
                        onPaste={(event) => event.preventDefault()}
                        {...registerSignup("confirmPassword")}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword((value) => !value)} className="ml-2 text-[#b56e3b]">
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {signupErrors.confirmPassword ? <p className="mt-2 text-sm text-[#e76f51]">{signupErrors.confirmPassword.message}</p> : null}
                    {confirmPasswordState === "match" ? <p className="mt-2 flex items-center gap-2 text-sm text-[#2f7d4a]"><Check size={14} /> Passwords match</p> : null}
                    {confirmPasswordState === "mismatch" ? <p className="mt-2 flex items-center gap-2 text-sm text-[#e76f51]"><X size={14} /> Passwords do not match</p> : null}
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-[#3d2d24] dark:text-[#f6e5d1]" htmlFor="avatar-url">
                      <Camera size={16} /> Profile photo (optional)
                    </label>
                    <motion.label
                      htmlFor="avatar-url"
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragActive(true);
                      }}
                      onDragLeave={() => setDragActive(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragActive(false);
                        const file = event.dataTransfer.files?.[0];
                        if (!file) return;

                        const previewUrl = URL.createObjectURL(file);
                        setAvatarPreview(previewUrl);

                        (async () => {
                          try {
                            const formData = new FormData();
                            formData.append('avatar', file);

                            const controller = new AbortController();
                            const to = window.setTimeout(() => controller.abort(new DOMException('timeout', 'TimeoutError')), 15000);
                            const resp = await fetch('/api/auth/upload-avatar', { method: 'POST', body: formData, signal: controller.signal });
                            clearTimeout(to);
                            const json = await resp.json();
                            if (json?.ok && json.data && json.data.url) {
                              setAvatarPreview(json.data.url);
                              setSignupValue('avatarUrl', json.data.url);
                            } else {
                              setSignupValue('avatarUrl', '');
                            }
                          } catch {
                            setSignupValue('avatarUrl', '');
                          }
                        })();
                      }}
                      className={`flex cursor-pointer items-center justify-center gap-3 rounded-[1.4rem] border border-dashed px-4 py-5 text-center transition-all duration-200 ${dragActive ? "border-[#c9854d] bg-[#f7ebdb] shadow-[0_10px_24px_-18px_rgba(43,29,23,0.35)]" : "border-[#d4a373]/30 bg-[#f9f6f0]/90 dark:bg-[#23110c]"}`}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1a0f0a] text-[#f9f6f0]">
                        <UploadCloud size={18} />
                      </div>
                      <div>
                        <p className="font-semibold text-[#1a0f0a] dark:text-[#f6e5d1]">Upload photo</p>
                        <p className="text-sm text-[#6e4b33] dark:text-[#e8d8c0]">Drag and drop or browse for a profile image</p>
                      </div>
                    </motion.label>
                    <input id="avatar-url" type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    {avatarPreview ? (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 flex items-center gap-3 rounded-[1.25rem] border border-[#d4a373]/20 bg-[#f9f6f0] p-3 dark:bg-[#23110c]">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-[#d4a373]/20 bg-[#fffaf4]">
                          <Image src={avatarPreview} alt="Avatar preview" width={56} height={56} unoptimized className="h-full w-full object-cover" />
                        </div>
                        <p className="text-sm text-[#6e4b33] dark:text-[#e8d8c0]">Your avatar preview is ready.</p>
                      </motion.div>
                    ) : null}
                  </div>

                  {renderMessage()}
                  <motion.button
                    type="submit"
                    whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                    disabled={isSubmitting || signupSubmitting || !isSignupReady}
                    className="flex w-full items-center justify-center rounded-full bg-[#e76f51] px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#c7b39a]"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <LoaderCircle size={16} className="animate-spin" />
                        Preparing account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Create Account
                        <ArrowRight size={16} />
                      </span>
                    )}
                  </motion.button>
                </form>
              </motion.div>
            ) : verificationStep === "verification" ? (
              <motion.div
                key="verification-view"
                initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.28 }}
                className="mt-6 space-y-4"
              >
                <div className="rounded-[1.25rem] border border-[#d4a373]/20 bg-[#f9f6f0] p-4 dark:bg-[#23110c]">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b56e3b]">Verify your email</p>
                  <p className="mt-2 text-sm text-[#6e4b33] dark:text-[#e8d8c0]">
                    Enter the exact 6-digit code we sent to {pendingEmail}.
                  </p>
                  <div className="mt-3 rounded-2xl border border-[#d4a373]/20 bg-white/70 p-3 text-sm text-[#5f473d] dark:bg-[#29130d] dark:text-[#e8d8c0]">
                    <p className="font-semibold">Mock verification email</p>
                    <p className="mt-1">Subject: Verify your AromaCraft account</p>
                    <p className="mt-1">Hello {signupValues.firstName || "friend"}, your secure code is {activeVerificationCode || "••••••••"}.</p>
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#3d2d24] dark:text-[#f6e5d1]" htmlFor="verification-code">Verification code</label>
                  <OtpInput value={verificationCode} onChange={(value) => { setVerificationCode(value); if (verificationError) setVerificationError(""); }} error={Boolean(verificationError)} />
                  {verificationError ? <p className="mt-2 text-sm text-[#e76f51]">{verificationError}</p> : null}
                </div>
                {renderMessage()}
                <motion.button
                  type="button"
                  onClick={handleVerify}
                  whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.01 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.98 }}
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center rounded-full bg-[#1a0f0a] px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[#c7b39a]"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle size={16} className="animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Verify account
                      <ArrowRight size={16} />
                    </span>
                  )}
                </motion.button>
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={handleResend} className="font-medium text-[#b56e3b]">
                    Resend code
                  </button>
                  <button type="button" onClick={() => {
                    setVerificationStep("form");
                    setVerificationCode("");
                    setVerificationError("");
                    setMessage(null);
                  }} className="font-medium text-[#b56e3b]">
                    Back to sign up
                  </button>
                </div>
              </motion.div>
            ) : null }
          </AnimatePresence>
        </motion.div>
      </div>
      <ForgotPasswordModal open={showForgotPasswordModal} onClose={() => setShowForgotPasswordModal(false)} />
      <ForgotUsernameModal open={showForgotUsernameModal} onClose={() => setShowForgotUsernameModal(false)} />
    </div>
  );
}
