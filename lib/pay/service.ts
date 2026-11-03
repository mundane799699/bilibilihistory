import { and, eq, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { memberships, orders, users } from "@/lib/db/schema";
import { getPlan, moneyOf, type Plan } from "./plans";
import {
  createNativeOrder,
  ltzfReady,
  queryNativeOrder,
} from "./ltzf";

/** 本地联调用：没有商户密钥时用假二维码把流程跑通 */
export const isMock = () => process.env.PAY_MOCK === "1";

export const NOTIFY_URL =
  process.env.PAY_NOTIFY_URL ??
  `${process.env.BETTER_AUTH_URL ?? "http://localhost:3001"}/api/pay/notify`;

const DAY_MS = 24 * 60 * 60 * 1000;

/** 蓝兔查单接口限流很严（会返回「请降低请求接口频率」），这里做进程级节流 */
const QUERY_MIN_INTERVAL_MS = 2000;
const ORDER_RECHECK_MS = 15_000;
const RATE_LIMIT_BACKOFF_MS = 30_000;
let lastQueryAt = 0;
/** 被蓝兔限流后，这段时间内不再发起查询 */
let blockedUntil = 0;

async function queryThrottled(outTradeNo: string) {
  const now = Date.now();
  if (now < blockedUntil) {
    return { code: -1, msg: "请求过于频繁，稍后自动重试" };
  }
  const wait = QUERY_MIN_INTERVAL_MS - (now - lastQueryAt);
  if (wait > 0) {
    await new Promise((r) => setTimeout(r, wait));
  }
  lastQueryAt = Date.now();
  const result = await queryNativeOrder(outTradeNo);
  if (result?.code !== 0 && (result?.msg ?? "").includes("频率")) {
    blockedUntil = Date.now() + RATE_LIMIT_BACKOFF_MS;
  }
  return result;
}

function mockQr(text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
  <rect width="240" height="240" fill="#fff"/>
  <g fill="#111">
    ${Array.from({ length: 12 }, (_, y) =>
      Array.from({ length: 12 }, (_, x) =>
        (x * 7 + y * 5 + x * y) % 3 === 0
          ? `<rect x="${20 + x * 16}" y="${20 + y * 16}" width="16" height="16"/>`
          : ""
      ).join("")
    ).join("")}
  </g>
  <text x="120" y="232" font-size="11" text-anchor="middle" fill="#888">${text}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export interface CreatedOrder {
  out_trade_no: string;
  amount: string;
  title: string;
  days: number;
  qr_url: string;
  expires_in: number;
  mock: boolean;
}

function newTradeNo(planId: string): string {
  const stamp = Date.now().toString();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `BW${planId === "year" ? "Y" : "M"}${stamp}${rand}`;
}

/** 下单：写订单 → 找蓝兔要二维码 */
export async function createOrder(
  userId: string,
  planId: string,
  email?: string
): Promise<{ ok: true; order: CreatedOrder } | { ok: false; error: string }> {
  const plan: Plan | null = getPlan(planId);
  if (!plan) return { ok: false, error: "没有这个会员方案" };

  const existing = await getActiveMembership(userId);
  if (existing?.plan === "lifetime") {
    return { ok: false, error: "你已经是永久会员，不用再购买" };
  }
  if (!ltzfReady() && !isMock()) {
    return { ok: false, error: "微信支付尚未配置，请联系作者" };
  }

  const outTradeNo = newTradeNo(plan.id);
  // 联调用的实付金额覆盖：只影响真正提交给蓝兔的金额（以及订单记录），
  // 页面上展示的价格仍然来自 plans，保持不变。生产环境不要设置这个变量。
  const override = (process.env.PAY_TEST_AMOUNT ?? "").trim();
  // 生产环境一律忽略联调金额，防止误配置导致低价售卖
  const useOverride = Boolean(override) && process.env.NODE_ENV !== "production";
  const amount = useOverride ? moneyOf(Number(override)) : moneyOf(plan.price);

  await db.insert(orders).values({
    outTradeNo,
    userId,
    userEmail: email ?? null,
    planId: plan.id,
    amount,
    days: plan.days,
    channel: "wxpay",
  });

  if (isMock()) {
    const qrUrl = mockQr(`MOCK ${amount}`);
    await db
      .update(orders)
      .set({ qrUrl })
      .where(eq(orders.outTradeNo, outTradeNo));
    return {
      ok: true,
      order: {
        out_trade_no: outTradeNo,
        amount,
        title: plan.title,
        days: plan.days,
        qr_url: qrUrl,
        expires_in: 900,
        mock: true,
      },
    };
  }

  const result = await createNativeOrder({
    outTradeNo,
    amount,
    subject: `Bilibili 无限历史记录 ${plan.title}`,
    notifyUrl: NOTIFY_URL,
  });

  if (!result.ok || !result.qrUrl) {
    await db
      .update(orders)
      .set({ status: "closed" })
      .where(eq(orders.outTradeNo, outTradeNo));
    return { ok: false, error: result.message ?? "微信支付下单失败" };
  }

  await db
    .update(orders)
    .set({ qrUrl: result.qrUrl })
    .where(eq(orders.outTradeNo, outTradeNo));

  return {
    ok: true,
    order: {
      out_trade_no: outTradeNo,
      amount,
      title: plan.title,
      days: plan.days,
      qr_url: result.qrUrl,
      expires_in: 900,
      mock: false,
    },
  };
}

/**
 * 标记订单已支付并开通/续期会员。
 * 行锁 + 幂等：同一订单重复回调只生效一次；续费从「到期日与今天中较晚者」往后叠加。
 */
export async function markOrderPaid(
  outTradeNo: string,
  payNo: string,
  amount: number
): Promise<"paid" | "already" | "missing" | "amount_mismatch" | "closed"> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select()
      .from(orders)
      .where(eq(orders.outTradeNo, outTradeNo))
      .for("update");
    const order = rows[0];
    if (!order) return "missing" as const;
    if (order.status === "paid") return "already" as const;
    if (order.status === "closed") return "closed" as const;
    if (Number(order.amount) !== amount) return "amount_mismatch" as const;

    await tx
      .update(orders)
      .set({ status: "paid", payNo, paidAt: new Date() })
      .where(eq(orders.outTradeNo, outTradeNo));

    let [user] = await tx
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, order.userId));

    // 本地开发时账号在线上库里，本地 user 表可能没有这一行；
    // memberships.user_id 有外键，先补一条占位记录，否则写入会失败。
    if (!user) {
      const email = order.userEmail ?? `${order.userId}@local.invalid`;
      await tx
        .insert(users)
        .values({
          id: order.userId,
          name: email.split("@")[0] || "用户",
          email,
          emailVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoNothing();
      user = { email };
    }

    const [current] = await tx
      .select()
      .from(memberships)
      .where(eq(memberships.userId, order.userId))
      .for("update");

    const now = new Date();
    // 未过期就从到期日续，已过期就从今天重新算
    const base =
      current?.expiresAt && current.expiresAt.getTime() > now.getTime()
        ? current.expiresAt
        : now;
    const expiresAt = new Date(base.getTime() + order.days * DAY_MS);

    if (current) {
      await tx
        .update(memberships)
        .set({
          plan: order.planId,
          expiresAt,
          status: "active",
          updatedAt: now,
        })
        .where(eq(memberships.id, current.id));
    } else {
      await tx.insert(memberships).values({
        userId: order.userId,
        email: user?.email ?? "",
        plan: order.planId,
        expiresAt,
        status: "active",
      });
    }

    return "paid" as const;
  });
}

