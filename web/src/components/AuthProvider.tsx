'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { setupRealtimeSubscription, cleanupRealtimeSubscription } from '@/store/useStore';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { clearInactivityData } from '@/lib/dateUtils';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = React.useRef(false);
  const authChangeInProgressRef = React.useRef(false);

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
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Initial session found for user:', session.user.email);
          // Clear any old inactivity data when user logs in
          clearInactivityData();
          setUser(session.user);
          setLoading(false);
          initializedRef.current = true;
          
          // Fetch initial entries
          try {
            await useStore.getState().fetchEntries();
          } catch (error) {
            console.error('Error fetching initial entries:', error);
          }
          
          // Set up real-time subscription
          try {
            await setupRealtimeSubscription(session.user.id);
          } catch (error) {
            console.error('Error setting up real-time subscription:', error);
          }
        } else {
          console.log('No initial session found');
          setUser(null);
          setLoading(false);
          initializedRef.current = true;
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        setUser(null);
        setLoading(false);
        initializedRef.current = true;
      }
    };

    getInitialSession();

    // Listen for auth changes (only after initialization to avoid race conditions)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // Prevent multiple simultaneous auth changes
        if (authChangeInProgressRef.current) {
          console.log('Auth change already in progress, skipping...');
          return;
        }
        
        // Only handle auth changes after initial session is loaded
        if (initializedRef.current) {
          authChangeInProgressRef.current = true;
          
          try {
            if (session?.user) {
              console.log('User authenticated:', session.user.email);
              // Clear any old inactivity data when user logs in
              clearInactivityData();
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
              console.log('User signed out');
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
      subscription.unsubscribe();
      cleanupRealtimeSubscription();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
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