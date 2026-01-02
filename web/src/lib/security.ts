/**
 * Security configuration and utilities for the journaling app
 */

import sanitizeFilename from 'sanitize-filename';
import DOMPurify from 'dompurify';

// CSP Configuration
export const CSP_CONFIG = {
  // Default source restrictions
  defaultSrc: ["'self'"],
  
  // Script sources - allow inline scripts for Next.js and safe sources
  scriptSrc: [
    "'self'",
    "'unsafe-eval'", // Required for Next.js development
    "'unsafe-inline'", // Required for Next.js
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com"
  ],
  
  // Style sources - allow inline styles and Google Fonts
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for styled-components and CSS-in-JS
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com"
  ],
  
  // Font sources - allow Google Fonts
  fontSrc: [
    "'self'",
    "https://fonts.gstatic.com",
    "data:"
  ],
  
  // Image sources - allow data URIs and common image sources
  imgSrc: [
    "'self'",
    "data:",
    "https:",
    "blob:"
  ],
  
  // Connect sources - allow API calls to Supabase and other services
  connectSrc: [
    "'self'",
    "https://*.supabase.co",
    "https://api.supabase.com",
    "wss://*.supabase.co"
  ],
  
  // Media sources - allow audio/video content
  mediaSrc: [
    "'self'",
    "data:",
    "https:"
  ],
  
  // Object sources - restrict plugins
  objectSrc: ["'none'"],
  
  // Frame sources - allow embedding in trusted sources
  frameSrc: ["'self'"],
  
  // Worker sources - allow service workers
  workerSrc: [
    "'self'",
    "blob:"
  ],
  
  // Manifest sources - allow web app manifest
  manifestSrc: ["'self'"],
  
  // Form action - restrict form submissions
  formAction: ["'self'"],
  
  // Base URI - restrict base tag
  baseUri: ["'self'"],
  
  // Upgrade insecure requests - force HTTPS
  upgradeInsecureRequests: true
};

/**
 * Generate CSP header string from configuration
 */
export function generateCSP(): string {
  const directives: string[] = [];
  
  // Add each directive
  Object.entries(CSP_CONFIG).forEach(([key, values]) => {
    if (key === 'upgradeInsecureRequests') {
      if (values === true) {
        directives.push('upgrade-insecure-requests');
      }
    } else if (Array.isArray(values)) {
      const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      directives.push(`${directiveName} ${values.join(' ')}`);
    }
  });
  
  return directives.join('; ');
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSP(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};

/**
 * Strict DOMPurify configuration for validation - removes all dangerous tags
 * This configuration is used to detect if dangerous content exists in input
 */
const strictPurifyConfig = {
  ALLOWED_TAGS: [], // No tags allowed - pure text only
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true, // Keep text content but remove all tags
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
  RETURN_TRUSTED_TYPE: false
};

/**
 * Validate input for potential XSS
 * Uses DOMPurify library instead of regex to properly handle:
 * - Invalid HTML syntax (e.g., </script foo="bar">)
 * - Case variations in tag names (e.g., <SCRIPT>, <Script>)
 * - HTML comments ending with --!>
 * - All browser-forgiving HTML parser edge cases
 * 
 * This approach uses DOMPurify's robust HTML parsing instead of regex,
 * which cannot properly handle browser-forgiving HTML syntax.
 */
export function validateInput(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return true;
  }
  
  // Check for dangerous protocols/patterns in the text content
  // These can be dangerous even without HTML tags
  const dangerousPatterns = [
    /javascript:/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
    /file:/gi
  ];
  
  // If dangerous patterns found, input is invalid
  if (dangerousPatterns.some(pattern => pattern.test(input))) {
    return false;
  }
  
  // If input contains HTML-like content, use DOMPurify to detect dangerous tags
  // DOMPurify properly handles all edge cases that regex cannot catch
  if (/<[^>]+>/i.test(input)) {
    // Sanitize with a config that only allows safe tags
    // If dangerous tags were present, they will be removed
    const safeConfig = {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'u', 'span'], // Only safe tags
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    };
    
    const sanitized = DOMPurify.sanitize(input, safeConfig);
    
    // If sanitized output is significantly different, dangerous content was removed
    // This indicates the input contained dangerous HTML tags
    const originalLength = input.replace(/\s+/g, '').length;
    const sanitizedLength = sanitized.replace(/\s+/g, '').length;
    const lengthDiff = originalLength - sanitizedLength;
    
    // If more than 20 characters were removed (likely dangerous tags), input is invalid
    // This threshold accounts for tag removal while allowing for whitespace differences
    if (lengthDiff > 20) {
      return false;
    }
  }
  
  return true;
}