export interface ActiveMembership {
  plan: string | null;
  expiresAt: Date | null;
  status: string;
  active: boolean;
}

export async function getActiveMembership(
  userId: string
): Promise<ActiveMembership | null> {
  const [row] = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId));
  if (!row) return null;
  const now = Date.now();
  const active =
    row.plan === "lifetime" ||
    (!!row.expiresAt && row.expiresAt.getTime() > now);
  return {
    plan: row.plan,
    expiresAt: row.expiresAt,
    status: row.status,
    active,
  };
}

/**
 * 查询订单状态。回调通常先到；没到就主动查一次蓝兔（5 秒内不重复查）。
 * 本地模拟模式下，下单 3 秒后自动视为已支付，方便把整条链路跑通。
 */
export async function checkOrder(userId: string, outTradeNo: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(
      and(eq(orders.outTradeNo, outTradeNo), eq(orders.userId, userId))
    );

  if (!order) return { ok: false as const, error: "订单不存在" };

  if (order.status === "pending") {
    if (isMock()) {
      const age = Date.now() - (order.createdAt?.getTime() ?? 0);
      if (age > 3000) {
        await markOrderPaid(order.outTradeNo, `MOCK${Date.now()}`, Number(order.amount));
      }
    } else if (
      ltzfReady() &&
      (!order.checkedAt ||
        Date.now() - order.checkedAt.getTime() > ORDER_RECHECK_MS)
    ) {
      await db
        .update(orders)
        .set({ checkedAt: new Date() })
        .where(eq(orders.outTradeNo, outTradeNo));

      const q = await queryThrottled(outTradeNo);
      if (q?.payStatus === 1) {
        await markOrderPaid(
          outTradeNo,
          q.payNo ?? "",
          Number(q.totalFee ?? order.amount)
        );
      }
    }
  }

  const [fresh] = await db
    .select()
    .from(orders)
    .where(eq(orders.outTradeNo, outTradeNo));

  return {
    ok: true as const,
    status: fresh?.status ?? order.status,
    membership: await getActiveMembership(userId),
  };
}

