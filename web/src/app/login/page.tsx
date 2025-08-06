"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { SocialAuth } from "@/components/SocialAuth";
import { useRateLimit } from "@/lib/rateLimiter";
import { monitoringUtils } from "@/lib/securityMonitoring";
import Link from "next/link";
import {
  RiEyeLine,
  RiEyeOffLine,
  RiMailLine,
  RiLockLine,
  RiArrowRightLine,
} from "react-icons/ri";
import "./page.css";

const getErrorMessage = (error: any) => {
  if (error.message) {
    if (error.message.includes("Invalid login credentials")) {
      return "Invalid email or password. Please try again.";
    }
    if (error.message.includes("Invalid email")) {
      return "Invalid email address. Please enter a valid email.";
    }
    if (error.message.includes("Email not confirmed")) {
      return "Please check your email and confirm your account.";
    }
    if (error.message.includes("Too many requests")) {
      return "Too many failed attempts. Please try again later.";
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
  const [currentStatus, setCurrentStatus] = useState({
    remainingAttempts: 5,
    timeUntilReset: 0,
    isLocked: false
  });
  const router = useRouter();

  // Initialize rate limiting and security monitoring
  const { checkLimit: isLoginAllowed, recordAttempt: recordLoginAttempt, getStatus: getLoginStatus } = useRateLimit('LOGIN_ATTEMPTS', email);

  // Update status in real-time
  useEffect(() => {
    const updateStatus = () => {
      const status = getLoginStatus();
      setCurrentStatus(prevStatus => {
        // Only update if the status has actually changed
        if (
          prevStatus.remainingAttempts !== status.remainingAttempts ||
          prevStatus.timeUntilReset !== status.timeUntilReset ||
          prevStatus.isLocked !== status.isLocked
        ) {
          return {
            remainingAttempts: status.remainingAttempts,
            timeUntilReset: status.timeUntilReset,
            isLocked: status.isLocked
          };
        }
        return prevStatus;
      });
    };

    // Update immediately
    updateStatus();

    // Update every second for countdown
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [email]); // Only depend on email changes, not getLoginStatus

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (loading) {
      return; // Prevent multiple submissions
    }

    // Check rate limiting before attempting login
    if (!isLoginAllowed()) {
      const status = getLoginStatus();
      const minutes = Math.ceil(status.timeUntilReset / 60000);
      setError(`Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Record failed login for rate limiting and security monitoring
        recordLoginAttempt();
        monitoringUtils.recordFailedLogin(email, {
          reason: error.message,
          userAgent: navigator.userAgent
        });

        throw error;
      }

      // Record successful login (no rate limiting for successful logins)
      monitoringUtils.recordEvent('LOGIN_SUCCESS', {
        userAgent: navigator.userAgent
      }, 'LOW', undefined, email);

      // Add a small delay to ensure auth state is properly set
      setTimeout(() => {
        router.push("/journal");
      }, 100);
    } catch (error: any) {
      console.error("Login error:", error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  // Format time for display
  const formatTime = (ms: number) => {
    if (ms <= 0) return '0s';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Main card */}
        <div className="bg-black/80 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/10 dark:shadow-black/30">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z"/>
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="mt-2 text-secondary">
              Sign in to continue your journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2">
                {error}
              </div>
            )}

                         {/* Rate limiting status */}
             {currentStatus.remainingAttempts < 5 && (
               <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-xl text-sm">
                 <div className="flex items-center justify-between">
                   <span>Login attempts remaining: {currentStatus.remainingAttempts}</span>
                   {currentStatus.timeUntilReset > 0 && (
                     <span className="text-xs">
                       Resets in {formatTime(currentStatus.timeUntilReset)}
                     </span>
                   )}
                 </div>
               </div>
             )}

            {/* Email field */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-text-primary"
              >
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
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-surface/50 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-surface/80"
                  placeholder="Enter your email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-text-primary"
              >
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
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3.5 bg-surface/50 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-surface/80"
                  placeholder="Enter your password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary hover:text-text-primary transition-colors duration-200"
                  disabled={loading}
                >
                  {showPassword ? (
                    <RiEyeOffLine className="h-5 w-5" />
                  ) : (
                    <RiEyeLine className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign in button */}
            <button
              type="submit"
              disabled={loading || !isLoginAllowed()}
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

          {/* Social auth */}
          <div className="social-auth-container mt-8">
            <SocialAuth />
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-secondary">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-primary hover:text-primary-light font-medium transition-colors duration-200 hover:underline"
              >
                Create one here
              </Link>
            </p>
          </div>
        </div>

        {/* Bottom text */}
        <div className="text-center mt-6">
          <p className="text-xs text-text-muted">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
