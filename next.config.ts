import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Logos/headshots hotlinked from ESPN and NFL CDNs; stadium photos from Wikimedia Commons.
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "static.www.nfl.com" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

export default nextConfig;
