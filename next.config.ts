import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the home Wi-Fi (e.g. 192.168.1.10:3000) load dev scripts. Without it Next.js
  // blocks them for non-localhost origins and taps stop working. Dev server only.
  allowedDevOrigins: ["192.168.*.*"],
};

export default nextConfig;
