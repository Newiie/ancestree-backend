/** @type {import('next').NextConfig} */
const nextConfig = {
    // Add rewrites for proxying API requests
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  },
};

export default nextConfig;
