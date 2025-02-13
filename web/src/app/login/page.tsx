'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/components/AuthProvider';
import { SocialAuth } from '@/components/SocialAuth';
import Link from 'next/link';

const getErrorMessage = (error: FirebaseError) => {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Invalid email or password. Please try again.';
    case 'auth/invalid-email':
      return 'Invalid email address. Please enter a valid email.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    default:
      return 'Failed to log in. Please try again.';
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/journal');
    } catch (error: unknown) {
      if (error instanceof FirebaseError) {
        // Don't log the error to console in production
        if (process.env.NODE_ENV === 'development') {
          console.debug('Login error:', error.code);
        }
        setError(getErrorMessage(error));
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 bg-surface rounded-xl shadow-lg p-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-primary">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-secondary">
            Sign in to continue your journaling journey
          </p>
        </div>

        <SocialAuth />

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-border bg-surface placeholder-text-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-border bg-surface placeholder-text-secondary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-secondary">
            Don&apos;t have an account?{' '}
            <Link
              href="/register"
              className="font-medium text-primary hover:text-primary-dark"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 