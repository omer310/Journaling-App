/**
 * Security configuration and utilities for the journaling app
 */

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
 * Validate input for potential XSS
 */
export function validateInput(input: string): boolean {
  // Check for common XSS patterns
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /<form/gi,
    /<input/gi,
    /<textarea/gi,
    /<select/gi,
    /<button/gi,
    /<link/gi,
    /<meta/gi,
    /<style/gi
  ];
  
  return !xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Sanitize user input for safe display
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate URL for safe navigation
 */
export function validateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
} 