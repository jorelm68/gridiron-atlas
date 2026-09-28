import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Logos/headshots hotlinked from ESPN and NFL CDNs; stadium photos from Wikimedia Commons.
    remotePatterns: [
      { protocol: "https", hostname: "a.espncdn.com" },
      { protocol: "https", hostname: "static.www.nfl.com" },
      // Wildcarded: Wikipedia's REST API (used to source stadium photos) serves thumbnails from
      // `thumb.wikimedia.org` as well as `upload.wikimedia.org`, depending on the image.
      { protocol: "https", hostname: "*.wikimedia.org" },
    ],
  },
};

export default nextConfig;
