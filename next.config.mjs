/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingIncludes: {
    "/**": ["./prisma/wellness.db", "./prisma/schema.prisma"],
    "/*": ["./prisma/wellness.db", "./prisma/schema.prisma"],
  },
};

export default nextConfig;
