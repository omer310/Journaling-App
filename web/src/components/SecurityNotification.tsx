'use client';

import { useState, useEffect } from 'react';
import { RiShieldCheckLine, RiCloseLine } from 'react-icons/ri';

interface SecurityNotificationProps {
  className?: string;
}

export default function SecurityNotification({ className = '' }: SecurityNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    // Show notification if user hasn't seen it before
    const hasSeenNotification = localStorage.getItem('securityNotificationSeen');
    if (!hasSeenNotification) {
      setShowNotification(true);
    }
  }, []);

  const handleDismiss = () => {
    setShowNotification(false);
    localStorage.setItem('securityNotificationSeen', 'true');
  };

  if (!showNotification) return null;

  return (
    <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <RiShieldCheckLine className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-green-800 mb-1">
            Enhanced Security Active
          </h4>
          <p className="text-sm text-green-700 mb-3">
            Your journal is now protected with automatic logout on browser close and inactivity timeout. 
            Click the Security button to customize your session settings.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDismiss}
              className="text-xs text-green-600 hover:text-green-800 transition-colors"
            >
              Got it
            </button>
            <span className="text-green-400">•</span>
            <span className="text-xs text-green-600">
              Session timeout: 15 minutes
            </span>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="text-green-400 hover:text-green-600 transition-colors"
        >
          <RiCloseLine className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
