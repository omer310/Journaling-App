/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production' ? '/Journaling-app' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Journaling-app/' : '',
}

module.exports = nextConfig 