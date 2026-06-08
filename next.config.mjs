/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverComponentsExternalPackages: ['pg', '@prisma/adapter-pg', '@prisma/client'],
  },
async headers() {
    return [
      {
        source: '/downloads/sabagiro-android.apk',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/vnd.android.package-archive',
          },
          {
            key: 'Content-Disposition',
            value: 'attachment; filename="sabagiro-android.apk"',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/sabagiro.html', destination: '/', permanent: true },
      { source: '/ir.html', destination: '/rules', permanent: true },
      { source: '/index.html', destination: '/', permanent: false },
      { source: '/shop', destination: '/events', permanent: true },
      { source: '/shop/:slug', destination: '/events/:slug', permanent: true },
    ];
  },
};

export default nextConfig;
