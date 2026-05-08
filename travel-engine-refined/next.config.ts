import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production"
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

export default nextConfig;
