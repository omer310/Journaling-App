import { sessionUtils } from './sessionSecurity';

// Security monitoring configuration
export const MONITORING_CONFIG = {
  // Failed login attempts
  FAILED_LOGIN_THRESHOLD: 3,
  FAILED_LOGIN_WINDOW_MS: 5 * 60 * 1000, // 5 minutes
  FAILED_LOGIN_LOCKOUT_MS: 15 * 60 * 1000, // 15 minutes
  
  // Rapid actions
  RAPID_ACTIONS_THRESHOLD: 10,
  RAPID_ACTIONS_WINDOW_MS: 60 * 1000, // 1 minute
  
  // Unusual patterns
  UNUSUAL_PATTERN_THRESHOLD: 5,
  UNUSUAL_PATTERN_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
  
  // Geographic anomalies
  MAX_LOCATION_CHANGE_KM: 1000, // 1000km
  LOCATION_CHECK_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
  
  // Device fingerprinting
  DEVICE_FINGERPRINT_ENABLED: true,
  FINGERPRINT_MISMATCH_THRESHOLD: 3,
} as const;

// Security event types
export type SecurityEventType = 
  | 'FAILED_LOGIN'
  | 'LOGIN_SUCCESS'
  | 'RAPID_ACTIONS'
  | 'UNUSUAL_PATTERN'
  | 'LOCATION_ANOMALY'
  | 'DEVICE_MISMATCH'
  | 'SUSPICIOUS_ACTIVITY'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SESSION_HIJACKING_ATTEMPT';

// Security event interface
interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  userId?: string;
  email?: string;
  timestamp: number;
  details: {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    deviceFingerprint?: string;
    action?: string;
    count?: number;
    reason?: string;
  };
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
}

// Anomaly detection interface
interface AnomalyPattern {
  type: string;
  threshold: number;
  windowMs: number;
  events: SecurityEvent[];
}

// Security monitoring class
class SecurityMonitoring {
  private events: SecurityEvent[] = [];
  private patterns: Map<string, AnomalyPattern> = new Map();
  private alerts: SecurityEvent[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.initializePatterns();
    this.startMonitoring();
  }
  
