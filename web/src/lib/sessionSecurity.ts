import { rateLimitUtils } from './rateLimiter';

// Session security configuration - VERY SECURE for privacy
export const SESSION_CONFIG = {
  // Session timeout (5 minutes maximum for security)
  SESSION_TIMEOUT_MS: 5 * 60 * 1000,
  
  // Refresh token before expiry (1 minute)
  REFRESH_BEFORE_EXPIRY_MS: 1 * 60 * 1000,
  
  // Maximum session age (30 minutes absolute maximum)
  MAX_SESSION_AGE_MS: 30 * 60 * 1000,
  
  // Inactivity timeout (5 minutes maximum)
  INACTIVITY_TIMEOUT_MS: 5 * 60 * 1000,
  
  // Session validation interval (30 seconds for aggressive checking)
  VALIDATION_INTERVAL_MS: 30 * 1000,
} as const;

// Session state interface
interface SessionState {
  userId: string;
  email: string;
  lastActivity: number;
  sessionStart: number;
  refreshToken?: string;
  isActive: boolean;
  deviceInfo: {
    userAgent: string;
    ipAddress?: string;
    location?: string;
  };
}

// Session security class
class SessionSecurity {
  private currentSession: SessionState | null = null;
  private validationInterval: NodeJS.Timeout | null = null;
  private inactivityTimeout: NodeJS.Timeout | null = null;
  private refreshTimeout: NodeJS.Timeout | null = null;
  
  /**
   * Initialize session security
   */
  initialize(userId: string, email: string, refreshToken?: string): void {
    this.currentSession = {
      userId,
      email,
      lastActivity: Date.now(),
      sessionStart: Date.now(),
      refreshToken,
      isActive: true,
      deviceInfo: {
        userAgent: navigator.userAgent,
        ipAddress: undefined, // Would be set by server
        location: undefined, // Would be set by server
      },
    };
    
    this.startSessionMonitoring();
  }
  
  /**
   * Start monitoring session activity
   */
  private startSessionMonitoring(): void {
    // Clear existing intervals
    this.clearTimeouts();
    
    // Set up activity tracking
    this.setupActivityTracking();
    
    // Set up session validation
    this.validationInterval = setInterval(() => {
      this.validateSession();
    }, SESSION_CONFIG.VALIDATION_INTERVAL_MS);
    
    // Set up inactivity timeout
    this.resetInactivityTimeout();
    
    // Set up refresh timeout
    this.setupRefreshTimeout();
  }
  
  /**
   * Set up activity tracking
   */
  private setupActivityTracking(): void {
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const updateActivity = () => {
      if (this.currentSession) {
        this.currentSession.lastActivity = Date.now();
        this.resetInactivityTimeout();
      }
    };
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    
    // Store cleanup function
    this.cleanupActivityTracking = () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }
  
  private cleanupActivityTracking?: () => void;
  
  /**
   * Reset inactivity timeout
   */
  private resetInactivityTimeout(): void {
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
    }
    
