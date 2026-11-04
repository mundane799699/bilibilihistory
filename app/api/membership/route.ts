import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { getActiveMembership } from "@/lib/pay/service";

export const dynamic = "force-dynamic";

/**
 * 当前登录用户的会员状态，供浏览器插件判断是否展示订阅引导。
 * 未登录时也返回 200，避免插件侧把 401 当成异常。
 */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({
        loggedIn: false,
        active: false,
        plan: null,
        expiresAt: null,
        status: null,
      });
    }

    const membership = await getActiveMembership(session.user.id);
    return NextResponse.json({
      loggedIn: true,
      active: membership?.active ?? false,
      plan: membership?.plan ?? null,
      expiresAt: membership?.expiresAt ?? null,
      status: membership?.status ?? null,
    });
  } catch (error) {
    console.error("获取会员状态失败:", error);
    return NextResponse.json(
      { loggedIn: false, active: false, plan: null, expiresAt: null, status: null },
      { status: 200 }
    );
  }
}