import { NextRequest } from "next/server";

import { markOrderPaid } from "@/lib/pay/service";
import { verifyNotify } from "@/lib/pay/ltzf";

export const dynamic = "force-dynamic";

/**
 * 蓝兔支付异步通知（form POST）。
 * 验签通过才处理；重复通知由 markOrderPaid 的幂等保证只生效一次。
 * 返回纯文本 success，让蓝兔停止重试。
 */
export async function POST(req: NextRequest) {
  let form: Record<string, string> = {};
  try {
    const data = await req.formData();
    form = Object.fromEntries(
      Array.from(data.entries()).map(([k, v]) => [k, String(v)])
    );
  } catch {
    return new Response("FAIL", { status: 400 });
  }

  const payload = verifyNotify(form);
  if (!payload.valid) {
    console.error("[pay] notify signature check failed", form.out_trade_no);
    return new Response("FAIL", { status: 400 });
  }
  if (!payload.paid || !payload.outTradeNo) {
    return new Response("success");
  }

  const outcome = await markOrderPaid(
    payload.outTradeNo,
    payload.payNo ?? "",
    payload.amount ?? 0
  );

  if (outcome === "paid" || outcome === "already") {
    return new Response("success");
  }

  console.error("[pay] notify not applied", payload.outTradeNo, outcome);
  return new Response("FAIL", { status: 500 });
}