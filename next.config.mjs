/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/sabagiro.html', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: false },
      { source: '/shop', destination: '/events', permanent: true },
      { source: '/shop/:slug', destination: '/events/:slug', permanent: true },
    ];
  },
};

export default nextConfig;
