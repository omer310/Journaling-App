"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useSignIn } from "@clerk/nextjs/legacy";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SocialAuth } from "@/components/SocialAuth";
import { monitoringUtils } from "@/lib/securityMonitoring";
import { useRateLimit } from "@/lib/rateLimiter";
import {
  RiArrowRightLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLockLine,
  RiMailLine,
} from "react-icons/ri";
import "./page.css";

const getClerkErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as { errors?: Array<{ message?: string; code?: string }> }).errors)
  ) {
    const firstError = (error as { errors: Array<{ message?: string; code?: string }> }).errors[0];
    const code = firstError?.code || "";
    const message = firstError?.message || "";

    if (code.includes("form_password_incorrect") || message.includes("Password is incorrect")) {
      return "Invalid email or password. Please try again.";
    }

    if (code.includes("form_identifier_not_found")) {
      return "Invalid email or password. Please try again.";
    }

    if (message) {
      return message;
    }
  }

  return "Failed to log in. Please try again.";
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, setActive, isLoaded: signInLoaded } = useSignIn();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  const {
    checkLimit: isLoginAllowed,
    recordAttempt: recordLoginAttempt,
    getStatus: getLoginStatus,
  } = useRateLimit("LOGIN_ATTEMPTS", email);

  const [currentStatus, setCurrentStatus] = useState({
    remainingAttempts: 5,
    timeUntilReset: 0,
    isLocked: false,
  });

  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.push("/");
    }
  }, [authLoaded, isSignedIn, router]);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason) {
      setError(reason);
    }
  }, []);

  useEffect(() => {
    const updateStatus = () => {
      const status = getLoginStatus();
      setCurrentStatus((previousStatus) => {
        if (
          previousStatus.remainingAttempts !== status.remainingAttempts ||
          previousStatus.timeUntilReset !== status.timeUntilReset ||
          previousStatus.isLocked !== status.isLocked
        ) {
          return {
            remainingAttempts: status.remainingAttempts,
            timeUntilReset: status.timeUntilReset,
            isLocked: status.isLocked,
          };
        }

        return previousStatus;
      });
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [email, getLoginStatus]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!signInLoaded || !signIn || loading) {
      return;
    }

    if (!isLoginAllowed()) {
      const status = getLoginStatus();
      const minutes = Math.ceil(status.timeUntilReset / 60000);
      setError(`Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        throw new Error("Additional verification is required before signing in.");
      }

      await setActive({ session: result.createdSessionId });

      monitoringUtils.recordEvent(
        "LOGIN_SUCCESS",
        { userAgent: navigator.userAgent },
        "LOW",
        undefined,
        email
      );

      router.push("/");
    } catch (error) {
      recordLoginAttempt();
      monitoringUtils.recordFailedLogin(email, {
        reason: error instanceof Error ? error.message : "Unknown login error",
        userAgent: navigator.userAgent,
      });
      setError(getClerkErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    if (ms <= 0) return "0s";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  if (!authLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-6" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Checking Authentication</h2>
          <p className="text-text-secondary">Please wait...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-black/80 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/10 dark:shadow-black/30">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="mt-2 text-secondary">Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {currentStatus.remainingAttempts < 5 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-xl text-sm">
                <div className="flex items-center justify-between">
                  <span>Login attempts remaining: {currentStatus.remainingAttempts}</span>
                  {currentStatus.timeUntilReset > 0 && (
                    <span className="text-xs">Resets in {formatTime(currentStatus.timeUntilReset)}</span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <RiMailLine className="h-5 w-5 text-secondary" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface/50 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-surface/80"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <RiLockLine className="h-5 w-5 text-secondary" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-surface/50 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-surface/80"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary hover:text-text-primary transition-colors duration-200"
                  disabled={loading}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <RiEyeOffLine className="h-5 w-5" /> : <RiEyeLine className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isLoginAllowed() || !signInLoaded}
              className="w-full bg-gradient-to-r from-primary to-primary-light text-white py-3.5 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : !isLoginAllowed() ? (
                  <>
                    Rate Limited
                    <RiArrowRightLine className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                ) : (
                  <>
                    Sign In
                    <RiArrowRightLine className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="social-auth-container mt-8">
            <SocialAuth disabled={loading} onError={setError} />
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-secondary">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary hover:text-primary-light font-medium transition-colors duration-200 hover:underline"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-text-muted">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