  /**
   * Initialize anomaly patterns
   */
  private initializePatterns(): void {
    // Failed login pattern
    this.patterns.set('failed_login', {
      type: 'FAILED_LOGIN',
      threshold: MONITORING_CONFIG.FAILED_LOGIN_THRESHOLD,
      windowMs: MONITORING_CONFIG.FAILED_LOGIN_WINDOW_MS,
      events: [],
    });
    
    // Rapid actions pattern
    this.patterns.set('rapid_actions', {
      type: 'RAPID_ACTIONS',
      threshold: MONITORING_CONFIG.RAPID_ACTIONS_THRESHOLD,
      windowMs: MONITORING_CONFIG.RAPID_ACTIONS_WINDOW_MS,
      events: [],
    });
    
    // Unusual patterns
    this.patterns.set('unusual_patterns', {
      type: 'UNUSUAL_PATTERN',
      threshold: MONITORING_CONFIG.UNUSUAL_PATTERN_THRESHOLD,
      windowMs: MONITORING_CONFIG.UNUSUAL_PATTERN_WINDOW_MS,
      events: [],
    });
  }
  
  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.analyzePatterns();
      this.cleanupOldEvents();
    }, 30000); // Check every 30 seconds
  }
  
  /**
   * Record a security event
   */
  recordEvent(
    type: SecurityEventType,
    details: SecurityEvent['details'],
    severity: SecurityEvent['severity'] = 'MEDIUM',
    userId?: string,
    email?: string
  ): void {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      type,
      userId,
      email,
      timestamp: Date.now(),
      details,
      severity,
      resolved: false,
    };
    
    this.events.push(event);
    this.updatePatterns(event);
    this.checkForAnomalies(event);
    
    // Send to server if critical
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      this.reportToServer(event);
    }
  }
  
  /**
   * Update pattern tracking
   */
  private updatePatterns(event: SecurityEvent): void {
    const pattern = this.patterns.get(this.getPatternKey(event.type));
    if (pattern) {
      pattern.events.push(event);
      
      // Keep only events within the window
      const cutoff = Date.now() - pattern.windowMs;
      pattern.events = pattern.events.filter(e => e.timestamp > cutoff);
    }
  }
  
  /**
   * Check for anomalies
   */
  private checkForAnomalies(event: SecurityEvent): void {
    const pattern = this.patterns.get(this.getPatternKey(event.type));
    if (!pattern) return;
    
    if (pattern.events.length >= pattern.threshold) {
      this.handleAnomaly(event.type, pattern.events);
    }
  }
  
  /**
   * Handle detected anomaly
   */
  private handleAnomaly(type: SecurityEventType, events: SecurityEvent[]): void {
    const latestEvent = events[events.length - 1];
    
    switch (type) {
      case 'FAILED_LOGIN':
        this.handleFailedLoginAnomaly(latestEvent);
        break;
      case 'RAPID_ACTIONS':
        this.handleRapidActionsAnomaly(latestEvent);
        break;
      case 'UNUSUAL_PATTERN':
        this.handleUnusualPatternAnomaly(latestEvent);
        break;
      default:
        this.handleGenericAnomaly(latestEvent);
    }
  }
  
  /**
   * Handle failed login anomaly
   */
  private handleFailedLoginAnomaly(event: SecurityEvent): void {
    const email = event.email;
    if (!email) return;
    
    // Record critical security event (rate limiting is handled by the login page)
    this.recordEvent('SUSPICIOUS_ACTIVITY', {
      ...event.details,
      reason: 'Multiple failed login attempts',
      count: this.patterns.get('failed_login')?.events.length || 0,
    }, 'HIGH', event.userId, email);
    
    // Trigger account lockout notification
    this.lockoutAccount(email, 'Multiple failed login attempts');
  }
  
  /**
   * Handle rapid actions anomaly
   */
  private handleRapidActionsAnomaly(event: SecurityEvent): void {
    const userId = event.userId;
    if (!userId) return;
    
    // Record suspicious activity (rate limiting should be handled by the specific actions)
    this.recordEvent('SUSPICIOUS_ACTIVITY', {
      ...event.details,
      reason: 'Rapid actions detected',
      count: this.patterns.get('rapid_actions')?.events.length || 0,
    }, 'MEDIUM', userId);
  }
  
  /**
   * Handle unusual pattern anomaly
   */
  private handleUnusualPatternAnomaly(event: SecurityEvent): void {
    const userId = event.userId;
    if (!userId) return;
    
    // Record suspicious activity
    this.recordEvent('SUSPICIOUS_ACTIVITY', {
      ...event.details,
      reason: 'Unusual activity pattern detected',
      count: this.patterns.get('unusual_patterns')?.events.length || 0,
    }, 'MEDIUM', userId);
    
    // Implement additional monitoring
    this.enableEnhancedMonitoring(userId);
  }
  
  /**
   * Handle generic anomaly
   */
  private handleGenericAnomaly(event: SecurityEvent): void {
    this.recordEvent('SUSPICIOUS_ACTIVITY', {
      ...event.details,
      reason: 'Anomaly detected',
    }, 'MEDIUM', event.userId, event.email);
  }
  
  /**
   * Lockout account
   */
  private lockoutAccount(email: string, reason: string): void {
    // Record lockout event
    this.recordEvent('SUSPICIOUS_ACTIVITY', {
      reason: `Account lockout: ${reason}`,
    }, 'HIGH', undefined, email);
    
    // Trigger lockout notification
    const lockoutEvent = new CustomEvent('account-lockout', {
      detail: { email, reason, duration: MONITORING_CONFIG.FAILED_LOGIN_LOCKOUT_MS },
    });
    window.dispatchEvent(lockoutEvent);
  }
  
  /**
   * Enable enhanced monitoring
   */
  private enableEnhancedMonitoring(userId: string): void {
    // This would implement additional monitoring for suspicious users
    console.warn('Enhanced monitoring enabled for user:', userId);
  }
  
  /**
   * Analyze patterns
   */
  private analyzePatterns(): void {
    // Check for geographic anomalies
    this.checkGeographicAnomalies();
    
    // Check for device fingerprint mismatches
    this.checkDeviceFingerprint();
    
    // Check for session hijacking attempts
    this.checkSessionHijacking();
  }
  
  /**
   * Check for geographic anomalies
   */
  private checkGeographicAnomalies(): void {
    // This would check if user location has changed significantly
    // Implementation would depend on IP geolocation service
  }
  
  /**
   * Check device fingerprint
   */
  private checkDeviceFingerprint(): void {
    if (!MONITORING_CONFIG.DEVICE_FINGERPRINT_ENABLED) return;
    
    // This would compare current device fingerprint with stored one
    // Implementation would depend on device fingerprinting library
  }
  
  /**
   * Check for session hijacking
   */
  private checkSessionHijacking(): void {
    // This would check for multiple active sessions from different locations
    // Implementation would depend on session management
  }
  
  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    this.events = this.events.filter(event => event.timestamp > cutoff);
  }
  
  /**
   * Report event to server
   */
  private async reportToServer(event: SecurityEvent): Promise<void> {
    try {
      await fetch('/api/security/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.error('Failed to report security event:', error);
    }
  }
  
  /**
   * Get pattern key
   */
  private getPatternKey(type: SecurityEventType): string {
    switch (type) {
      case 'FAILED_LOGIN':
        return 'failed_login';
      case 'RAPID_ACTIONS':
        return 'rapid_actions';
      case 'UNUSUAL_PATTERN':
        return 'unusual_patterns';
      default:
        return 'generic';
    }
  }
  
  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get security events
   */
  getEvents(filter?: Partial<SecurityEvent>): SecurityEvent[] {
    let events = this.events;
    
    if (filter) {
      events = events.filter(event => {
        return Object.entries(filter).every(([key, value]) => {
          return (event as any)[key] === value;
        });
      });
    }
    
    return events.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Get alerts
   */
  getAlerts(): SecurityEvent[] {
    return this.alerts.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * Resolve alert
   */
  resolveAlert(eventId: string): void {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.resolved = true;
    }
    
    const alert = this.alerts.find(a => a.id === eventId);
    if (alert) {
      this.alerts = this.alerts.filter(a => a.id !== eventId);
    }
  }
  
  /**
   * Get security statistics
   */
  getStatistics(): {
    totalEvents: number;
    criticalEvents: number;
    unresolvedAlerts: number;
    recentActivity: SecurityEvent[];
  } {
    const now = Date.now();
    const recentCutoff = now - (60 * 60 * 1000); // 1 hour
    
    return {
      totalEvents: this.events.length,
      criticalEvents: this.events.filter(e => e.severity === 'CRITICAL').length,
      unresolvedAlerts: this.alerts.filter(a => !a.resolved).length,
      recentActivity: this.events.filter(e => e.timestamp > recentCutoff),
    };
  }
}

// Global security monitoring instance
export const securityMonitoring = new SecurityMonitoring();

/**
 * Security monitoring hook for React components
 */
export function useSecurityMonitoring() {
  return {
    getEvents: securityMonitoring.getEvents.bind(securityMonitoring),
    getAlerts: securityMonitoring.getAlerts.bind(securityMonitoring),
    getStatistics: securityMonitoring.getStatistics.bind(securityMonitoring),
    resolveAlert: securityMonitoring.resolveAlert.bind(securityMonitoring),
  };
}

/**
 * Security monitoring utilities
 */
export const monitoringUtils = {
  // Record security event
  recordEvent: (
    type: SecurityEventType,
    details: SecurityEvent['details'],
    severity?: SecurityEvent['severity'],
    userId?: string,
    email?: string
  ) => {
    securityMonitoring.recordEvent(type, details, severity, userId, email);
  },
  
  // Record failed login
  recordFailedLogin: (email: string, details: SecurityEvent['details']) => {
    securityMonitoring.recordEvent('FAILED_LOGIN', details, 'MEDIUM', undefined, email);
  },
  
  // Record rapid actions
  recordRapidActions: (userId: string, action: string, count: number) => {
    securityMonitoring.recordEvent('RAPID_ACTIONS', {
      action,
      count,
    }, 'LOW', userId);
  },
  
  // Record unusual pattern
  recordUnusualPattern: (userId: string, pattern: string, details: SecurityEvent['details']) => {
    securityMonitoring.recordEvent('UNUSUAL_PATTERN', {
      ...details,
      reason: pattern,
    }, 'MEDIUM', userId);
  },
  
  // Get events
  getEvents: securityMonitoring.getEvents.bind(securityMonitoring),
  
  // Get alerts
  getAlerts: securityMonitoring.getAlerts.bind(securityMonitoring),
  
  // Get statistics
  getStatistics: securityMonitoring.getStatistics.bind(securityMonitoring),
}; 