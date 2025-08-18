
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  getLastActivityTime, 
  updateLastActivityTime, 
  getInactivityTimeout, 
  checkInactivity 
} from '@/lib/dateUtils';

interface UseInactivityTimerOptions {
  enabled?: boolean;
  onTimeout?: () => void;
  warningTime?: number; // Time before timeout to show warning (in ms)
  onWarning?: () => void; // Callback when warning should be shown
}

export function useInactivityTimer({
  enabled = true,
  onTimeout,
  warningTime = 60000, // 1 minute warning by default
  onWarning
}: UseInactivityTimerOptions = {}) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const isActiveRef = useRef(false);
  const lastActivityRef = useRef<number>(Date.now());

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Clear existing timers first
    clearAllTimers();

    // Update last activity time
    const now = Date.now();
    lastActivityRef.current = now;
    updateLastActivityTime();
    isActiveRef.current = true;

    const timeout = getInactivityTimeout();
    const warningTimeMs = Math.min(warningTime, timeout - 30000); // Ensure warning is at least 30s before timeout

    console.log('Resetting inactivity timer. Timeout:', timeout, 'Warning time:', warningTimeMs);

    // Set warning timer
    if (warningTimeMs > 0 && timeout > warningTimeMs) {
      warningRef.current = setTimeout(() => {
        // Double-check if user is still inactive
        const currentTime = Date.now();
        const timeSinceLastActivity = currentTime - lastActivityRef.current;
        
        if (timeSinceLastActivity >= (timeout - warningTimeMs)) {
          console.log('Inactivity warning triggered');
          
          // Call warning callback if provided
          if (onWarning) {
            onWarning();
          }
          
          // Show warning notification
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Soul Pages - Session Timeout', {
              body: 'You will be automatically signed out due to inactivity in 1 minute. Click to stay logged in.',
              icon: '/favicon.ico',
              tag: 'inactivity-warning',
              requireInteraction: true
            });
            
            // Handle notification click to reset timer
            notification.onclick = () => {
              resetTimer();
              notification.close();
            };
          }
        } else {
          // User became active again, don't show warning
          console.log('User became active, canceling warning');
        }
      }, timeout - warningTimeMs);
    }

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      // Double-check if user is still inactive
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivityRef.current;
      
      if (timeSinceLastActivity >= timeout && isActiveRef.current) {
        console.log('Inactivity timeout - signing out user');
        
        // Call custom timeout handler if provided
        if (onTimeout) {
          onTimeout();
        } else {
          // Default behavior: sign out
          try {
            await supabase.auth.signOut();
            // Force redirect to login page
            window.location.href = '/login?reason=Session expired due to inactivity';
          } catch (error) {
            console.error('Auto-logout error:', error);
            // Force redirect even if signOut fails
            window.location.href = '/login?reason=Session expired due to inactivity';
          }
        }
        
        isActiveRef.current = false;
      } else {
        // User became active again, don't log out
        console.log('User became active, canceling logout. Time since activity:', timeSinceLastActivity);
      }
    }, timeout);
  }, [enabled, onTimeout, warningTime, onWarning, clearAllTimers]);

  const handleUserActivity = useCallback(() => {
    if (!enabled) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset if enough time has passed to avoid excessive resets
    if (timeSinceLastActivity > 5000) { // 5 seconds threshold
      console.log('User activity detected, resetting timer');
      resetTimer();
    } else {
      // Just update the last activity time without resetting timers
      lastActivityRef.current = now;
      updateLastActivityTime();
    }
  }, [enabled, resetTimer]);

  useEffect(() => {
    if (!enabled) {
      clearAllTimers();
      return;
    }

    // Set up activity listeners
    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
      'focus'
    ];

    // Add event listeners with passive option for better performance
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initial timer setup - start fresh when user logs in
    // Add a small delay to ensure user has time to interact
    const initialTimer = setTimeout(() => {
      resetTimer();
    }, 1000);

    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      // Clear initial timer
      clearTimeout(initialTimer);
      
      // Clean up event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });

      // Clear timers
      clearAllTimers();
    };
  }, [enabled, handleUserActivity, resetTimer, clearAllTimers]);

  // Expose methods for manual control
  const pauseTimer = useCallback(() => {
    clearAllTimers();
    isActiveRef.current = false;
  }, [clearAllTimers]);

  const resumeTimer = useCallback(() => {
    if (enabled) {
      resetTimer();
    }
  }, [enabled, resetTimer]);

  return {
    resetTimer,
    pauseTimer,
    resumeTimer,
    isActive: isActiveRef.current
  };
}
