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
  // 本地开发时把认证请求转发到线上服务：浏览器看到的始终是同源地址，
  // 绕开线上缺少 CORS 头的问题，也省掉跨站 cookie 的麻烦。
  // 认证和业务接口一起代理，保证会话与数据来自同一个后端。
  async rewrites() {
    const upstream = process.env.AUTH_PROXY_TARGET;
    if (!upstream) return { beforeFiles: [], afterFiles: [], fallback: [] };
    // 必须放 beforeFiles：仓库里本来就有 app/api/* 路由文件，
    // 默认的 afterFiles 阶段会让本地路由先命中，请求根本到不了线上。
    return {
      beforeFiles: [
        {
          source: "/api/:path*",
          destination: `${upstream}/api/:path*`,
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
}

export default nextConfig