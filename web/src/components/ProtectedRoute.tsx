'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { LoadingSpinner } from './LoadingSpinner';
import { RiRefreshLine, RiWifiOffLine } from 'react-icons/ri';

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, error, retry } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not loading and there's no user and no error
    if (!loading && !user && !error) {
      router.push('/login');
    }
  }, [user, loading, error, router]);

  // Show loading state while auth is being determined
  if (loading) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="large" 
        text="Authenticating..." 
      />
    );
  }

  // Show error state with retry option
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <RiWifiOffLine className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-text-primary mb-2">
              Connection Error
            </h2>
            <p className="text-text-secondary mb-6">
              {error}
            </p>
          </div>
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <RiRefreshLine className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Don't render anything if no user (will redirect)
  if (!user) {
    return (
      <LoadingSpinner 
        fullScreen 
        size="large" 
        text="Redirecting..." 
      />
    );
  }

  return <>{children}</>;
} 