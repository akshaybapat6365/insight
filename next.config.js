/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'sharp'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase the body size limit for file uploads
    },
  },
};

module.exports = nextConfig;
