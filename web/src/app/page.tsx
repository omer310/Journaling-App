'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  console.log('Home page: user=', user?.email, 'loading=', loading);

  useEffect(() => {
    console.log('Home page useEffect: loading=', loading, 'user=', user?.email);
    
    // Only redirect if we're not loading
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
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">Welcome to Your Journal</h1>
        <p className="text-secondary">Redirecting...</p>
      </div>
    </div>
  );
}
