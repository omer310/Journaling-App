import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';

interface LockContextType {
  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
  unlock: () => void;
}

const LockContext = createContext<LockContextType | undefined>(undefined);

export function LockProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const appState = React.useRef(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('LockContext: App state change:', appState.current, '->', nextAppState);
      
      // More strict locking - lock for ANY transition away from active
      if (appState.current === 'active' && (nextAppState === 'background' || nextAppState === 'inactive')) {
        console.log('LockContext: App going to background, locking immediately');
        setIsLocked(true);
      }
      // Additional safety: lock for any unexpected state changes
      else if (nextAppState !== 'active') {
        console.log('LockContext: Safety lock for unexpected state:', nextAppState);
        setIsLocked(true);
      }
      // Unlock only when coming back to active from background/inactive
      else if ((appState.current === 'background' || appState.current === 'inactive') && nextAppState === 'active') {
        console.log('LockContext: App coming to foreground, checking if locked');
        if (isLocked) {
          // If app was locked, redirect to unlock screen
          try {
            console.log('LockContext: Redirecting to unlock screen');
            router.replace('/unlock');
          } catch (error) {
            console.log('LockContext: Navigation to unlock screen failed or already there:', error);
          }
        }
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Also lock immediately if app starts in non-active state
    if (AppState.currentState !== 'active') {
      console.log('LockContext: App started in non-active state, locking immediately');
      setIsLocked(true);
    }

    return () => {
      subscription?.remove();
    };
  }, [isLocked]);

  const unlock = () => {
    setIsLocked(false);
  };

  return (
    <LockContext.Provider value={{ isLocked, setIsLocked, unlock }}>
      {children}
    </LockContext.Provider>
  );
}

export function useLock() {
  const context = useContext(LockContext);
  if (context === undefined) {
    throw new Error('useLock must be used within a LockProvider');
  }
  return context;
} 