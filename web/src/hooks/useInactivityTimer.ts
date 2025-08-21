
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
  const lastActivityRef = useRef<number>(Date.now());
  const isTimerActiveRef = useRef<boolean>(false);
  const browserCloseCheckRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    if (browserCloseCheckRef.current) {
      clearTimeout(browserCloseCheckRef.current);
      browserCloseCheckRef.current = null;
    }
  }, []);

  const performLogout = useCallback(async () => {
    try {
      // Call custom timeout handler if provided
      if (onTimeout) {
        onTimeout();
      } else {
        // Default behavior: sign out
        await supabase.auth.signOut();
        // Force redirect to login page
        window.location.href = '/login?reason=Session expired due to inactivity';
      }
    } catch (error) {
      console.error('Auto-logout error:', error);
      // Force redirect even if signOut fails
      window.location.href = '/login?reason=Session expired due to inactivity';
    }
  }, [onTimeout]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Clear existing timers first
    clearAllTimers();

    // Update last activity time
    const now = Date.now();
    lastActivityRef.current = now;
    updateLastActivityTime();
    isTimerActiveRef.current = true;

    const timeout = getInactivityTimeout();
    const warningTimeMs = Math.min(warningTime, timeout - 30000); // Ensure warning is at least 30s before timeout

    // Browser close detection is now handled by aggressive security system

    // Set warning timer
    if (warningTimeMs > 0 && timeout > warningTimeMs) {
      warningRef.current = setTimeout(() => {
        if (!isTimerActiveRef.current) return; // Timer was disabled
        
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
      }, timeout - warningTimeMs);
    }

    // Set logout timer - this will execute regardless of activity
    timeoutRef.current = setTimeout(() => {
      if (!isTimerActiveRef.current) return; // Timer was disabled
      
      performLogout();
    }, timeout);
  }, [enabled, warningTime, onWarning, clearAllTimers, performLogout]);

  const handleUserActivity = useCallback(() => {
    if (!enabled || !isTimerActiveRef.current) return;
    
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    
    // Only reset if enough time has passed to avoid excessive resets
    if (timeSinceLastActivity > 3000) { // 3 seconds threshold
      lastActivityRef.current = now;
      updateLastActivityTime();
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
      isTimerActiveRef.current = false;
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
      'focus',
      'keydown'
    ];

    // Add event listeners with passive option for better performance
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initial timer setup - start fresh when hook is enabled
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

      // Clear timers and mark as inactive
      clearAllTimers();
      isTimerActiveRef.current = false;
    };
  }, [enabled, handleUserActivity, resetTimer, clearAllTimers]);

  // Expose methods for manual control
  const pauseTimer = useCallback(() => {
    clearAllTimers();
    isTimerActiveRef.current = false;
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
    isActive: isTimerActiveRef.current
  };
}
