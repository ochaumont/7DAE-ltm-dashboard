/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  // Static export (for nginx) only on production builds. `next build` always
  // sets NODE_ENV=production, so Jenkins / `npm run build` still produce `out/`.
  // In dev we keep the full Next.js server.
  output: isProd ? "export" : undefined,
  // No trailingSlash: the backend (Spring Boot 4) 404s on a trailing slash, and
  // nginx `try_files $uri $uri/ $uri.html` serves the static export fine without
  // it. basePath/assetPrefix come from BASE_HREF, set by Jenkins for prod only.
  basePath: process.env.BASE_HREF || "",
  assetPrefix: process.env.BASE_HREF || "",
};

export default nextConfig;