    this.inactivityTimeout = setTimeout(() => {
      this.handleInactivity();
    }, SESSION_CONFIG.INACTIVITY_TIMEOUT_MS);
  }
  
  /**
   * Set up refresh timeout
   */
  private setupRefreshTimeout(): void {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }
    
    const timeUntilRefresh = SESSION_CONFIG.SESSION_TIMEOUT_MS - SESSION_CONFIG.REFRESH_BEFORE_EXPIRY_MS;
    
    this.refreshTimeout = setTimeout(() => {
      this.refreshSession();
    }, timeUntilRefresh);
  }
  
  /**
   * Validate current session
   */
  private validateSession(): void {
    if (!this.currentSession) {
      return;
    }
    
    const now = Date.now();
    const sessionAge = now - this.currentSession.sessionStart;
    const timeSinceActivity = now - this.currentSession.lastActivity;
    
    // Check session age
    if (sessionAge > SESSION_CONFIG.MAX_SESSION_AGE_MS) {
      this.forceLogout('Session expired due to age');
      return;
    }
    
    // Check inactivity
    if (timeSinceActivity > SESSION_CONFIG.INACTIVITY_TIMEOUT_MS) {
      this.handleInactivity();
      return;
    }
    
    // Check if session is still valid with server
    this.validateWithServer();
  }
  
  /**
   * Validate session with server
   */
  private async validateWithServer(): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    
    try {
      // This would make an API call to validate the session
      // For now, we'll just check if the session exists
      const response = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.currentSession.userId,
          sessionStart: this.currentSession.sessionStart,
        }),
      });
      
      if (!response.ok) {
        this.forceLogout('Session validation failed');
      }
    } catch (error) {
      console.warn('Session validation error:', error);
      // Don't force logout on network errors
    }
  }
  
  /**
   * Handle user inactivity
   */
  private handleInactivity(): void {
    if (!this.currentSession) {
      return;
    }
    
    // Show inactivity warning
    this.showInactivityWarning();
    
    // Set up final timeout
    setTimeout(() => {
      if (this.currentSession) {
        this.forceLogout('Session expired due to inactivity');
      }
    }, 60000); // 1 minute warning
  }
  
  /**
   * Show inactivity warning
   */
  private showInactivityWarning(): void {
    // This would trigger the inactivity warning component
    const event = new CustomEvent('session-inactivity-warning', {
      detail: {
        timeRemaining: 60000,
        message: 'You will be logged out due to inactivity in 1 minute.',
      },
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Refresh session
   */
  private async refreshSession(): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    
    try {
      // This would make an API call to refresh the session
      const response = await fetch('/api/auth/refresh-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.currentSession.userId,
          refreshToken: this.currentSession.refreshToken,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        this.currentSession.refreshToken = data.refreshToken;
        this.currentSession.lastActivity = Date.now();
        this.setupRefreshTimeout();
      } else {
        this.forceLogout('Session refresh failed');
      }
    } catch (error) {
      console.warn('Session refresh error:', error);
      this.forceLogout('Session refresh failed');
    }
  }
  
  /**
   * Force logout
   */
  private forceLogout(reason: string): void {
    console.warn('Forcing logout:', reason);
    
    // Clear session data
    this.clearSession();
    
    // Clear rate limits for this user
    if (this.currentSession) {
      rateLimitUtils.login.clear(this.currentSession.email);
    }
    
    // Trigger logout event
    const event = new CustomEvent('session-forced-logout', {
      detail: { reason },
    });
    window.dispatchEvent(event);
    
    // Redirect to login
    window.location.href = '/login?reason=' + encodeURIComponent(reason);
  }
  
  /**
   * Clear session
   */
  private clearSession(): void {
    this.currentSession = null;
    this.clearTimeouts();
    
    if (this.cleanupActivityTracking) {
      this.cleanupActivityTracking();
    }
  }
  
  /**
   * Clear all timeouts
   */
  private clearTimeouts(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
      this.validationInterval = null;
    }
    
    if (this.inactivityTimeout) {
      clearTimeout(this.inactivityTimeout);
      this.inactivityTimeout = null;
    }
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }
  
  /**
   * Get current session info
   */
  getSessionInfo(): SessionState | null {
    return this.currentSession;
  }
  
  /**
   * Check if session is active
   */
  isSessionActive(): boolean {
    return this.currentSession?.isActive || false;
  }
  
  /**
   * Get time until session expires
   */
  getTimeUntilExpiry(): number {
    if (!this.currentSession) {
      return 0;
    }
    
    const now = Date.now();
    const timeSinceActivity = now - this.currentSession.lastActivity;
    return Math.max(0, SESSION_CONFIG.INACTIVITY_TIMEOUT_MS - timeSinceActivity);
  }
  
  /**
   * Extend session (called on user activity)
   */
  extendSession(): void {
    if (this.currentSession) {
      this.currentSession.lastActivity = Date.now();
      this.resetInactivityTimeout();
    }
  }
  
  /**
   * Secure logout
   */
  async secureLogout(): Promise<void> {
    if (!this.currentSession) {
      return;
    }
    
    try {
      // Notify server of logout
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: this.currentSession.userId,
          sessionStart: this.currentSession.sessionStart,
        }),
      });
    } catch (error) {
      console.warn('Logout notification failed:', error);
    }
    
    // Clear session data
    this.clearSession();
    
    // Clear rate limits
    if (this.currentSession) {
      rateLimitUtils.login.clear(this.currentSession.email);
    }
    
    // Clear local storage
    localStorage.removeItem('session');
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.split('=');
      document.cookie = `${name.trim()}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    });
  }
  
  /**
   * Update device info
   */
  updateDeviceInfo(deviceInfo: Partial<SessionState['deviceInfo']>): void {
    if (this.currentSession) {
      this.currentSession.deviceInfo = {
        ...this.currentSession.deviceInfo,
        ...deviceInfo,
      };
    }
  }
}

// Global session security instance
export const sessionSecurity = new SessionSecurity();

/**
 * Session security hook for React components
 */
export function useSessionSecurity() {
  return {
    isSessionActive: sessionSecurity.isSessionActive(),
    getSessionInfo: sessionSecurity.getSessionInfo(),
    getTimeUntilExpiry: sessionSecurity.getTimeUntilExpiry(),
    extendSession: sessionSecurity.extendSession.bind(sessionSecurity),
    secureLogout: sessionSecurity.secureLogout.bind(sessionSecurity),
  };
}

/**
 * Session security utilities
 */
export const sessionUtils = {
  // Initialize session
  initialize: (userId: string, email: string, refreshToken?: string) => {
    sessionSecurity.initialize(userId, email, refreshToken);
  },
  
  // Check session status
  isActive: () => sessionSecurity.isSessionActive(),
  
  // Get session info
  getInfo: () => sessionSecurity.getSessionInfo(),
  
  // Extend session
  extend: () => sessionSecurity.extendSession(),
  
  // Secure logout
  logout: () => sessionSecurity.secureLogout(),
  
  // Update device info
  updateDevice: (deviceInfo: Partial<SessionState['deviceInfo']>) => {
    sessionSecurity.updateDeviceInfo(deviceInfo);
  },
}; 