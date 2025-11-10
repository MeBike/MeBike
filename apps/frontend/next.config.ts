import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "tngo.vn",
      },
      {
        protocol: "https",
        hostname: "media.bongda.com.vn",
      },
    ],
  },
};

export default nextConfig;
