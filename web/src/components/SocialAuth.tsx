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
    if (loading) {
      return; // Prevent multiple submissions
    }

    try {
      setError(null);
      setLoading(true);
      
      console.log('Attempting Google sign in...');
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/journal`,
        },
      });

      if (error) {
        throw error;
      }

      console.log('Google sign in initiated successfully');
      
    } catch (error: any) {
      console.error('Google sign in error:', error);
      setError(getGoogleErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Divider */}
      <div className="relative">
        <div className="relative flex justify-center text-xs uppercase">
          <span className="text-text-muted font-medium">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google button */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="flex items-center justify-center gap-3 w-full px-4 py-3.5 bg-white dark:bg-white/10 border border-border/50 rounded-xl text-text-primary hover:bg-surface-hover dark:hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] active:scale-[0.99] group shadow-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 flex items-center justify-center">
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <RiGoogleFill className="w-5 h-5 text-[#4285f4]" />
            )}
          </div>
          <span className="font-medium">
            {loading 
              ? 'Connecting...' 
              : isRegister 
                ? 'Continue with Google' 
                : 'Sign in with Google'
            }
          </span>
        </div>
      </button>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm animate-in slide-in-from-top-2">
          {error}
        </div>
      )}
    </div>
  );
} 