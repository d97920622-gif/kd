// path: next.config.js
/**
 * Next.js configuration baseline for KD SOLUTION IT.
 *
 * Scope of sub-step 1.1: strict build behaviour and safe defaults only.
 * Security headers, CSP nonce handling, redirects and rewrites are added by
 * sub-steps 1.26 and 1.30 of step 1 through the append protocol; this file
 * stays the single place where the Next.js compiler and build are configured.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    // Zero tolerance: an ESLint error must always fail the build.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Zero tolerance: a type error must always fail the build.
    ignoreBuildErrors: false,
  },
  compiler: {
    // Defense in depth: strip any console call that ever slips into a
    // production client bundle. The no-console lint rule forbids them.
    removeConsole: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    // Keep route handler caching explicit; handlers opt in where required.
    dynamicIO: false,
  },
};

module.exports = nextConfig;
