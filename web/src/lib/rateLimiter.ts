import { useCallback } from 'react';

// Rate limiting configuration
export const RATE_LIMITS = {
  // Login attempts
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: 5,
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    LOCKOUT_MS: 30 * 60 * 1000, // 30 minutes
  },
  
  // Journal entry creation
  CREATE_ENTRY: {
    MAX_ATTEMPTS: 10,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
  
  // Search requests
  SEARCH: {
    MAX_ATTEMPTS: 20,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
  
  // API requests
  API_REQUESTS: {
    MAX_ATTEMPTS: 50,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
  
  // Export requests
  EXPORT: {
    MAX_ATTEMPTS: 3,
    WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  },
  
  // Settings updates
  SETTINGS_UPDATE: {
    MAX_ATTEMPTS: 10,
    WINDOW_MS: 60 * 1000, // 1 minute
  },
} as const;

// Rate limit entry interface
interface RateLimitEntry {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
  lockedUntil?: number;
}

// Rate limit storage
class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private storageKey = 'rate_limits';
  
  constructor() {
    this.loadFromStorage();
  }
  
  /**
   * Load rate limits from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.limits = new Map(Object.entries(data));
      }
    } catch (error) {
      console.warn('Failed to load rate limits from storage:', error);
    }
  }
  
  /**
   * Save rate limits to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data = Object.fromEntries(this.limits);
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save rate limits to storage:', error);
    }
  }
  
  /**
   * Check if an action is allowed
   */
  isAllowed(action: string, identifier: string = 'default'): boolean {
    const key = `${action}:${identifier}`;
    const entry = this.limits.get(key);
    
    if (!entry) {
      return true;
    }
    
    const now = Date.now();
    const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
    
    if (!config) {
      return true;
    }
    
    // Check if locked out
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return false;
    }
    
    // Reset if window has passed
    if (now - entry.firstAttempt > config.WINDOW_MS) {
      this.limits.delete(key);
      this.saveToStorage();
      return true;
    }
    
    // Check if within limits
    return entry.count < config.MAX_ATTEMPTS;
  }
  
  /**
   * Record an attempt
   */
  recordAttempt(action: string, identifier: string = 'default'): void {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
    
    if (!config) {
      return;
    }
    
    const existing = this.limits.get(key);
    
    if (!existing) {
      // First attempt
      const newEntry = {
        count: 1,
        firstAttempt: now,
        lastAttempt: now,
      };
      this.limits.set(key, newEntry);
    } else {
      // Check if window has passed
      if (now - existing.firstAttempt > config.WINDOW_MS) {
        // Reset window
        const resetEntry = {
          count: 1,
          firstAttempt: now,
          lastAttempt: now,
        };
        this.limits.set(key, resetEntry);
      } else {
        // Increment count
        existing.count++;
        existing.lastAttempt = now;
        
        // Check if we should lock out
        if (existing.count >= config.MAX_ATTEMPTS && 'LOCKOUT_MS' in config) {
          existing.lockedUntil = now + (config as any).LOCKOUT_MS;
        }
      }
    }
    
    this.saveToStorage();
  }
  
  /**
   * Get remaining attempts
   */
  getRemainingAttempts(action: string, identifier: string = 'default'): number {
    const key = `${action}:${identifier}`;
    const entry = this.limits.get(key);
    const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
    
    if (!entry || !config) {
      return config?.MAX_ATTEMPTS || 0;
    }
    
    const now = Date.now();
    
    // Check if window has passed
    if (now - entry.firstAttempt > config.WINDOW_MS) {
      return config.MAX_ATTEMPTS;
    }
    
    // Check if locked out
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return 0;
    }
    
    return Math.max(0, config.MAX_ATTEMPTS - entry.count);
  }
  
  /**
   * Get time until reset
   */
  getTimeUntilReset(action: string, identifier: string = 'default'): number {
    const key = `${action}:${identifier}`;
    const entry = this.limits.get(key);
    const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
    
    if (!entry || !config) {
      return 0;
    }
    
    const now = Date.now();
    
    // If locked out, return time until lockout ends
    if (entry.lockedUntil && now < entry.lockedUntil) {
      return entry.lockedUntil - now;
    }
    
    // Return time until window resets
    const windowEnd = entry.firstAttempt + config.WINDOW_MS;
    return Math.max(0, windowEnd - now);
  }
  
  /**
   * Clear all limits for an action/identifier
   */
  clear(action: string, identifier: string = 'default'): void {
    const key = `${action}:${identifier}`;
    this.limits.delete(key);
    this.saveToStorage();
  }
  
  /**
   * Clear all limits
   */
  clearAll(): void {
    this.limits.clear();
    this.saveToStorage();
  }
  
  /**
   * Get current limits status
   */
  getStatus(action: string, identifier: string = 'default'): {
    isAllowed: boolean;
    remainingAttempts: number;
    timeUntilReset: number;
    isLocked: boolean;
  } {
    const key = `${action}:${identifier}`;
    const entry = this.limits.get(key);
    const config = RATE_LIMITS[action as keyof typeof RATE_LIMITS];
    
    if (!entry || !config) {
      return {
        isAllowed: true,
        remainingAttempts: config?.MAX_ATTEMPTS || 0,
        timeUntilReset: 0,
        isLocked: false,
      };
    }
    
    const now = Date.now();
    const isLocked = !!(entry.lockedUntil && now < entry.lockedUntil);
    
    return {
      isAllowed: this.isAllowed(action, identifier),
      remainingAttempts: this.getRemainingAttempts(action, identifier),
      timeUntilReset: this.getTimeUntilReset(action, identifier),
      isLocked,
    };
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

/**
 * Rate limiting decorator for functions
 */
export function withRateLimit(
  action: string,
  identifier?: string | (() => string)
) {
  return function <T extends (...args: any[]) => any>(
    target: T
  ): T {
    return ((...args: any[]) => {
      const id = typeof identifier === 'function' ? identifier() : identifier || 'default';
      
      if (!rateLimiter.isAllowed(action, id)) {
        const status = rateLimiter.getStatus(action, id);
        throw new Error(
          `Rate limit exceeded for ${action}. Please wait ${Math.ceil(status.timeUntilReset / 1000)} seconds.`
        );
      }
      
      rateLimiter.recordAttempt(action, id);
      return target(...args);
    }) as T;
  };
}

/**
 * Rate limiting hook for React components
 */
export function useRateLimit(action: string, identifier?: string) {
  const id = identifier || 'default';
  
  const checkLimit = useCallback(() => {
    return rateLimiter.isAllowed(action, id);
  }, [action, id]);
  
  const recordAttempt = useCallback(() => {
    rateLimiter.recordAttempt(action, id);
  }, [action, id]);
  
  const getStatus = useCallback(() => {
    return rateLimiter.getStatus(action, id);
  }, [action, id]);
  
  const clear = useCallback(() => {
    rateLimiter.clear(action, id);
  }, [action, id]);
  
  return {
    checkLimit,
    recordAttempt,
    getStatus,
    clear,
    isAllowed: checkLimit(),
  };
}

/**
 * Rate limiting utilities for specific actions
 */
export const rateLimitUtils = {
  // Login rate limiting
  login: {
    check: (email: string) => rateLimiter.isAllowed('LOGIN_ATTEMPTS', email),
    record: (email: string) => rateLimiter.recordAttempt('LOGIN_ATTEMPTS', email),
    getStatus: (email: string) => rateLimiter.getStatus('LOGIN_ATTEMPTS', email),
    clear: (email: string) => rateLimiter.clear('LOGIN_ATTEMPTS', email),
  },
  
  // Entry creation rate limiting
  createEntry: {
    check: (userId: string) => rateLimiter.isAllowed('CREATE_ENTRY', userId),
    record: (userId: string) => rateLimiter.recordAttempt('CREATE_ENTRY', userId),
    getStatus: (userId: string) => rateLimiter.getStatus('CREATE_ENTRY', userId),
    clear: (userId: string) => rateLimiter.clear('CREATE_ENTRY', userId),
  },
  
  // Search rate limiting
  search: {
    check: (userId: string) => rateLimiter.isAllowed('SEARCH', userId),
    record: (userId: string) => rateLimiter.recordAttempt('SEARCH', userId),
    getStatus: (userId: string) => rateLimiter.getStatus('SEARCH', userId),
    clear: (userId: string) => rateLimiter.clear('SEARCH', userId),
  },
  
  // API rate limiting
  api: {
    check: (userId: string) => rateLimiter.isAllowed('API_REQUESTS', userId),
    record: (userId: string) => rateLimiter.recordAttempt('API_REQUESTS', userId),
    getStatus: (userId: string) => rateLimiter.getStatus('API_REQUESTS', userId),
    clear: (userId: string) => rateLimiter.clear('API_REQUESTS', userId),
  },
  
  // Export rate limiting
  export: {
    check: (userId: string) => rateLimiter.isAllowed('EXPORT', userId),
    record: (userId: string) => rateLimiter.recordAttempt('EXPORT', userId),
    getStatus: (userId: string) => rateLimiter.getStatus('EXPORT', userId),
    clear: (userId: string) => rateLimiter.clear('EXPORT', userId),
  },
  
  // Settings rate limiting
  settings: {
    check: (userId: string) => rateLimiter.isAllowed('SETTINGS_UPDATE', userId),
    record: (userId: string) => rateLimiter.recordAttempt('SETTINGS_UPDATE', userId),
    getStatus: (userId: string) => rateLimiter.getStatus('SETTINGS_UPDATE', userId),
    clear: (userId: string) => rateLimiter.clear('SETTINGS_UPDATE', userId),
  },
}; 