// Utility functions for handling dates and timezones consistently

export function formatEntryDate(dateString: string): string {
  // Parse the date and ensure it's displayed in the user's local timezone
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long',
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric'
  });
}

export function formatEntryTime(dateString: string): string {
  // Parse the date and ensure it's displayed in the user's local timezone
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

export function formatEntryDateShort(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'numeric', 
    day: 'numeric'
  });
}

export function formatEntryDateWithYear(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    year: 'numeric', 
    month: 'numeric', 
    day: 'numeric'
  });
}

export function getCurrentTimestamp(): string {
  // Store the current local time as a timestamp that preserves the user's timezone
  const now = new Date();
  
  // Get the local date/time components
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  // Get timezone offset in minutes and convert to hours
  const timezoneOffset = now.getTimezoneOffset();
  const timezoneHours = Math.abs(Math.floor(timezoneOffset / 60));
  const timezoneMinutes = Math.abs(timezoneOffset % 60);
  const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
  
  // Create a datetime string with timezone information
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneSign}${String(timezoneHours).padStart(2, '0')}:${String(timezoneMinutes).padStart(2, '0')}`;
}

export function normalizeDateForDisplay(dateString: string): string {
  // Convert any date string to a consistent format for display
  const date = new Date(dateString);
  
  // If the date is invalid, return the original string
  if (isNaN(date.getTime())) {
    return dateString;
  }
  
  // Return the date in YYYY-MM-DD format for consistent comparison
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

export function normalizeDateForStorage(dateString: string): string {
  // Convert any date string to a consistent format for storage
  const date = new Date(dateString);
  
  // If the date is invalid, return the original string
  if (isNaN(date.getTime())) {
    console.warn('Invalid date string:', dateString);
    return dateString;
  }
  
  // Get the local date/time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Get timezone offset in minutes and convert to hours
  const timezoneOffset = date.getTimezoneOffset();
  const timezoneHours = Math.abs(Math.floor(timezoneOffset / 60));
  const timezoneMinutes = Math.abs(timezoneOffset % 60);
  const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
  
  // Create a datetime string with timezone information
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneSign}${String(timezoneHours).padStart(2, '0')}:${String(timezoneMinutes).padStart(2, '0')}`;
}

