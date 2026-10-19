/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.SELF_HOSTED_BUILD === "1"
    ? { output: "standalone", experimental: { cpus: 1 } }
    : {}),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