export async function closeOrder(outTradeNo: string) {
  await db
    .update(orders)
    .set({ status: "closed" })
    .where(
      and(eq(orders.outTradeNo, outTradeNo), eq(orders.status, "pending"))
    );
}
/**
 * 服务端兜底对账：把用户超时未确认的待支付订单主动向蓝兔查一次。
 *
 * 蓝兔的回调白名单只允许一个域名（目前是旧产品的 Supabase 地址），
 * 新站点的回调送不到，所以不能只靠回调开通会员。
 * 在「打开个人中心」「查单」时各跑一次，用户就算中途关掉支付弹窗，
 * 下次回到站内也会自动补上会员。
 */
export async function reconcileUserOrders(userId: string, limit = 5) {
  if (!ltzfReady() || isMock()) return;
  const cutoff = new Date(Date.now() - 20_000);
  const pending = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.status, "pending"),
        lt(orders.createdAt, cutoff)
      )
    )
    .limit(limit);

  for (const order of pending) {
    const q = await queryThrottled(order.outTradeNo);
    if (q?.payStatus === 1) {
      await markOrderPaid(
        order.outTradeNo,
        q.payNo ?? "",
        Number(q.totalFee ?? order.amount)
      );
    } else if (Date.now() - order.createdAt.getTime() > 20 * 60 * 1000) {
      // 超过 20 分钟仍未支付，蓝兔侧已过期
      await closeOrder(order.outTradeNo);
    }
  }
}

/** 后台手动核对单笔订单：向蓝兔查一次，已支付就开通会员 */
export async function reconcileOrder(outTradeNo: string) {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.outTradeNo, outTradeNo));
  if (!order) return { ok: false as const, error: "订单不存在" };
  if (order.status === "paid") {
    return { ok: true as const, status: "paid" as const };
  }
  if (!ltzfReady()) {
    return { ok: false as const, error: "支付未配置" };
  }
  const q = await queryThrottled(outTradeNo);
  if (q?.payStatus === 1) {
    await markOrderPaid(
      outTradeNo,
      q.payNo ?? "",
      Number(q.totalFee ?? order.amount)
    );
    return { ok: true as const, status: "paid" as const };
  }
  return {
    ok: true as const,
    status: order.status,
    message: q?.msg ?? "蓝兔侧尚未支付",
  };
}
