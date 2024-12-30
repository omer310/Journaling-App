/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // Add a rewrite rule for dynamic routes
  async rewrites() {
    return [
      {
        source: '/journal/:id',
        destination: '/journal/[id]',
      },
    ];
  },
  // Allow dynamic routes to be handled at runtime
  experimental: {
    allowDynamicRouting: true,
  },
} 