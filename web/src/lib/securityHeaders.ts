/**
 * Static security headers used in middleware (Edge runtime safe — no DOM APIs).
 * DOMPurify and other browser-only utilities live in security.ts, not here.
 */

/**
 * Decode the Clerk publishable key to find the Frontend API host.
 * Key format: pk_test_BASE64 or pk_live_BASE64
 * BASE64 decodes to "{frontend-api-host}$"
 */
function getClerkFrontendApiHost(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
  if (!key) return '';
  try {
    const b64 = key.replace(/^pk_(test|live)_/, '');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    // atob is available in both Deno (Netlify Edge) and browser
    const decoded = atob(padded).replace(/\$$/, '');
    return decoded; // e.g. "clerk.soulpages.life" or "exciting-bullfrog-60.clerk.accounts.dev"
  } catch {
    return '';
  }
}

const _clerkHost = getClerkFrontendApiHost();
// Also allow the accounts subdomain on the same parent domain
const _clerkEntries: string[] = _clerkHost
  ? [`https://${_clerkHost}`, `https://*.${_clerkHost.split('.').slice(1).join('.')}`]
  : [];

// Fallback: explicit domain override via env var (e.g. NEXT_PUBLIC_APP_DOMAIN=soulpages.life)
const _appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || '';
const _appDomainEntries = _appDomain ? [`https://*.${_appDomain}`] : [];

const _extraEntries = [...new Set([..._clerkEntries, ..._appDomainEntries])];

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
    ..._extraEntries,
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
    ..._extraEntries,
  ],

  mediaSrc: ["'self'", "data:", "https:"],

  objectSrc: ["'none'"],

  frameSrc: [
    "'self'",
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
    "https://challenges.cloudflare.com",
    ..._extraEntries,
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
