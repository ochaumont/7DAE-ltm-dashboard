/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  // Static export (for nginx) only on production builds. `next build` always
  // sets NODE_ENV=production, so Jenkins / `npm run build` still produce `out/`.
  // In dev we keep the full Next.js server so the API proxy rewrite below works
  // — rewrites are ignored entirely under `output: "export"`.
  output: isProd ? "export" : undefined,
  // NO trailingSlash: it breaks the dev API proxy. trailingSlash:true makes
  // Next.js append a trailing slash to the rewrite destination, and the backend
  // (Spring Boot 4, trailing-slash matching disabled by default) 404s on
  // /api/infos/labtestmeans/. nginx `try_files $uri $uri/ $uri.html` serves the
  // static export fine without it.
  skipTrailingSlashRedirect: true,
  basePath: process.env.BASE_HREF || "",
  assetPrefix: process.env.BASE_HREF || "",
  // Proxy browser API calls through the dev server to avoid CORS in development.
  // In production the browser calls NEXT_PUBLIC_ATOM_API_BASE_URL (the gateway)
  // directly, so this rewrite is dev-only and harmless to the static export.
  async rewrites() {
    const backendUrl =
      process.env.ATOM_API_PROXY_TARGET ||
      "http://localhost:8080/atom-synchronizer-dev";
    return [
      // basePath: false so the rule matches /atom-api-proxy/* at the ROOT.
      // Otherwise Next prefixes it with basePath (/atom-ltm-dashboard/...) and
      // the raw browser fetch to /atom-api-proxy/* never matches → Next 404.
      //
      // Defensive trailing-slash rule first: if the browser still sends the
      // slash form (e.g. a cached 308), forward it WITHOUT the slash so the
      // backend (which 404s on a trailing slash) still answers.
      {
        source: "/atom-api-proxy/:path*/",
        destination: `${backendUrl}/:path*`,
        basePath: false,
      },
      {
        source: "/atom-api-proxy/:path*",
        destination: `${backendUrl}/:path*`,
        basePath: false,
      },
    ];
  },
};

export default nextConfig;
