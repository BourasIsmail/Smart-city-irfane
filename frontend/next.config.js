/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  async rewrites() {
    const orionUrl = process.env.NEXT_PUBLIC_ORION_URL || "http://orion:1026";
    const qlUrl = process.env.NEXT_PUBLIC_QL_URL || "http://quantumleap:8668";
    return [
      { source: "/api/orion/:path*", destination: `${orionUrl}/v2/:path*` },
      { source: "/api/ql/:path*", destination: `${qlUrl}/v2/:path*` },
    ];
  },
};
module.exports = nextConfig;
