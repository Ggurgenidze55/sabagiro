/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/sabagiro.html', destination: '/', permanent: true },
      { source: '/index.html', destination: '/', permanent: false },
    ];
  },
};

export default nextConfig;
