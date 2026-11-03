import { headers } from "next/headers";

/**
 * 读取当前会话。
 *
 * 开发时 `AUTH_PROXY_TARGET` 指向线上服务，认证与数据都从那里来，
 * 本地数据库里没有任何用户和会话，直接调本地 `auth` 只会拿到 null
 * （表现就是登录成功却立刻被弹回登录页）。所以有代理时改用线上接口。
 */
export async function getSession() {
  const upstream = process.env.AUTH_PROXY_TARGET;

  if (upstream) {
    const incoming = await headers();
    const cookie = incoming.get("cookie") ?? "";
    const origin = process.env.AUTH_PROXY_ORIGIN || new URL(upstream).origin;
    try {
      const res = await fetch(`${upstream}/api/auth/get-session`, {
        headers: { cookie, origin },
        cache: "no-store",
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      return data?.session ? data : null;
    } catch (error) {
      // 上游不可达时按未登录处理，避免整页 500
      console.error("[session] upstream unreachable:", (error as Error).message);
      return null;
    }
  }

  const { auth } = await import("./auth");
  return auth.api.getSession({ headers: await headers() });
}