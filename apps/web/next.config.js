/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', '@mbongo/shared'],
  },
  webpack: (config) => {
    // Allow importing from shared package
    config.resolve.alias = {
      ...config.resolve.alias,
      '@mbongo/shared': require('path').resolve(__dirname, '../../packages/shared/src/index.ts'),
    };
    return config;
  },
  // Enable TypeScript type checking during development
  typescript: {
    ignoreBuildErrors: false,
  },
  // Environment variables
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Headers for security
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
