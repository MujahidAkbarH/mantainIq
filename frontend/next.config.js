/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com', 'api.qrserver.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // Points directly to your clean live production backend
        destination: 'https://mantainq-backend.vercel.app/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;