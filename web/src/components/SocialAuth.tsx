"use client";

import { useState } from "react";
import { useSignIn } from "@clerk/nextjs/legacy";
import { FcGoogle } from "react-icons/fc";

type SocialAuthProps = {
  disabled?: boolean;
  onError?: (message: string) => void;
};

const getClerkErrorMessage = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "errors" in error &&
    Array.isArray((error as { errors?: Array<{ message?: string }> }).errors)
  ) {
    return (
      (error as { errors: Array<{ message?: string }> }).errors[0]?.message ||
      "Unable to continue with Google. Please try again."
    );
  }

  return "Unable to continue with Google. Please try again.";
};

export function SocialAuth({ disabled = false, onError }: SocialAuthProps) {
  const { signIn, isLoaded } = useSignIn();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    if (!isLoaded || !signIn || loading || disabled) {
      return;
    }

    try {
      setLoading(true);
      onError?.("");

      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/journal",
      });
    } catch (error) {
      setLoading(false);
      onError?.(getClerkErrorMessage(error));
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={disabled || loading || !isLoaded}
      className="w-full bg-black text-white py-3.5 px-4 rounded-xl font-medium hover:bg-[#6a6868] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
    >
      <FcGoogle className="h-5 w-5" />
      {loading ? "Opening Google..." : "Continue with Google"}
    </button>
  );
}
