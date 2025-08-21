'use client';

import { useState, useEffect } from 'react';
import { getInactivityTimeout, setInactivityTimeout } from '@/lib/dateUtils';
import { RiShieldLine, RiTimeLine, RiLogoutBoxLine } from 'react-icons/ri';

interface SessionSecuritySettingsProps {
  className?: string;
}

export default function SessionSecuritySettings({ className = '' }: SessionSecuritySettingsProps) {
  const [timeoutMinutes, setTimeoutMinutes] = useState(15);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // Load current timeout setting
    const currentTimeout = getInactivityTimeout();
    setTimeoutMinutes(Math.round(currentTimeout / 60000)); // Convert ms to minutes
  }, []);

  const handleTimeoutChange = (minutes: number) => {
    setTimeoutMinutes(minutes);
    setInactivityTimeout(minutes * 60000); // Convert minutes to ms
  };

  const handleLogoutNow = async () => {
    if (confirm('Are you sure you want to sign out immediately? This will end your current session.')) {
      // This will be handled by the AuthProvider
      window.location.href = '/login?reason=User requested immediate logout';
    }
  };



  const timeoutOptions = [
    { value: 5, label: '5 minutes', description: 'Most secure - logs out quickly' },
    { value: 15, label: '15 minutes', description: 'Recommended - good balance' },
    { value: 30, label: '30 minutes', description: 'Less secure - longer session' },
    { value: 60, label: '1 hour', description: 'Not recommended for sensitive content' }
  ];

  return (
    <div className={`bg-surface border border-border rounded-lg p-6 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        <RiShieldLine className="w-6 h-6 text-primary" />
        <div>
          <h3 className="text-lg font-semibold text-text-primary">Session Security</h3>
          <p className="text-sm text-text-secondary">Configure how long you stay logged in</p>
        </div>
      </div>

      {/* Session Timeout Settings */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3">
          <RiTimeLine className="w-5 h-5 text-text-secondary" />
          <label className="text-sm font-medium text-text-primary">Auto-logout after inactivity:</label>
        </div>
        
        <div className="grid grid-cols-1 gap-3">
          {timeoutOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                timeoutMinutes === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <input
                type="radio"
                name="timeout"
                value={option.value}
                checked={timeoutMinutes === option.value}
                onChange={() => handleTimeoutChange(option.value)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-text-primary">{option.label}</div>
                <div className="text-sm text-text-secondary">{option.description}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Security Information */}
      <div className="bg-background border border-border rounded-lg p-4 mb-6">
        <h4 className="font-medium text-text-primary mb-2">Security Features</h4>
        <ul className="text-sm text-text-secondary space-y-1">
          <li>• Automatic logout when browser is closed</li>
          <li>• Session timeout on inactivity</li>
          <li>• Secure session validation</li>
          <li>• Activity monitoring and logging</li>
        </ul>
      </div>

      {/* Immediate Logout */}
      <div className="border-t border-border pt-4">
        <button
          onClick={handleLogoutNow}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
        >
          <RiLogoutBoxLine className="w-4 h-4" />
          Sign Out Now
        </button>
        <p className="text-xs text-text-secondary mt-2">
          This will immediately end your session and require you to log in again.
        </p>
      </div>

      {/* Advanced Settings */}
      <div className="mt-6">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-primary hover:text-primary-dark transition-colors"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </button>
        

        
        {showAdvanced && (
          <div className="mt-4 p-4 bg-background border border-border rounded-lg">
            <h4 className="font-medium text-text-primary mb-3">Advanced Security Options</h4>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded"
                />
                <div>
                  <div className="text-sm font-medium text-text-primary">Remember Me</div>
                  <div className="text-xs text-text-secondary">
                    Keep me logged in for longer periods (less secure)
                  </div>
                </div>
              </label>
              
              <div className="text-xs text-text-secondary">
                <strong>Note:</strong> These settings affect your privacy and security. 
                Shorter timeouts provide better protection for your journal entries.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
