'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import { useStore } from '@/store/useStore';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import {
  clearInactivityData,
  setupSmartSessionSecurity,
  cleanupSmartSessionSecurity,
  clearBrowserCloseFlag
} from '@/lib/dateUtils';
import { setCurrentUserId } from '@/lib/clientAuthState';

interface AuthUser {
  id: string;
  email?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [error, setError] = useState<string | null>(null);
  const loading = !isLoaded;

  const user = useMemo<AuthUser | null>(() => {
    if (!isSignedIn || !clerkUser) return null;

    return {
      id: clerkUser.id,
      email: clerkUser.primaryEmailAddress?.emailAddress,
    };
  }, [clerkUser, isSignedIn]);

  useInactivityTimer({
    enabled: !!user && !loading,
    onTimeout: async () => {
      console.log('Inactivity timeout - signing out user');
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'inactivity_timeout' }),
      }).catch(() => undefined);
      await signOut({ redirectUrl: '/login?reason=Session expired due to inactivity' });
    },
    onWarning: () => {
      console.log('Inactivity warning triggered');
    }
  });

  useEffect(() => {
    setupSmartSessionSecurity();
    clearBrowserCloseFlag();

    return () => {
      cleanupSmartSessionSecurity();
    };
  }, []);

  useEffect(() => {
    setCurrentUserId(user?.id || null);

    if (loading) return;

    if (user) {
      clearInactivityData();
      clearBrowserCloseFlag();
      setError(null);
      useStore.getState().fetchEntries().catch((fetchError) => {
        console.error('Error fetching initial entries:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load journal entries');
      });
    } else {
      useStore.getState().setEntries([]);
    }
  }, [user, loading]);

  const retry = () => {
    setError(null);
    if (user) {
      useStore.getState().fetchEntries().catch((fetchError) => {
        console.error('Error fetching entries on retry:', fetchError);
        setError(fetchError instanceof Error ? fetchError.message : 'Failed to load journal entries');
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, retry }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
