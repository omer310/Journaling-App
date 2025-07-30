'use client';

import React, { useState, useEffect } from 'react';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';

interface InactivityWarningProps {
  className?: string;
}

export default function InactivityWarning({ className = '' }: InactivityWarningProps) {
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [warningStartTime, setWarningStartTime] = useState(0);
  const [warningDuration, setWarningDuration] = useState(0);

  const { resetTimer } = useInactivityTimer({
    enabled: true,
    onTimeout: () => {
      // This will be handled by the AuthProvider
    },
    onWarning: () => {
      setShowWarning(true);
      setWarningStartTime(Date.now());
      
      // Calculate warning duration based on current timeout setting
      const timeout = parseInt(localStorage.getItem('inactivityTimeout') || '1800000');
      const warningTime = Math.min(60000, timeout - 30000); // 1 minute warning, but at least 30s before timeout
      setWarningDuration(Math.floor(warningTime / 1000));
      setTimeLeft(Math.floor(warningTime / 1000));
    }
  });

  useEffect(() => {
    // Update countdown when warning is shown
    if (showWarning && warningStartTime > 0) {
      const updateCountdown = () => {
        const now = Date.now();
        const elapsed = now - warningStartTime;
        const remaining = Math.max(0, warningDuration - Math.floor(elapsed / 1000));
        
        setTimeLeft(remaining);
        
        // Hide warning if countdown reaches 0
        if (remaining <= 0) {
          setShowWarning(false);
        }
      };

      // Update immediately
      updateCountdown();

      // Update every second
      const interval = setInterval(updateCountdown, 1000);
      return () => clearInterval(interval);
    }
  }, [showWarning, warningStartTime]);

  const handleStayLoggedIn = () => {
    resetTimer();
    setShowWarning(false);
    setWarningStartTime(0);
    setWarningDuration(0);
  };

  if (!showWarning) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}>
      <div className="bg-surface border border-border rounded-lg shadow-xl p-6 max-w-sm backdrop-blur-sm mx-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-primary">
              Session Timeout Warning
            </h3>
            <div className="mt-2 text-sm text-secondary">
              <p>You will be automatically signed out in <span className="font-medium text-yellow-600 dark:text-yellow-400">{timeLeft}</span> seconds due to inactivity.</p>
            </div>
            <div className="mt-3">
              <button
                onClick={handleStayLoggedIn}
                className="bg-primary text-white px-4 py-2 text-sm font-medium rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 