export function normalizeDateForMobileEntry(dateString: string): string {
  // Special handling for mobile entries that might be in UTC
  const date = new Date(dateString);
  
  // If the date is invalid, return the original string
  if (isNaN(date.getTime())) {
    console.warn('Invalid mobile date string:', dateString);
    return dateString;
  }
  
  // Check if the date string looks like it might be UTC (no timezone info)
  const isLikelyUTC = !dateString.includes('+') && !dateString.includes('-') && dateString.includes('T');
  
  if (isLikelyUTC) {
    // Get current date to compare
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    const mobileDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // If the mobile date is one day ahead of current date, adjust it
    if (mobileDate !== currentDate) {
      
      // Create a new date with the current date but keep the time from mobile
      const adjustedDate = new Date(date);
      const [year, month, day] = currentDate.split('-').map(Number);
      adjustedDate.setFullYear(year);
      adjustedDate.setMonth(month - 1); // Month is 0-indexed
      adjustedDate.setDate(day);
      
      // Now normalize this adjusted date
      const yearStr = adjustedDate.getFullYear();
      const monthStr = String(adjustedDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(adjustedDate.getDate()).padStart(2, '0');
      const hoursStr = String(adjustedDate.getHours()).padStart(2, '0');
      const minutesStr = String(adjustedDate.getMinutes()).padStart(2, '0');
      const secondsStr = String(adjustedDate.getSeconds()).padStart(2, '0');
      
      // Get timezone offset
      const timezoneOffset = adjustedDate.getTimezoneOffset();
      const timezoneHours = Math.abs(Math.floor(timezoneOffset / 60));
      const timezoneMinutes = Math.abs(timezoneOffset % 60);
      const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
      
      return `${yearStr}-${monthStr}-${dayStr}T${hoursStr}:${minutesStr}:${secondsStr}${timezoneSign}${String(timezoneHours).padStart(2, '0')}:${String(timezoneMinutes).padStart(2, '0')}`;
    }
    
    // If dates match, use regular UTC to local conversion
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    const seconds = String(localDate.getSeconds()).padStart(2, '0');
    
    // Get timezone offset in minutes and convert to hours
    const timezoneOffset = localDate.getTimezoneOffset();
    const timezoneHours = Math.abs(Math.floor(timezoneOffset / 60));
    const timezoneMinutes = Math.abs(timezoneOffset % 60);
    const timezoneSign = timezoneOffset <= 0 ? '+' : '-';
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneSign}${String(timezoneHours).padStart(2, '0')}:${String(timezoneMinutes).padStart(2, '0')}`;
  }
  
  // If it already has timezone info, use the regular normalization
  return normalizeDateForStorage(dateString);
}

// Inactivity timer utilities for security
export function getLastActivityTime(): number {
  return parseInt(localStorage.getItem('lastActivityTime') || '0');
}

export function updateLastActivityTime(): void {
  localStorage.setItem('lastActivityTime', Date.now().toString());
}

export function getInactivityTimeout(): number {
  // Default to 15 minutes (900000 ms) for good balance of security and usability
  const timeout = parseInt(localStorage.getItem('inactivityTimeout') || '900000');
  // Return the user's preferred timeout without artificial caps
  // (Individual components can enforce their own limits if needed)
  return timeout;
}

export function setInactivityTimeout(timeoutMs: number): void {
  // Allow flexible timeout settings as per user preference
  // Enforce reasonable minimum of 1 minute for security
  const secureTimeout = Math.max(timeoutMs, 60000);
  localStorage.setItem('inactivityTimeout', secureTimeout.toString());
}

export function checkInactivity(): boolean {
  const lastActivity = getLastActivityTime();
  const timeout = getInactivityTimeout();
  const now = Date.now();
  
  return (now - lastActivity) > timeout;
}

export function clearInactivityData(): void {
  localStorage.removeItem('lastActivityTime');
}

// SMART session security - activity-aware logout protection
export function setupSmartSessionSecurity(): void {
  // Generate a unique session fingerprint
  const sessionFingerprint = generateSessionFingerprint();
  const sessionStartTime = Date.now();
  
  localStorage.setItem('sessionStartTime', sessionStartTime.toString());
  localStorage.setItem('sessionFingerprint', sessionFingerprint);
  
  // Store current session in sessionStorage
  const sessionKey = `session_${sessionFingerprint}`;
  sessionStorage.setItem(sessionKey, 'active');

  // Track user activity and tab switching
  let lastActivityTime = Date.now();
  let tabSwitchTimeout: NodeJS.Timeout | null = null;
  let isUserActive = true;

  // Update activity timestamp
  const updateActivity = () => {
    lastActivityTime = Date.now();
    isUserActive = true;
    updateLastActivityTime(); // Update the global activity tracker
  };

  // Security logout function
  const forceSecurityLogout = (reason: string) => {
    console.log(`SECURITY: Logout triggered - ${reason}`);
    
    // Clear all session data immediately
    clearAllSessionData();
    
    // Use sendBeacon for reliable logout signal
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        type: 'security_logout',
        timestamp: Date.now(),
        sessionFingerprint: sessionFingerprint,
        reason: reason
      });
      navigator.sendBeacon('/api/auth/logout', data);
    }
    
    // Force redirect to login with security message
    window.location.href = `/login?reason=Session terminated for security: ${encodeURIComponent(reason)}`;
  };

  // SMART: Tab switching with grace period
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Start a grace period timer when tab becomes hidden
      tabSwitchTimeout = setTimeout(() => {
        // Only logout if user hasn't returned and was inactive before switching
        const timeSinceActivity = Date.now() - lastActivityTime;
        if (timeSinceActivity > 30000) { // 30 seconds of inactivity before tab switch
          forceSecurityLogout('Tab switched after period of inactivity');
        }
      }, 60000); // 1-minute grace period for tab switching
    } else {
      // User returned to tab - cancel logout timer and update activity
      if (tabSwitchTimeout) {
        clearTimeout(tabSwitchTimeout);
        tabSwitchTimeout = null;
      }
      updateActivity();
    }
  };

  // SMART: Only logout on window blur if user has been inactive
  const handleWindowBlur = () => {
    const timeSinceActivity = Date.now() - lastActivityTime;
    // Only logout if user has been inactive for more than 2 minutes
    if (timeSinceActivity > 120000) {
      forceSecurityLogout('Window lost focus after period of inactivity');
    }
  };

  // SECURE: Clear data on actual navigation/close
  const handleBeforeUnload = () => {
    // Clear all data on actual page unload
    clearAllSessionData();
  };

  // SECURE: Clear data on page hide (browser close)
  const handlePageHide = () => {
    clearAllSessionData();
  };

  // SECURE: Clear data on unload (browser close)
  const handleUnload = () => {
    clearAllSessionData();
  };

  // Track user activity to keep them logged in while active
  const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
  
  const handleUserActivity = () => {
    updateActivity();
  };

  // Add activity listeners
  activityEvents.forEach(event => {
    document.addEventListener(event, handleUserActivity, true);
  });

  // Add security event listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('blur', handleWindowBlur);
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('unload', handleUnload);

  // Store cleanup function
  (window as any).__smartSecurityCleanup = () => {
    // Clear timers
    if (tabSwitchTimeout) {
      clearTimeout(tabSwitchTimeout);
    }
    
    // Remove activity listeners
    activityEvents.forEach(event => {
      document.removeEventListener(event, handleUserActivity, true);
    });
    
    // Remove security listeners
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('blur', handleWindowBlur);
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('unload', handleUnload);
  };
}

function generateSessionFingerprint(): string {
  // Create a unique fingerprint based on timestamp and cryptographically secure random number
  const array = new Uint8Array(9);
  crypto.getRandomValues(array);
  // Convert to base36 string (0-9, a-z)
  const randomString = Array.from(array)
    .map(b => b.toString(36))
    .join('')
    .substring(0, 9);
  return `${Date.now()}-${randomString}`;
}

export function cleanupSmartSessionSecurity(): void {
  if ((window as any).__smartSecurityCleanup) {
    (window as any).__smartSecurityCleanup();
  }
}

// Clear all session data for maximum security
export function clearAllSessionData(): void {
  // Clear localStorage
  localStorage.removeItem('lastActivityTime');
  localStorage.removeItem('sessionStartTime');
  localStorage.removeItem('sessionFingerprint');
  localStorage.removeItem('inactivityTimeout');
  localStorage.removeItem('browserClosed');
  localStorage.removeItem('lastSessionStart');
  localStorage.removeItem('lastSessionFingerprint');
  localStorage.removeItem('sessionRestored');
  localStorage.removeItem('pageHidden');
  
  // Clear sessionStorage completely
  sessionStorage.clear();
  
  // Clear any other sensitive data that might be stored
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('session') || key.includes('auth') || key.includes('token'))) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}

// Legacy browser close detection - DEPRECATED in favor of aggressive security
// These functions are kept for compatibility but should not be used
export function checkBrowserWasClosed(): boolean {
  // Always return false - we now use aggressive security instead
  return false;
}

export function clearBrowserCloseFlag(): void {
  // Clear old flags for cleanup
  localStorage.removeItem('browserClosed');
  localStorage.removeItem('lastSessionStart');
  localStorage.removeItem('lastSessionFingerprint');
  localStorage.removeItem('sessionRestored');
  localStorage.removeItem('pageHidden');
}



