/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/orion/:path*", destination: `${process.env.NEXT_PUBLIC_ORION_URL}/v2/:path*` },
      { source: "/api/ql/:path*",    destination: `${process.env.NEXT_PUBLIC_QL_URL}/v2/:path*` },
    ];
  },
};
module.exports = nextConfig;