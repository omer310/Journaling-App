'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { setupRealtimeSubscription, cleanupRealtimeSubscription } from '@/store/useStore';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { 
  clearInactivityData, 
  setupBrowserCloseDetection, 
  cleanupBrowserCloseDetection,
  checkBrowserWasClosed,
  clearBrowserCloseFlag
} from '@/lib/dateUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = React.useRef(false);
  const authChangeInProgressRef = React.useRef(false);
  const retryCountRef = React.useRef(0);
  const browserCloseCheckedRef = React.useRef(false);

  // Initialize inactivity timer for authenticated users
  useInactivityTimer({
    enabled: !!user && !loading,
    onTimeout: async () => {
      console.log('Inactivity timeout - signing out user');
      await supabase.auth.signOut();
    },
    onWarning: () => {
      console.log('Inactivity warning triggered');
    }
  });

  useEffect(() => {
    // Set up browser close detection
    setupBrowserCloseDetection();

    // More aggressive browser close check for production
    const checkForBrowserClose = () => {
      if (checkBrowserWasClosed() && window.location.pathname !== '/login') {
        console.log('Browser was closed - forcing logout for security');
        
        // Clear all session data immediately
        clearInactivityData();
        clearBrowserCloseFlag();
        
        // Force logout and redirect immediately
        const forceLogout = async () => {
          try {
            await supabase.auth.signOut();
          } catch (error) {
            console.error('Error during forced logout:', error);
          } finally {
            // Always redirect, even if logout fails
            window.location.href = '/login?reason=Browser was closed - session terminated for security';
          }
        };
        
        forceLogout();
        return true; // Indicate that logout was triggered
      }
      return false;
    };

    // Check immediately
    if (checkForBrowserClose()) {
      return; // Don't continue with normal session initialization
    }

    // Also check after a short delay to catch edge cases
    const delayedCheck = setTimeout(() => {
      if (!browserCloseCheckedRef.current && checkForBrowserClose()) {
        return;
      }
      browserCloseCheckedRef.current = true;
    }, 1000);

    // Mark that we've checked for browser close
    browserCloseCheckedRef.current = true;

    // Debounce session checks to prevent excessive API calls
    let sessionCheckTimeout: NodeJS.Timeout;
    
    const getInitialSession = async () => {
      try {
        setError(null);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        
        if (session?.user) {
          // Clear any old inactivity data when user logs in
          clearInactivityData();
          clearBrowserCloseFlag();
          setUser(session.user);
          setLoading(false);
          initializedRef.current = true;
          retryCountRef.current = 0;
          
          // Fetch initial entries with retry logic
          try {
            await useStore.getState().fetchEntries();
          } catch (error) {
            console.error('Error fetching initial entries:', error);
            // Don't fail auth if entries fail to load
          }
          
          // Set up real-time subscription
          try {
            await setupRealtimeSubscription(session.user.id);
          } catch (error) {
            console.error('Error setting up real-time subscription:', error);
            // Don't fail auth if realtime fails
          }
        } else {
          setUser(null);
          setLoading(false);
          initializedRef.current = true;
          retryCountRef.current = 0;
        }
      } catch (error: any) {
        console.error('Error getting initial session:', error);
        retryCountRef.current += 1;
        
        if (retryCountRef.current <= 3) {
          // Retry up to 3 times with exponential backoff
          const delay = Math.min(1000 * Math.pow(2, retryCountRef.current - 1), 10000);
          console.log(`Retrying session check in ${delay}ms (attempt ${retryCountRef.current}/3)`);
          setTimeout(getInitialSession, delay);
          return;
        }
        
        setError(error.message || 'Failed to authenticate. Please refresh the page.');
        setUser(null);
        setLoading(false);
        initializedRef.current = true;
      }
    };

    // Debounce the initial session check
    sessionCheckTimeout = setTimeout(getInitialSession, 100);

    // Listen for auth changes (only after initialization to avoid race conditions)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Prevent multiple simultaneous auth changes
        if (authChangeInProgressRef.current) {
          return;
        }
        
        // Only handle auth changes after initial session is loaded
        if (initializedRef.current) {
          authChangeInProgressRef.current = true;
          
          try {
            if (session?.user) {
              // Clear any old inactivity data when user logs in
              clearInactivityData();
              clearBrowserCloseFlag();
              setUser(session.user);
              setLoading(false);
              
              // Fetch initial entries
              try {
                await useStore.getState().fetchEntries();
              } catch (error) {
                console.error('Error fetching entries after auth change:', error);
              }
              
              // Set up real-time subscription
              try {
                await setupRealtimeSubscription(session.user.id);
              } catch (error) {
                console.error('Error setting up real-time subscription after auth change:', error);
              }
            } else {
              setUser(null);
              setLoading(false);
              
              // Clear entries when user logs out
              useStore.getState().setEntries([]);
              
              // Clean up real-time subscription
              cleanupRealtimeSubscription();
            }
          } catch (error) {
            console.error('Error handling auth state change:', error);
            setLoading(false);
          } finally {
            authChangeInProgressRef.current = false;
          }
        }
      }
    );

    return () => {
      if (sessionCheckTimeout) {
        clearTimeout(sessionCheckTimeout);
      }
      if (delayedCheck) {
        clearTimeout(delayedCheck);
      }
      subscription.unsubscribe();
      cleanupRealtimeSubscription();
      cleanupBrowserCloseDetection();
    };
  }, []);

  const retry = () => {
    retryCountRef.current = 0;
    setError(null);
    setLoading(true);
    initializedRef.current = false;
    
    // Retry authentication
    setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          clearInactivityData();
          clearBrowserCloseFlag();
          setUser(session.user);
          setLoading(false);
          initializedRef.current = true;
          
          try {
            await useStore.getState().fetchEntries();
          } catch (error) {
            console.error('Error fetching entries on retry:', error);
          }
          
          try {
            await setupRealtimeSubscription(session.user.id);
          } catch (error) {
            console.error('Error setting up subscription on retry:', error);
          }
        } else {
          setUser(null);
          setLoading(false);
          initializedRef.current = true;
        }
      } catch (error: any) {
        console.error('Error on retry:', error);
        setError(error.message || 'Failed to authenticate. Please try again.');
        setLoading(false);
        initializedRef.current = true;
      }
    }, 100);
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