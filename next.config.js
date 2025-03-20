/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase the body size limit for file uploads
    },
  },
  env: {
    NEXT_PUBLIC_ADMIN_KEY: process.env.NEXT_PUBLIC_ADMIN_KEY || 'adminpass',
  },
  images: {
    domains: ['assets.example.com'],
  },
};

module.exports = nextConfig;
