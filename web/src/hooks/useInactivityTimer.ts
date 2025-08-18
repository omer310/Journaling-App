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

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Clear existing timers
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }

    // Update last activity time
    updateLastActivityTime();
    isActiveRef.current = true;

    const timeout = getInactivityTimeout();
    const warningTimeMs = Math.min(warningTime, timeout - 30000); // Ensure warning is at least 30s before timeout

        // Set warning timer
    if (warningTimeMs > 0) {
      warningRef.current = setTimeout(() => {
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

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      if (isActiveRef.current) {
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
      }
    }, timeout);
  }, [enabled, onTimeout, warningTime]);

  const handleUserActivity = useCallback(() => {
    if (!enabled) return;
    resetTimer();
  }, [enabled, resetTimer]);

  useEffect(() => {
    if (!enabled) {
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

    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Initial timer setup - start fresh when user logs in
    // Add a small delay to ensure user has time to interact
    setTimeout(() => {
      resetTimer();
    }, 1000);

    // Request notification permission if not already granted
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      // Clean up event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });

      // Clear timers
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [enabled, handleUserActivity, resetTimer]);

  // Expose methods for manual control
  const pauseTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }
    isActiveRef.current = false;
  }, []);

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