'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RiGoogleFill } from 'react-icons/ri';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

const getGoogleErrorMessage = (error: any) => {
  if (error.message) {
    if (error.message.includes('popup closed')) {
      return 'Sign in was cancelled. Please try again.';
    }
    if (error.message.includes('popup blocked')) {
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    }
    if (error.message.includes('account exists')) {
      return 'An account already exists with this email using a different sign-in method.';
    }
    if (error.message.includes('unauthorized domain')) {
      return 'This domain is not authorized for Google sign-in.';
    }
  }
  return 'Failed to sign in with Google. Please try again.';
};

export function SocialAuth() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();
  const isRegister = pathname === '/register';

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/journal`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Google sign in error:', error);
      }
      setError(getGoogleErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RiGoogleFill className="w-5 h-5" />
          <span>{loading ? 'Signing in...' : (isRegister ? 'Sign up with Google' : 'Continue with Google')}</span>
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm text-center">
          {error}
        </div>
      )}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-background text-secondary">
            or {isRegister ? 'sign up' : 'continue'} with email
          </span>
        </div>
      </div>
    </div>
  );
} 