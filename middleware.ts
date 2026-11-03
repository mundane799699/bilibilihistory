import { NextRequest, NextResponse } from "next/server";

/**
 * 开发代理：/api/* 会被 next.config.mjs 转发到线上服务。
 * 线上开了 CSRF 来源校验，浏览器带来的 Origin 是 localhost，会被拒绝（Invalid origin），
 * 所以这里把 Origin / Referer 改写成上游域名，再交给 rewrite 转发。
 */
function proxyHeaders(req: NextRequest) {
  const upstream = process.env.AUTH_PROXY_TARGET;
  if (!upstream) return null;
  const origin = process.env.AUTH_PROXY_ORIGIN || new URL(upstream).origin;
  const headers = new Headers(req.headers);
  headers.set("origin", origin);
  headers.set("referer", `${origin}/`);
  return headers;
}

/** 后台页面与后台接口共用同一套 Basic 凭据 */
function basicAuthOk(req: NextRequest) {
  const basicAuth = req.headers.get("authorization");
  if (!basicAuth) return false;
  const authValue = basicAuth.split(" ")[1] ?? "";
  // Using Buffer to decode base64 to be compatible with Node.js and Edge runtimes
  const [user, pwd] = Buffer.from(authValue, "base64").toString().split(":");
  return (
    user === process.env.MEMBERSHIPS_USERNAME &&
    pwd === process.env.MEMBERSHIPS_PASSWORD
  );
}

export function middleware(req: NextRequest) {
  // 订单接口带支付数据，必须和后台页面用同一套凭据
  if (req.nextUrl.pathname.startsWith("/api/orders")) {
    if (!basicAuthOk(req)) {
      return new NextResponse("Authentication required", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="Secure Area"' },
      });
    }
    return NextResponse.next();
  }

  // 只代理 API，页面本身仍由本地 Next.js 渲染新界面
  if (req.nextUrl.pathname.startsWith("/api")) {
    const headers = proxyHeaders(req);
    return headers
      ? NextResponse.next({ request: { headers } })
      : NextResponse.next();
  }

  // /memberships 保留原有的 Basic Auth
  if (basicAuthOk(req)) return NextResponse.next();

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"',
    },
  });
}

export const config = {
  matcher: ["/memberships", "/memberships/:path*", "/api/:path*"],
};
