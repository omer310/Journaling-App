import React from 'react';
import { 
  validatePasswordStrength, 
  getPasswordStrengthLabel, 
  getPasswordStrengthColor, 
  getPasswordStrengthBgColor,
  generatePasswordSuggestion,
  PasswordStrengthResult 
} from '@/lib/passwordStrength';
import { RiEyeLine, RiEyeOffLine, RiRefreshLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';

interface PasswordStrengthMeterProps {
  password: string;
  userInfo?: { email?: string; name?: string; username?: string };
  showPassword?: boolean;
  onTogglePassword?: () => void;
  onPasswordChange?: (password: string) => void;
  className?: string;
  showSuggestion?: boolean;
}

export function PasswordStrengthMeter({
  password,
  userInfo,
  showPassword = false,
  onTogglePassword,
  onPasswordChange,
  className = '',
  showSuggestion = true
}: PasswordStrengthMeterProps) {
  const strengthResult = validatePasswordStrength(password, userInfo);
  const strengthLabel = getPasswordStrengthLabel(strengthResult.score);
  const strengthColor = getPasswordStrengthColor(strengthResult.score);
  const strengthBgColor = getPasswordStrengthBgColor(strengthResult.score);

  const handleGeneratePassword = () => {
    // Use the improved password generation from the library
    const newPassword = generatePasswordSuggestion();
    onPasswordChange?.(newPassword);
  };

  // Simplified requirements check
  const requirements = [
    { label: '8+ characters', met: password.length >= 8 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'Lowercase letter', met: /[a-z]/.test(password) },
    { label: 'Number', met: /\d/.test(password) },
    { label: 'Special character', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) }
  ];

  const unmetRequirements = requirements.filter(req => !req.met);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Password strength bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Password Strength</span>
          <span className={`font-medium ${strengthColor}`}>
            {strengthLabel}
          </span>
        </div>
        
        <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${strengthBgColor}`}
            style={{ width: `${(strengthResult.score / 4) * 100}%` }}
          />
        </div>
        
        {/* Crack time estimate - only show if password has content */}
        {password.length > 0 && strengthResult.crackTime > 0 && (
          <div className="text-xs text-text-muted">
            Estimated crack time: {strengthResult.crackTimeDisplay}
          </div>
        )}
      </div>

      {/* Simplified requirements - only show if there are unmet requirements */}
      {unmetRequirements.length > 0 && password.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-text-secondary">Missing Requirements</div>
          <div className="space-y-1">
            {unmetRequirements.map((requirement, index) => (
              <div key={index} className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                <RiCloseLine className="h-3 w-3" />
                <span>{requirement.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Only show critical feedback, not all suggestions */}
      {strengthResult.feedback.length > 0 && password.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-text-secondary">Issues</div>
          <div className="space-y-1">
            {strengthResult.feedback.slice(0, 2).map((feedback, index) => (
              <div key={index} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
                <RiCloseLine className="h-3 w-3 mt-0.5 flex-shrink-0" />
                <span>{feedback}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password suggestion - simplified */}
      {showSuggestion && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-text-secondary">Need a strong password?</div>
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="flex items-center gap-2 px-3 py-2 text-xs bg-surface border border-border rounded-lg hover:bg-surface/80 transition-colors duration-200"
          >
            <RiRefreshLine className="h-3 w-3" />
            Generate Password
          </button>
        </div>
      )}
    </div>
  );
}

export default PasswordStrengthMeter; 