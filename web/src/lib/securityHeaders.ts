/**
 * Static security headers used in middleware (Edge runtime safe — no DOM APIs).
 * DOMPurify and other browser-only utilities live in security.ts, not here.
 */

const _appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || '';
const _appDomainEntries = _appDomain ? [`https://*.${_appDomain}`] : [];

export const CSP_CONFIG = {
  defaultSrc: ["'self'"],

  scriptSrc: [
    "'self'",
    "'unsafe-eval'",
    "'unsafe-inline'",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://challenges.cloudflare.com",
    ..._appDomainEntries,
  ],

  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    "https://fonts.googleapis.com",
    "https://fonts.gstatic.com",
  ],

  fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],

  imgSrc: ["'self'", "data:", "https:", "blob:"],

  connectSrc: [
    "'self'",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://api.clerk.com",
    "https://clerk-telemetry.com",
    ..._appDomainEntries,
  ],

  mediaSrc: ["'self'", "data:", "https:"],

  objectSrc: ["'none'"],

  frameSrc: [
    "'self'",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://challenges.cloudflare.com",
    ..._appDomainEntries,
  ],

  workerSrc: ["'self'", "blob:"],

  manifestSrc: ["'self'"],

  formAction: ["'self'"],

  baseUri: ["'self'"],

  upgradeInsecureRequests: true,
};

export function generateCSP(): string {
  const directives: string[] = [];

  Object.entries(CSP_CONFIG).forEach(([key, values]) => {
    if (key === 'upgradeInsecureRequests') {
      if (values === true) directives.push('upgrade-insecure-requests');
    } else if (Array.isArray(values)) {
      const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      directives.push(`${directiveName} ${values.join(' ')}`);
    }
  });

  return directives.join('; ');
}

export const SECURITY_HEADERS = {
  'Content-Security-Policy': generateCSP(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};
