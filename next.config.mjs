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
  // 本地开发时把账号与历史数据接口转发到线上服务：浏览器看到的始终是同源地址，
  // 绕开线上缺少 CORS 头的问题，也省掉跨站 cookie 的麻烦。
  // 注意：/api/pay 不在这里，支付必须由本地代码处理。
  async rewrites() {
    const upstream = process.env.AUTH_PROXY_TARGET;
    if (!upstream) return { beforeFiles: [], afterFiles: [], fallback: [] };
    const paths = ["auth", "history", "memberships"];
    // 必须放 beforeFiles：仓库里本来就有 app/api/* 路由文件，
    // 默认的 afterFiles 阶段会让本地路由先命中，请求根本到不了线上。
    return {
      beforeFiles: paths.map((p) => ({
        source: `/api/${p}/:path*`,
        destination: `${upstream}/api/${p}/:path*`,
      })),
      afterFiles: [],
      fallback: [],
    };
  },
}

export default nextConfig