import { NextRequest, NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { checkOrder, createOrder } from "@/lib/pay/service";

export const dynamic = "force-dynamic";

/**
 * 支付接口（本地实现，不走 Supabase Edge Function）
 *   POST /api/pay { action: "create", plan: "month" | "year" }
 *   POST /api/pay { action: "check", out_trade_no }
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body?.action ?? "create";

  if (action === "create") {
    const plan = String(body?.plan ?? "");
    const result = await createOrder(session.user.id, plan, session.user.email);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json(result.order);
  }

  if (action === "check") {
    const outTradeNo = String(body?.out_trade_no ?? "");
    if (!outTradeNo) {
      return NextResponse.json({ error: "缺少订单号" }, { status: 400 });
    }
    const result = await checkOrder(session.user.id, outTradeNo);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "未知操作" }, { status: 400 });
}