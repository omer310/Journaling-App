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
  // Default to 15 minutes (900000 ms) for better security, but can be configured
  return parseInt(localStorage.getItem('inactivityTimeout') || '900000');
}

export function setInactivityTimeout(timeoutMs: number): void {
  localStorage.setItem('inactivityTimeout', timeoutMs.toString());
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

// Browser close detection utilities
export function setupBrowserCloseDetection(): void {
  // Generate a unique session fingerprint
  const sessionFingerprint = generateSessionFingerprint();
  const sessionStartTime = Date.now();
  
  localStorage.setItem('sessionStartTime', sessionStartTime.toString());
  localStorage.setItem('sessionFingerprint', sessionFingerprint);
  
  // Check if this is a fresh page load by comparing with previous session
  const lastSessionFingerprint = localStorage.getItem('lastSessionFingerprint');
  const lastSessionStart = localStorage.getItem('lastSessionStart');
  
  // If we have a previous session but sessionStorage is empty, browser was closed
  if (lastSessionFingerprint && lastSessionFingerprint !== sessionFingerprint) {
    // Check if sessionStorage was cleared (indicates browser close)
    const sessionKey = `session_${lastSessionFingerprint}`;
    const sessionExists = sessionStorage.getItem(sessionKey);
    
    if (!sessionExists) {
      // Previous session exists but sessionStorage was cleared - browser was closed
      localStorage.setItem('browserClosed', Date.now().toString());
    }
  }
  
  // Store current session in sessionStorage
  const sessionKey = `session_${sessionFingerprint}`;
  sessionStorage.setItem(sessionKey, 'active');
  
  // Store a flag that indicates the browser was closed
  const handleBeforeUnload = () => {
    localStorage.setItem('browserClosed', Date.now().toString());
    localStorage.setItem('lastSessionStart', sessionStartTime.toString());
    localStorage.setItem('lastSessionFingerprint', sessionFingerprint);
    // Clear session restored flag when browser is actually closed
    localStorage.removeItem('sessionRestored');
  };

  const handlePageHide = () => {
    localStorage.setItem('browserClosed', Date.now().toString());
    localStorage.setItem('lastSessionStart', sessionStartTime.toString());
    localStorage.setItem('lastSessionFingerprint', sessionFingerprint);
    // Clear session restored flag when browser is actually closed
    localStorage.removeItem('sessionRestored');
  };

  // Add visibility change detection
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page became hidden - could be tab switch or browser close
      localStorage.setItem('pageHidden', Date.now().toString());
    } else {
      // Page became visible again
      const pageHidden = localStorage.getItem('pageHidden');
      if (pageHidden) {
        const hiddenTime = parseInt(pageHidden);
        const now = Date.now();
        // If page was hidden for more than 10 seconds, likely browser was closed
        if ((now - hiddenTime) > 10000) {
          localStorage.setItem('browserClosed', Date.now().toString());
        }
        localStorage.removeItem('pageHidden');
      }
    }
  };

  // Add unload detection for better production reliability
  const handleUnload = () => {
    // Use sendBeacon for more reliable data transmission in production
    if (navigator.sendBeacon) {
      const data = JSON.stringify({
        type: 'browser_close',
        timestamp: Date.now(),
        sessionFingerprint: sessionFingerprint
      });
      navigator.sendBeacon('/api/browser-close', data);
    }
    
    localStorage.setItem('browserClosed', Date.now().toString());
    localStorage.setItem('lastSessionStart', sessionStartTime.toString());
    localStorage.setItem('lastSessionFingerprint', sessionFingerprint);
    localStorage.removeItem('sessionRestored');
  };

  // Add event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('unload', handleUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  // Store cleanup function
  (window as any).__browserCloseCleanup = () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('pagehide', handlePageHide);
    window.removeEventListener('unload', handleUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

function generateSessionFingerprint(): string {
  // Create a unique fingerprint based on timestamp and random number
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function cleanupBrowserCloseDetection(): void {
  if ((window as any).__browserCloseCleanup) {
    (window as any).__browserCloseCleanup();
  }
}

export function checkBrowserWasClosed(): boolean {
  const browserClosed = localStorage.getItem('browserClosed');
  const lastSessionStart = localStorage.getItem('lastSessionStart');
  const currentSessionStart = localStorage.getItem('sessionStartTime');
  const lastSessionFingerprint = localStorage.getItem('lastSessionFingerprint');
  const currentSessionFingerprint = localStorage.getItem('sessionFingerprint');
  
  // If no browser close flag exists, browser wasn't closed
  if (!browserClosed) return false;
  
  // Check if this is a session restoration (same session continuing)
  const sessionRestored = localStorage.getItem('sessionRestored');
  if (sessionRestored === 'true') {
    return false;
  }
  
  // Check if sessionStorage was cleared (indicates browser close)
  if (lastSessionFingerprint && currentSessionFingerprint && lastSessionFingerprint !== currentSessionFingerprint) {
    const sessionKey = `session_${lastSessionFingerprint}`;
    const sessionExists = sessionStorage.getItem(sessionKey);
    if (!sessionExists) {
      return true;
    }
  }
  
  // If session fingerprints don't match, this is a new session after browser close
  if (lastSessionFingerprint && currentSessionFingerprint && lastSessionFingerprint !== currentSessionFingerprint) {
    return true;
  }
  
  // If session start times don't match, this is a new session after browser close
  if (lastSessionStart && currentSessionStart && lastSessionStart !== currentSessionStart) {
    return true;
  }
  
  const closedTime = parseInt(browserClosed);
  const now = Date.now();
  
  // Only consider it a browser close if it was closed more than 3 seconds ago
  // Reduced from 5 seconds for better production reliability
  if ((now - closedTime) > 3000) {
    return true;
  }
  
  return false;
}

export function clearBrowserCloseFlag(): void {
  localStorage.removeItem('browserClosed');
  localStorage.removeItem('lastSessionStart');
  localStorage.removeItem('lastSessionFingerprint');
  localStorage.removeItem('sessionRestored');
  localStorage.removeItem('pageHidden');
}