/**
 * Remove HTML comments from input
 * Uses DOMPurify to properly handle HTML comments, including:
 * - Comments ending with --!> (browser-forgiving syntax)
 * - Nested comment patterns
 * - All HTML comment edge cases
 * Example: "<!<!--- comment --->>" should become empty string, not "<!-- comment -->"
 */
export function removeHtmlComments(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Use DOMPurify with config that removes comments
  // DOMPurify properly handles --!> endings and all comment edge cases
  const config = {
    ...strictPurifyConfig,
    // DOMPurify automatically removes HTML comments, but we can be explicit
    KEEP_CONTENT: true
  };
  
  // DOMPurify will remove all HTML including comments
  // Then we extract just the text content
  return DOMPurify.sanitize(input, config);
}

/**
 * Sanitize file path or filename to prevent directory traversal attacks
 * Uses the sanitize-filename library which handles all corner cases
 * Example: "/./.././" should be sanitized to prevent path traversal
 */
export function sanitizePath(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Use the sanitize-filename library for robust path sanitization
  // This handles directory traversal patterns like /../, /./, etc.
  return sanitizeFilename(input);
}

/**
 * Sanitize user input for safe display (returns plain text, no HTML)
 * Uses DOMPurify library to properly handle HTML tag removal, including:
 * - Invalid HTML syntax (e.g., </script foo="bar">)
 * - Case variations in tag names
 * - HTML comments ending with --!>
 * - All browser-forgiving HTML parser edge cases
 * Then applies iterative replacement for other dangerous patterns
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // First, use DOMPurify to remove all HTML tags properly
  // This handles all edge cases that regex cannot catch
  let sanitized = DOMPurify.sanitize(input, strictPurifyConfig);
  
  // Then apply iterative replacement for other dangerous patterns
  // This prevents malicious content from reappearing after sanitization
  let previous: string;
  do {
    previous = sanitized;
    
    // Remove all potentially dangerous patterns in one pass
    sanitized = sanitized
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/data:text\/html/gi, '') // Remove data: HTML
      .replace(/on\w+\s*=/gi, ''); // Remove event handlers
      
  } while (sanitized !== previous);
  
  return sanitized.trim();
}

/**
 * Sanitize URL by replacing dangerous schemes with safe placeholder
 * Checks for javascript:, data:, and vbscript: schemes which can execute code
 * Follows the recommendation to check all three dangerous schemes, not just javascript:
 * @param url - The URL to sanitize
 * @returns Sanitized URL (about:blank for dangerous schemes, original URL otherwise)
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return 'about:blank';
  }
  
  try {
    // Decode, trim, and convert to lowercase for scheme checking
    // Using decodeURI as recommended (safer than decodeURIComponent for URL validation)
    const decoded = decodeURI(url).trim().toLowerCase();
    
    // Check for dangerous schemes that can execute code
    // Must check all three: javascript:, data:, and vbscript:
    if (decoded.startsWith('javascript:') || 
        decoded.startsWith('data:') || 
        decoded.startsWith('vbscript:')) {
      return 'about:blank';
    }
    
    // Return original URL if safe
    return url;
  } catch {
    // If URL parsing fails, return safe placeholder
    return 'about:blank';
  }
}

/**
 * Validate URL for safe navigation
 * Explicitly rejects javascript:, data:, and vbscript: schemes which can execute code
 * Only allows http and https protocols for safe navigation
 * Follows the recommendation to check all three dangerous schemes, not just javascript:
 */
export function validateUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  try {
    // Decode, trim, and convert to lowercase for scheme checking
    // Using decodeURI as recommended (safer than decodeURIComponent for URL validation)
    const decoded = decodeURI(url).trim().toLowerCase();
    
    // Explicitly reject dangerous schemes that can execute code
    // Must check all three: javascript:, data:, and vbscript:
    if (decoded.startsWith('javascript:') || 
        decoded.startsWith('data:') || 
        decoded.startsWith('vbscript:')) {
      return false;
    }
    
    // Parse URL to check protocol
    const parsed = new URL(url);
    
    // Only allow http and https protocols for safe navigation
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    // If URL parsing fails, reject it
    return false;
  }
} 