/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  trailingSlash: true,
  basePath: process.env.BASE_HREF || "",
  assetPrefix: process.env.BASE_HREF || "",
};

export default nextConfig;
