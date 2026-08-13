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
        // Hardcoded directly to your live backend to bypass Vercel cache bugs
        destination: 'https://mantainq-backend-oyuft9dj0-mujahid-s-projects-340b72d2.vercel.app/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;