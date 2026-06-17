import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
);

/** Run a git command, returning `fallback` if git is unavailable (e.g. the
 * Docker build stage only ships `out/`, never `.git`). */
function git(cmd, fallback) {
  try {
    return (
      execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] })
        .toString()
        .trim() || fallback
    );
  } catch {
    return fallback;
  }
}

// Build-time metadata, surfaced in the in-app "About" dialog so anyone can
// verify WHICH build is deployed without shell access. Jenkins exposes
// GIT_COMMIT / GIT_BRANCH; locally we fall back to the git CLI.
const gitCommit = (process.env.GIT_COMMIT || git("git rev-parse HEAD", "")).slice(
  0,
  7,
) || "unknown";
const gitBranch =
  (process.env.GIT_BRANCH || process.env.BRANCH_NAME || "")
    .replace(/^origin\//, "") ||
  git("git rev-parse --abbrev-ref HEAD", "unknown");
const buildTime = new Date().toISOString();

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
  // Inlined into the client bundle at build time (the App is a static export,
  // so there is no runtime to read these later). Consumed by `AboutDialog`.
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_GIT_COMMIT: gitCommit,
    NEXT_PUBLIC_GIT_BRANCH: gitBranch,
    NEXT_PUBLIC_BUILD_TIME: buildTime,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV || (isProd ? "prod" : "dev"),
  },
};

export default nextConfig;
