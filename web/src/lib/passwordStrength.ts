import zxcvbn from 'zxcvbn';

export interface PasswordStrengthResult {
  score: number; // 0-4 (0 = very weak, 4 = very strong)
  feedback: string[];
  suggestions: string[];
  warning?: string;
  crackTime: number; // Estimated time to crack in seconds
  crackTimeDisplay: string; // Human readable time
  matchSequence: any[]; // Detailed breakdown of password analysis
  calcTime: number; // Time taken to calculate
  isCommon: boolean; // Whether password is in common password lists
  isWeak: boolean; // Whether password meets minimum requirements
  isStrong: boolean; // Whether password is considered strong
}

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minScore: number; // Minimum zxcvbn score (0-4)
  banCommonPasswords: boolean;
  banUserInfo: boolean; // Ban passwords containing user info (email, name, etc.)
}

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional but recommended
  minScore: 2, // At least "good" strength
  banCommonPasswords: true,
  banUserInfo: true
};

/**
 * Enhanced password strength validation using zxcvbn
 */
export function validatePasswordStrength(
  password: string,
  userInfo?: { email?: string; name?: string; username?: string },
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS
): PasswordStrengthResult {
  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      feedback: ['Password is required'],
      suggestions: ['Enter a password'],
      crackTime: 0,
      crackTimeDisplay: 'instant',
      matchSequence: [],
      calcTime: 0,
      isCommon: false,
      isWeak: true,
      isStrong: false
    };
  }

  // Basic length validation
  if (password.length < requirements.minLength) {
    return {
      score: 0,
      feedback: [`Password must be at least ${requirements.minLength} characters long`],
      suggestions: ['Use a longer password'],
      crackTime: 0,
      crackTimeDisplay: 'instant',
      matchSequence: [],
      calcTime: 0,
      isCommon: false,
      isWeak: true,
      isStrong: false
    };
  }

  if (password.length > requirements.maxLength) {
    return {
      score: 0,
      feedback: [`Password must be ${requirements.maxLength} characters or less`],
      suggestions: ['Use a shorter password'],
      crackTime: 0,
      crackTimeDisplay: 'instant',
      matchSequence: [],
      calcTime: 0,
      isCommon: false,
      isWeak: true,
      isStrong: false
    };
  }

  // Character type validation
  const feedback: string[] = [];
  const suggestions: string[] = [];

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
    suggestions.push('Add uppercase letters');
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
    suggestions.push('Add lowercase letters');
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
    suggestions.push('Add numbers');
  }

  if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain at least one special character');
    suggestions.push('Add special characters like !@#$%^&*');
  }

  // Check for user info in password
  if (requirements.banUserInfo && userInfo) {
    const userInfoParts = [
      userInfo.email?.split('@')[0] || '',
      userInfo.name || '',
      userInfo.username || ''
    ].filter(Boolean);

    const hasUserInfo = userInfoParts.some(info => 
      password.toLowerCase().includes(info.toLowerCase())
    );

    if (hasUserInfo) {
      feedback.push('Password should not contain personal information');
      suggestions.push('Avoid using your name, email, or username in your password');
    }
  }

  // Use zxcvbn for advanced analysis
  const startTime = performance.now();
  const result = zxcvbn(password, userInfo ? Object.values(userInfo).filter(Boolean) : []);
  const calcTime = performance.now() - startTime;

  // Convert crack time to human readable format
  let crackTimeSeconds = 0;
  if (typeof result.crack_times_display.offline_fast_hashing_1e10_per_second === 'number') {
    crackTimeSeconds = result.crack_times_display.offline_fast_hashing_1e10_per_second;
  } else if (typeof result.crack_times_seconds.offline_fast_hashing_1e10_per_second === 'number') {
    crackTimeSeconds = result.crack_times_seconds.offline_fast_hashing_1e10_per_second;
  }
  const crackTimeDisplay = formatCrackTime(crackTimeSeconds);

  // Determine if password is common
  const isCommon = result.feedback.warning?.toLowerCase().includes('common') || 
                   result.feedback.suggestions.some(s => s.toLowerCase().includes('common'));

  // Check if password meets minimum score requirement
  const meetsScoreRequirement = result.score >= requirements.minScore;

  // Combine feedback
  const allFeedback = [...feedback, ...result.feedback.warning ? [result.feedback.warning] : []];
  const allSuggestions = [...suggestions, ...result.feedback.suggestions];

  // Determine overall strength
  const isWeak = !meetsScoreRequirement || feedback.length > 0 || isCommon;
  const isStrong = result.score >= 3 && meetsScoreRequirement && feedback.length === 0 && !isCommon;

  return {
    score: result.score,
    feedback: allFeedback,
    suggestions: allSuggestions,
    warning: result.feedback.warning,
    crackTime: crackTimeSeconds,
    crackTimeDisplay,
    matchSequence: result.sequence || [],
    calcTime,
    isCommon,
    isWeak,
    isStrong
  };
}

/**
 * Format crack time into human readable string
 */
function formatCrackTime(seconds: number): string {
  if (seconds < 1) return 'instant';
  if (seconds < 60) return `${Math.ceil(seconds)} seconds`;
  if (seconds < 3600) return `${Math.ceil(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.ceil(seconds / 3600)} hours`;
  if (seconds < 31536000) return `${Math.ceil(seconds / 86400)} days`;
  return `${Math.ceil(seconds / 31536000)} years`;
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
  switch (score) {
    case 0: return 'Very Weak';
    case 1: return 'Weak';
    case 2: return 'Fair';
    case 3: return 'Good';
    case 4: return 'Strong';
    default: return 'Unknown';
  }
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(score: number): string {
  switch (score) {
    case 0: return 'text-red-500';
    case 1: return 'text-orange-500';
    case 2: return 'text-yellow-500';
    case 3: return 'text-blue-500';
    case 4: return 'text-green-500';
    default: return 'text-gray-500';
  }
}

/**
 * Get password strength background color
 */
export function getPasswordStrengthBgColor(score: number): string {
  switch (score) {
    case 0: return 'bg-red-500';
    case 1: return 'bg-orange-500';
    case 2: return 'bg-yellow-500';
    case 3: return 'bg-blue-500';
    case 4: return 'bg-green-500';
    default: return 'bg-gray-500';
  }
}

/**
 * Generate a strong password suggestion
 */
export function generatePasswordSuggestion(): string {
  // Use cryptographically secure random generation
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  
  // Create a truly random strong password
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  let password = '';
  
  // Generate 16-20 character password with mixed character types
  const length = 16 + (array[0] % 5); // 16-20 characters
  
  for (let i = 0; i < length; i++) {
    password += chars[array[i % array.length] % chars.length];
  }
  
  // Ensure it has at least one of each required character type
  if (!/[A-Z]/.test(password)) {
    password = password.replace(/[a-z]/, 'A');
  }
  if (!/[a-z]/.test(password)) {
    password = password.replace(/[A-Z]/, 'a');
  }
  if (!/\d/.test(password)) {
    password = password.replace(/[a-zA-Z]/, '1');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    password = password.replace(/[a-zA-Z0-9]/, '!');
  }
  
  return password;
}

/**
 * Check if password meets basic requirements
 */
export function meetsBasicRequirements(password: string, requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS): boolean {
  if (!password || password.length < requirements.minLength || password.length > requirements.maxLength) {
    return false;
  }

  if (requirements.requireUppercase && !/[A-Z]/.test(password)) return false;
  if (requirements.requireLowercase && !/[a-z]/.test(password)) return false;
  if (requirements.requireNumbers && !/\d/.test(password)) return false;
  if (requirements.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

  return true;
} 