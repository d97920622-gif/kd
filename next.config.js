// path: next.config.js
/**
 * Next.js configuration baseline for KD SOLUTION IT.
 *
 * Scope of sub-step 1.1: strict build behaviour and safe defaults. Sub-step
 * 1.26 adds the web hardening matrix below. Sub-step 1.30 adds no header here
 * on purpose: the content security policy that names a per-request nonce is
 * built in `middleware.ts`, which is the only place a request exists, and the
 * static half of that policy stays in the data file below. This file stays the
 * single place where the Next.js compiler and build are configured.
 *
 * The header matrix itself is not written here. It is data in
 * `config/security-headers.ts` - one entry per header, with the environment it
 * applies in and the reason it exists - and this file only turns that data into
 * the shape `headers()` returns. Two reasons for the indirection: the matrix is
 * then readable and reviewable without reading build configuration, and
 * `scripts/checks/web-hardening.mjs` can assert on the data and on this
 * consumer separately. The require carries the `.ts` extension for the reason
 * `tailwind.config.ts` documents for the token module: the extension is what
 * makes the specifier unambiguous.
 *
 * @type {import('next').NextConfig}
 */
const { SECURITY_HEADER_SOURCE, securityHeadersFor } = require('./config/security-headers.ts');

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
    // The flag was called `dynamicIO` until Next.js renamed it, and sub-step
    // 1.30 moved to the current name: a flag the framework warns about is a
    // flag the next upgrade removes, and a renamed flag still means what it
    // meant. Nothing is cached implicitly, and a route handler that wants a
    // cache asks for one.
    cacheComponents: false,
  },
  // Development only. The component gallery is reviewed from a browser that
  // reaches the development server through a proxy host rather than through
  // localhost, and Next.js blocks cross-origin requests for its internal
  // assets in development unless the host is named here. The list applies to
  // `next dev` alone; a production server never serves these paths.
  allowedDevOrigins: ['*.e2b.app', 'localhost:3000'],
  /**
   * The web hardening baseline. Every response - documents, stylesheets,
   * scripts, fonts, images - carries the matrix for the environment the server
   * is running in, because a header that covers a document but not the files it
   * loads is a header with a hole in it.
   *
   * `NODE_ENV` is what decides between the two matrices, and it is the build
   * that sets it rather than a switch a runtime can flip: `next start` serves
   * the production matrix, `next dev` serves the development one, and the three
   * production-only headers in the data file are the entire difference.
   */
  async headers() {
    const environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    return [
      {
        source: SECURITY_HEADER_SOURCE,
        headers: securityHeadersFor(environment).map((header) => ({
          key: header.key,
          value: header.value,
        })),
      },
    ];
  },
};

module.exports = nextConfig;
