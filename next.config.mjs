/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  serverExternalPackages: ["@react-pdf/renderer"],
  basePath: process.env.BASE_HREF || "",
  assetPrefix: process.env.BASE_HREF || "",
};

export default nextConfig;
