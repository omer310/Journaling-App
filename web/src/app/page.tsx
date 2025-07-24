'use client';

// Disable static generation since this page uses auth and redirects
export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  console.log('Home page: user=', user?.email, 'loading=', loading);

  useEffect(() => {
    console.log('Home page useEffect: loading=', loading, 'user=', user?.email);
    if (!loading) {
      // Add a small delay to ensure auth state is properly settled
      const timer = setTimeout(() => {
        if (user) {
          console.log('Home page: Redirecting to /journal');
          router.push('/journal');
        } else {
          console.log('Home page: Redirecting to /login');
          router.push('/login');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-primary-50 dark:bg-dark-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-4">Welcome to Your Journal</h1>
        <p className="text-secondary-600 dark:text-secondary-400">Redirecting...</p>
      </div>
    </div>
  );
}
