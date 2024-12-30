'use client';

import { useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from './AuthProvider';
import { RiGoogleFill } from 'react-icons/ri';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

const getGoogleErrorMessage = (error: FirebaseError) => {
  switch (error.code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Sign in was cancelled. Please try again.';
    case 'auth/popup-blocked':
      return 'Pop-up was blocked by your browser. Please allow pop-ups and try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email using a different sign-in method.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in.';
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please contact support.';
    default:
      return 'Failed to sign in with Google. Please try again.';
  }
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
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      await signInWithPopup(auth, provider);
      router.push('/journal');
    } catch (error) {
      if (error instanceof FirebaseError) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.debug('Google sign in error:', error.code);
        }
        setError(getGoogleErrorMessage(error));
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
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