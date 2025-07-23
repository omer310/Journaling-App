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
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        console.log('App has come to the foreground');
        if (isLocked) {
          // If app was locked, redirect to unlock screen
          router.replace('/unlock');
        }
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        console.log('App has gone to the background, locking...');
        setIsLocked(true);
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

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