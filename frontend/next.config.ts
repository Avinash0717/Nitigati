import type { NextConfig } from "next";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const publicEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) =>
    key.startsWith("NEXT_PUBLIC_"),
  ),
) as Record<string, string>;

const nextConfig: NextConfig = {
  env: publicEnv,
};

export default nextConfig;
