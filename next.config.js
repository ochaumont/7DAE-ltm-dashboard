/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: process.env.BASE_HREF || '',
  assetPrefix: process.env.BASE_HREF || ''
};

module.exports = nextConfig;
