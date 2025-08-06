'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getInactivityTimeout, setInactivityTimeout } from '@/lib/dateUtils';
import { sanitizeHtml } from '@/lib/sanitize';

// Custom styles for radio buttons to match app theme
const radioButtonStyles = `
  input[type="radio"] {
    accent-color: #009F6B !important;
  }
  
  input[type="radio"]:checked {
    background-color: #009F6B !important;
    border-color: #009F6B !important;
  }
  
  input[type="radio"]:focus {
    box-shadow: 0 0 0 2px rgba(0, 159, 107, 0.2) !important;
  }
  
  .dark input[type="radio"] {
    accent-color: #00B377 !important;
  }
  
  .dark input[type="radio"]:checked {
    background-color: #00B377 !important;
    border-color: #00B377 !important;
  }
  
  .dark input[type="radio"]:focus {
    box-shadow: 0 0 0 2px rgba(0, 179, 119, 0.2) !important;
  }
`;

interface InactivitySettingsProps {
  className?: string;
}

export default function InactivitySettings({ className = '' }: InactivitySettingsProps) {
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load current timeout setting
    const currentTimeout = getInactivityTimeout();
    setTimeoutMinutes(Math.round(currentTimeout / 60000)); // Convert ms to minutes
  }, []);

  useEffect(() => {
    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleTimeoutChange = (minutes: number) => {
    setTimeoutMinutes(minutes);
    setInactivityTimeout(minutes * 60000); // Convert minutes to ms
  };

  const timeoutOptions = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
    { value: 120, label: '2 hours' },
    { value: 240, label: '4 hours' }
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <style dangerouslySetInnerHTML={{ __html: sanitizeHtml(radioButtonStyles) }} />
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm text-secondary hover:text-primary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Auto-logout: {timeoutMinutes} min</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-surface border border-border rounded-lg shadow-xl z-50 backdrop-blur-sm">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-primary mb-3">Auto-logout Settings</h3>
            <p className="text-xs text-secondary mb-4 leading-relaxed">
              You will be automatically signed out after the selected period of inactivity.
            </p>
            
            <div className="space-y-1">
              {timeoutOptions.map((option) => (
                                 <label key={option.value} className="flex items-center gap-3 cursor-pointer p-2 rounded-md hover:bg-surface-hover transition-colors">
                   <input
                     type="radio"
                     name="timeout"
                     value={option.value}
                     checked={timeoutMinutes === option.value}
                     onChange={() => handleTimeoutChange(option.value)}
                     className="w-4 h-4 text-primary border-border focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-gray-900 accent-primary"
                   />
                   <span className="text-sm text-secondary font-medium">{option.label}</span>
                 </label>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-xs text-secondary leading-relaxed">
                <strong>Note:</strong> You'll receive a notification 1 minute before being signed out.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 