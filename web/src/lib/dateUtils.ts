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
  
  // Create a local datetime string that won't be affected by timezone conversion
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Inactivity timer utilities for security
export function getLastActivityTime(): number {
  return parseInt(localStorage.getItem('lastActivityTime') || '0');
}

export function updateLastActivityTime(): void {
  localStorage.setItem('lastActivityTime', Date.now().toString());
}

export function getInactivityTimeout(): number {
  // Default to 30 minutes (1800000 ms), but can be configured
  return parseInt(localStorage.getItem('inactivityTimeout') || '1800000');
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