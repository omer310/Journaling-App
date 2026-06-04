"use client";

import { useState } from "react";
import { useSignUp } from "@clerk/nextjs/legacy";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";
import { SocialAuth } from "@/components/SocialAuth";
import { validatePassword } from "@/lib/validation";
import {
  RiArrowRightLine,
  RiCheckLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLockLine,
  RiMailLine,
} from "react-icons/ri";

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

    if (code.includes("form_identifier_exists")) {
      return "An account with this email already exists.";
    }

    if (code.includes("form_password_pwned")) {
      return "That password has appeared in a data breach. Please choose a different password.";
    }

    if (message) {
      return message;
    }
  }

  return "Failed to create account. Please try again.";
};

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const passwordValidation = validatePassword(password, { email });
  const isPasswordValid = passwordValidation.isValid;

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!isPasswordValid) {
      const passwordErrors = passwordValidation.errors.map((issue) => issue.message).join(", ");
      setError(`Password issues: ${passwordErrors}`);
      return;
    }

    if (!isLoaded || !signUp || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await signUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        router.push("/journal");
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (error) {
      setError(getClerkErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!verificationCode) {
      setError("Please enter the verification code from your email.");
      return;
    }

    if (!isLoaded || !signUp || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status !== "complete" || !result.createdSessionId) {
        throw new Error("Email verification is not complete yet.");
      }

      await setActive({ session: result.createdSessionId });
      router.push("/journal");
    } catch (error) {
      setError(getClerkErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/10 dark:shadow-black/30">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              {pendingVerification ? "Check Your Email" : "Create Account"}
            </h1>
            <p className="mt-2 text-secondary">
              {pendingVerification ? "Enter the code Clerk sent to your email" : "Start your journaling journey today"}
            </p>
          </div>

          {pendingVerification ? (
            <form onSubmit={handleVerifyEmail} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="verificationCode" className="block text-sm font-medium text-text-primary">
                  Verification Code
                </label>
                <input
                  id="verificationCode"
                  type="text"
                  inputMode="numeric"
                  value={verificationCode}
                  onChange={(event) => setVerificationCode(event.target.value)}
                  className="w-full px-4 py-3.5 bg-surface/50 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-surface/80 text-center tracking-[0.3em]"
                  placeholder="000000"
                  required
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !isLoaded}
                className="w-full bg-gradient-to-r from-primary to-primary-light text-white py-3.5 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] group"
              >
                <span className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify Email
                      <RiArrowRightLine className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </button>
            </form>
          ) : (
            <>
              <form onSubmit={handleRegister} className="space-y-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2">
                    {error}
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
                      placeholder="Create a password"
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

                  {password && (
                    <PasswordStrengthMeter
                      password={password}
                      userInfo={{ email }}
                      onPasswordChange={setPassword}
                      className="mt-3"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <RiLockLine className="h-5 w-5 text-secondary" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="w-full pl-12 pr-12 py-3.5 bg-surface/50 border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 hover:bg-surface/80"
                      placeholder="Confirm your password"
                      required
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-secondary hover:text-text-primary transition-colors duration-200"
                      disabled={loading}
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <RiEyeOffLine className="h-5 w-5" /> : <RiEyeLine className="h-5 w-5" />}
                    </button>
                  </div>

                  {confirmPassword && (
                    <div className="flex items-center gap-2 text-xs">
                      {password === confirmPassword ? (
                        <>
                          <RiCheckLine className="h-4 w-4 text-green-500" />
                          <span className="text-green-500">Passwords match</span>
                        </>
                      ) : (
                        <span className="text-red-500">Passwords don&apos;t match</span>
                      )}
                    </div>
                  )}
                </div>

                <div id="clerk-captcha" />

                <button
                  type="submit"
                  disabled={loading || !isLoaded}
                  className="w-full bg-gradient-to-r from-primary to-primary-light text-white py-3.5 px-4 rounded-xl font-medium hover:shadow-lg hover:shadow-primary/25 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <span className="flex items-center justify-center gap-2">
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <RiArrowRightLine className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>
              </form>

              <div className="mt-8">
                <SocialAuth disabled={loading} onError={setError} />
              </div>
            </>
          )}

          <div className="mt-8 text-center">
            <p className="text-sm text-secondary">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary-light font-medium transition-colors duration-200 hover:underline"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-text-muted">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
