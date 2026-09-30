const pwnSecurityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
];

const kosherSecurityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async headers() {
    return [
      { source: '/pwn/:path*', headers: pwnSecurityHeaders },
      { source: '/api/pwn/:path*', headers: pwnSecurityHeaders },
      { source: '/kosher/:path*', headers: kosherSecurityHeaders },
      { source: '/api/kosher/:path*', headers: kosherSecurityHeaders },
      // Headers are matched before the middleware rewrites kosher.mercav.lat to /kosher.
      { source: '/:path*', has: [{ type: 'host', value: 'kosher.mercav.lat' }], headers: kosherSecurityHeaders },
    ];
  },
};

export default nextConfig;
