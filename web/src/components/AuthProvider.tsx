'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';
import { setupRealtimeSubscription, cleanupRealtimeSubscription } from '@/store/useStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = React.useRef(false);

  console.log('AuthProvider render: user=', user?.email, 'loading=', loading, 'initialized=', initializedRef.current);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('AuthProvider: Initial session:', session?.user?.email, 'session:', session);
      
      if (session?.user) {
        setUser(session.user);
        setLoading(false);
        initializedRef.current = true;
        console.log('AuthProvider: Initial user state set to:', session.user.email);
        
        // Fetch initial entries
        await useStore.getState().fetchEntries();
        
        // Set up real-time subscription
        await setupRealtimeSubscription(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
        initializedRef.current = true;
        console.log('AuthProvider: Initial user state set to: null');
      }
    };

    getInitialSession();

    // Listen for auth changes (only after initialization to avoid race conditions)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state change:', event, session?.user?.email, 'session:', session, 'initialized:', initializedRef.current);
        
        // Only handle auth changes after initial session is loaded
        if (initializedRef.current) {
          if (session?.user) {
            setUser(session.user);
            setLoading(false);
            console.log('AuthProvider: User state updated to:', session.user.email);
            
            // Fetch initial entries
            await useStore.getState().fetchEntries();
            
            // Set up real-time subscription
            await setupRealtimeSubscription(session.user.id);
          } else {
            console.log('AuthProvider: User logged out, clearing data...');
            setUser(null);
            setLoading(false);
            
            // Clear entries when user logs out
            useStore.getState().setEntries([]);
            
            // Clean up real-time subscription
            cleanupRealtimeSubscription();
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