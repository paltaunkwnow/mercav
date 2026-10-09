import path from "node:path";

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
  allowedDevOrigins: ["127.0.0.1"],
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/Implementacion Nueva Kosher/**",
          "**/.cursor/**",
          "**/.claude/**",
          "**/obsidian/**",
        ],
      };
      // Los paquetes (framer-motion y otros) traen `//# sourceMappingURL=` relativos a su carpeta; dentro del chunk
      // apuntan a /_next/static/chunks/... y DevTools recibía 404. Se quitan solo en desarrollo.
      config.module.rules.unshift({
        test: /\.m?js$/,
        include: /node_modules/,
        enforce: "pre",
        use: [{ loader: path.resolve(process.cwd(), "scripts/webpack/strip-source-map-url.cjs") }],
      });
    }
    return config;
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
// creado por pato dev y askforvini
